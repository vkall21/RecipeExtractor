import Anthropic from '@anthropic-ai/sdk';
import { Recipe } from '../types';

const isWeb = typeof document !== 'undefined';
const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  ...(isWeb && { dangerouslyAllowBrowser: true }),
});

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
    // HowToSection — recurse into its itemListElement
    if (s.itemListElement) { result.push(...flattenSteps(s.itemListElement)); continue; }
    if (s.text) { result.push(String(s.text)); continue; }
    result.push(JSON.stringify(s));
  }
  return result;
}

function mapSchemaToRecipe(schema: any): Recipe {
  const ingredients: string[] = (schema.recipeIngredient ?? []).map((i: any) => String(i));
  const steps = flattenSteps(schema.recipeInstructions ?? []);

  return {
    id: Date.now().toString(),
    title: schema.name ?? 'Untitled Recipe',
    sourceUrl: '',
    image: Array.isArray(schema.image) ? schema.image[0]?.url ?? schema.image[0] : schema.image?.url ?? schema.image,
    description: schema.description,
    ingredients,
    steps,
    savedAt: Date.now(),
  };
}

async function extractWithClaude(html: string): Promise<Recipe> {
  const trimmed = html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 15000);

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: {
      // @ts-ignore — cache_control is valid at runtime
      type: 'text',
      text: `You are a recipe extractor. Given webpage text, extract the recipe and return ONLY valid JSON matching this schema (no markdown, no explanation):
{"title":string,"description":string,"image":string|null,"ingredients":string[],"steps":string[]}`,
      cache_control: { type: 'ephemeral' },
    } as any,
    messages: [{ role: 'user', content: trimmed }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const parsed = JSON.parse(text);
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

async function fetchHtml(url: string): Promise<string> {
  const isWeb = typeof document !== 'undefined';
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

export async function extractRecipeFromUrl(url: string): Promise<Recipe> {
  console.log('[extractor] starting extraction for:', url);
  const html = await fetchHtml(url);
  console.log('[extractor] HTML length:', html.length);
  const fromJsonLd = parseJsonLd(html);
  console.log('[extractor] JSON-LD found:', !!fromJsonLd);

  let recipe: Recipe;
  if (fromJsonLd) {
    recipe = fromJsonLd;
  } else {
    try {
      recipe = await extractWithClaude(html);
    } catch (e: any) {
      const msg = e.message ?? '';
      if (msg.includes('credit') || msg.includes('balance') || msg.includes('402')) {
        throw new Error('This page requires AI extraction but the API credit balance is too low. Please add credits at console.anthropic.com → Billing.');
      }
      throw e;
    }
  }
  console.log('[extractor] recipe title:', recipe.title);
  recipe.sourceUrl = url;
  return recipe;
}
