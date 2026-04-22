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

function mapSchemaToRecipe(schema: any): Recipe {
  const ingredients: string[] = (schema.recipeIngredient ?? []).map((i: any) => String(i));

  const rawSteps = schema.recipeInstructions ?? [];
  const steps: string[] = rawSteps.map((s: any) => {
    if (typeof s === 'string') return s;
    if (s.text) return String(s.text);
    if (s.itemListElement) return s.itemListElement.map((e: any) => e.text ?? e).join(' ');
    return JSON.stringify(s);
  });

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
    const proxies: Array<() => Promise<string>> = [
      async () => {
        const r = await fetch(`https://corsproxy.io/?${encoded}`);
        if (!r.ok) throw new Error(`corsproxy ${r.status}`);
        return r.text();
      },
      async () => {
        const r = await fetch(`https://api.allorigins.win/get?url=${encoded}`);
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

  const recipe = fromJsonLd ?? (await extractWithClaude(html));
  console.log('[extractor] recipe title:', recipe.title);
  recipe.sourceUrl = url;
  return recipe;
}
