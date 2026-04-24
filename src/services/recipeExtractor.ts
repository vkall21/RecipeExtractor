import Anthropic from '@anthropic-ai/sdk';
import { Recipe } from '../types';
import { getLLMConfig, LLMConfig } from './storage';

const isWeb = typeof document !== 'undefined';

const SYSTEM_PROMPT = `You are a recipe extractor. Given webpage text, extract the recipe and return ONLY valid JSON matching this schema (no markdown, no explanation):
{"title":string,"description":string,"image":string|null,"ingredients":string[],"steps":string[]}`;

// ── HTML parsing ──────────────────────────────────────────────────────────────

function parseJsonLd(html: string): Recipe | null {
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const nodes: any[] = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];
      for (const node of nodes) {
        if (node['@type'] === 'Recipe' || (Array.isArray(node['@type']) && node['@type'].includes('Recipe'))) {
          return mapSchemaToRecipe(node);
        }
      }
    } catch {}
  }
  return null;
}

function flattenSteps(instructions: any[]): string[] {
  const result: string[] = [];
  for (const s of instructions) {
    if (typeof s === 'string') { result.push(s); continue; }
    if (s.itemListElement) { result.push(...flattenSteps(s.itemListElement)); continue; }
    if (s.text) { result.push(String(s.text)); continue; }
    result.push(JSON.stringify(s));
  }
  return result;
}

function mapSchemaToRecipe(schema: any): Recipe {
  return {
    id: Date.now().toString(),
    title: schema.name ?? 'Untitled Recipe',
    sourceUrl: '',
    image: Array.isArray(schema.image) ? schema.image[0]?.url ?? schema.image[0] : schema.image?.url ?? schema.image,
    description: schema.description,
    ingredients: (schema.recipeIngredient ?? []).map((i: any) => String(i)),
    steps: flattenSteps(schema.recipeInstructions ?? []),
    savedAt: Date.now(),
  };
}

function parseRecipeJson(text: string): Recipe {
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
  return {
    id: Date.now().toString(),
    title: parsed.title ?? 'Untitled Recipe',
    sourceUrl: '',
    image: parsed.image ?? undefined,
    description: parsed.description,
    ingredients: parsed.ingredients ?? [],
    steps: parsed.steps ?? [],
    savedAt: Date.now(),
  };
}

// ── LLM providers ─────────────────────────────────────────────────────────────

function cleanHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 15000);
}

async function extractWithClaude(html: string, apiKey: string): Promise<Recipe> {
  const client = new Anthropic({
    apiKey,
    ...(isWeb && { dangerouslyAllowBrowser: true }),
  });
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: cleanHtml(html) }],
  });
  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return parseRecipeJson(text);
}

async function extractWithOpenAI(html: string, apiKey: string): Promise<Recipe> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 2048,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: cleanHtml(html) },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `OpenAI error ${res.status}`);
  }
  const data = await res.json();
  return parseRecipeJson(data.choices[0].message.content);
}

async function extractWithGemini(html: string, apiKey: string): Promise<Recipe> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: cleanHtml(html) }] }],
      }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Gemini error ${res.status}`);
  }
  const data = await res.json();
  return parseRecipeJson(data.candidates[0].content.parts[0].text);
}

async function extractWithLLM(html: string, config: LLMConfig | null): Promise<Recipe> {
  const fallbackKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

  if (config) {
    switch (config.provider) {
      case 'openai':  return extractWithOpenAI(html, config.apiKey);
      case 'gemini':  return extractWithGemini(html, config.apiKey);
      case 'claude':  return extractWithClaude(html, config.apiKey);
    }
  }
  // No user key — use built-in Claude key
  return extractWithClaude(html, fallbackKey);
}

// ── HTML fetch via proxy ──────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  if (isWeb) {
    const encoded = encodeURIComponent(url);
    const desktopAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const proxies: Array<() => Promise<string>> = [
      async () => {
        const r = await fetch(`https://corsproxy.io/?${encoded}`, {
          headers: { 'x-cors-headers': JSON.stringify({ 'User-Agent': desktopAgent }) },
        });
        if (!r.ok) throw new Error(`corsproxy ${r.status}`);
        return r.text();
      },
      async () => {
        const r = await fetch(`https://api.allorigins.win/get?url=${encoded}&charset=utf-8`);
        if (!r.ok) throw new Error(`allorigins ${r.status}`);
        const j = await r.json();
        return j.contents as string;
      },
      async () => {
        const r = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encoded}`);
        if (!r.ok) throw new Error(`codetabs ${r.status}`);
        return r.text();
      },
    ];

    let lastErr = '';
    for (const attempt of proxies) {
      try {
        const html = await attempt();
        if (html && html.length > 100) return html;
      } catch (e: any) {
        lastErr = e.message;
        console.log('[extractor] proxy failed:', e.message);
      }
    }
    throw new Error(`All proxies failed. Last error: ${lastErr}`);
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeExtractor/1.0)' },
  });
  if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status}`);
  return response.text();
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function extractRecipeFromUrl(url: string): Promise<Recipe> {
  console.log('[extractor] starting extraction for:', url);
  const html = await fetchHtml(url);
  console.log('[extractor] HTML length:', html.length);
  const fromJsonLd = parseJsonLd(html);
  console.log('[extractor] JSON-LD found:', !!fromJsonLd);

  if (fromJsonLd) {
    fromJsonLd.sourceUrl = url;
    return fromJsonLd;
  }

  const config = await getLLMConfig();
  try {
    const recipe = await extractWithLLM(html, config);
    recipe.sourceUrl = url;
    return recipe;
  } catch (e: any) {
    const msg = e.message ?? '';
    if (msg.includes('credit') || msg.includes('balance') || msg.includes('402') || msg.includes('insufficient')) {
      throw new Error('AI extraction failed: credit balance too low. Add credits or enter your own API key in Settings.');
    }
    if (msg.includes('401') || msg.includes('invalid') || msg.includes('Unauthorized') || msg.includes('API key')) {
      throw new Error('AI extraction failed: invalid API key. Check the key in Settings.');
    }
    throw e;
  }
}
