'use server';

import { getCatalogCategories } from '@/lib/supabase/actions';

export interface ProdyGeneratedProduct {
  name: string;
  slug: string;
  category_id?: string | null;
  category_slug: string;
  subcategory_id?: string | null;
  subcategory_name?: string | null;
  category_slugs: string[];
  price_usd: number;
  original_price_usd?: number | null;
  short_description: string;
  full_description: string;
  version?: string;
  release_year?: string;
  license_type?: string;
  vst_format?: string | null;
  operating_system?: string | null;
  supported_daws?: string | null;
  license_delivery_type: 'pool' | 'direct_download';
}

export interface ProdyBrainstormIdea {
  title: string;
  category: 'plugin' | 'sample-pack';
  subcategory: string;
  tagline: string;
  genres: string[];
  suggested_price: number;
  prompt: string;
}

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY is not configured in environment variables (.env.local).');
  }
  return key;
}

/**
 * Server Action: Generate complete product metadata from a user idea or rough prompt
 */
export async function generateProductWithProdyAction(params: {
  prompt: string;
  categorySlug?: string;
  brandName?: string;
}): Promise<{
  success: boolean;
  data?: ProdyGeneratedProduct;
  error?: string;
}> {
  const { prompt, categorySlug = 'auto', brandName = 'Producer Toy' } = params;

  if (!prompt || !prompt.trim()) {
    return { success: false, error: 'Please provide an idea, rough prompt, or sound concept.' };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'Groq API key not configured on server.' };
  }

  try {
    // 1. Fetch available database categories & subcategories so Prody can match them accurately
    const { categories, subcategories } = await getCatalogCategories();

    const categoryNames = categories.map((c) => `${c.name} (${c.slug})`).join(', ');
    const subcategoryNames = subcategories.map((s) => s.name).join(', ');

    // 2. Build system instructions
    const systemPrompt = `You are Prody, the official AI Audio Product Copilot for Producer Toy (producertoy.com) and Toy Creator.
You specialize in audio plugins, VST3/AU DSP instruments, sound presets, and sample packs / drum libraries.
Your mission is to convert a creator's rough idea into a world-class, commercial audio product catalog listing.

CATALOG KNOWLEDGE:
- Available Categories: ${categoryNames}
- Available Subcategories: ${subcategoryNames}
- Popular Genres: Hip Hop, Trap, Drill, Bollywood, Lo-Fi, EDM, Pop, Cinematic, R&B, Rock, Acoustic, Ambient, Techno, Phonk, Synthwave

RULES:
1. Return strictly valid JSON matching the exact schema requested.
2. The title should be memorable, punchy, and commercial (e.g. "TapeWarp", "Drill Dynasty", "ProVerb", "Silk Vocal Hooks", "Serum Future Bass").
3. Generate a clean URL slug (lowercase, dashes only).
4. For short_description: 1 crystal-clear marketing hook (maximum 20 words).
5. For full_description: Use clean Markdown with bullet points highlighting sound character, DSP features / sample contents, and workflow benefits.
6. Set realistic competitive pricing (e.g. sale: $19-$49, regular: $29-$79).
7. If category is "plugin", set license_delivery_type to "pool" (serial key licensing). If "sample-pack" or "preset", set to "direct_download".
8. Include 4 to 6 relevant genres in category_slugs.`;

    const userPrompt = `Creator / Brand: "${brandName}"
Category Preference: ${categorySlug}
Creator's Concept / Idea: "${prompt.trim()}"

Generate a complete audio product listing in valid JSON with this exact structure:
{
  "name": "string (Commercial product title)",
  "slug": "string (url-safe-slug)",
  "category_slug": "plugin" or "sample-pack",
  "subcategory_name": "string (matching subcategory or creative new subcategory)",
  "category_slugs": ["genre1", "genre2", "genre3", "genre4"],
  "price_usd": number (e.g. 29.00),
  "original_price_usd": number (e.g. 49.00),
  "short_description": "string (1-sentence punchy hook)",
  "full_description": "string (markdown description with bullets and sound character)",
  "version": "1.0.0",
  "release_year": "2025",
  "license_type": "Royalty-Free Commercial",
  "vst_format": "VST3, AU, AAX (64-bit)",
  "operating_system": "macOS (Apple Silicon & Intel), Windows 10/11",
  "supported_daws": "Ableton Live, FL Studio, Logic Pro, Pro Tools, Studio One, Reaper, Cubase",
  "license_delivery_type": "pool" or "direct_download"
}`;

    // 3. Call Groq
    const modelsToTry = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    let jsonContent: any = null;

    for (const model of modelsToTry) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.4,
            max_tokens: 1400,
          }),
        });

        if (res.ok) {
          const body = await res.json();
          const rawText = body.choices?.[0]?.message?.content;
          if (rawText) {
            jsonContent = JSON.parse(rawText);
            break;
          }
        }
      } catch (e) {
        console.warn(`[Prody] Model ${model} failed, trying fallback...`, e);
      }
    }

    if (!jsonContent) {
      return { success: false, error: 'Prody is momentarily busy. Please try again.' };
    }

    // 4. Map returned category and subcategory names to database UUIDs
    const matchedCat = categories.find(
      (c) => c.slug === jsonContent.category_slug || (jsonContent.category_slug === 'plugin' ? c.slug === 'plugin' : c.slug === 'sample-pack')
    );

    const matchedSub = subcategories.find(
      (s) =>
        s.name.toLowerCase() === (jsonContent.subcategory_name || '').toLowerCase() ||
        (matchedCat && s.category_id === matchedCat.id && s.slug === (jsonContent.subcategory_name || '').toLowerCase())
    );

    const result: ProdyGeneratedProduct = {
      name: jsonContent.name || 'Untitled Audio Product',
      slug: (jsonContent.slug || jsonContent.name || 'audio-product')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, ''),
      category_id: matchedCat?.id || null,
      category_slug: jsonContent.category_slug === 'sample-pack' ? 'sample-pack' : 'plugin',
      subcategory_id: matchedSub?.id || null,
      subcategory_name: matchedSub?.name || jsonContent.subcategory_name || null,
      category_slugs: Array.isArray(jsonContent.category_slugs) ? jsonContent.category_slugs : ['Hip Hop', 'Trap'],
      price_usd: Number(jsonContent.price_usd) || 29.0,
      original_price_usd: jsonContent.original_price_usd ? Number(jsonContent.original_price_usd) : 49.0,
      short_description: jsonContent.short_description || '',
      full_description: jsonContent.full_description || '',
      version: jsonContent.version || '1.0.0',
      release_year: jsonContent.release_year || new Date().getFullYear().toString(),
      license_type: jsonContent.license_type || 'Royalty-Free Commercial',
      vst_format: jsonContent.category_slug === 'plugin' ? jsonContent.vst_format || 'VST3, AU, AAX (64-bit)' : null,
      operating_system: jsonContent.operating_system || 'macOS (Apple Silicon & Intel), Windows 10/11',
      supported_daws: jsonContent.supported_daws || 'Ableton Live, FL Studio, Logic Pro, Pro Tools, Studio One, Reaper',
      license_delivery_type: jsonContent.category_slug === 'plugin' ? 'pool' : 'direct_download',
    };

    return { success: true, data: result };
  } catch (err: any) {
    console.error('generateProductWithProdyAction exception:', err);
    return { success: false, error: err.message || 'Error generating product with Prody.' };
  }
}

/**
 * Server Action: Brainstorm 3 trending audio product concepts when brand has zero ideas
 */
export async function brainstormProductIdeasAction(params: {
  brandName?: string;
  categoryFilter?: string;
}): Promise<{
  success: boolean;
  ideas?: ProdyBrainstormIdea[];
  error?: string;
}> {
  const { brandName = 'Producer Toy', categoryFilter = 'all' } = params;
  const apiKey = getApiKey();
  if (!apiKey) return { success: false, error: 'Groq API key not configured.' };

  try {
    const prompt = `You are Prody, the creative product strategist at Producer Toy.
Brainstorm 3 unique, high-potential commercial audio product ideas for the brand "${brandName}".
Category filter: ${categoryFilter}

Each concept must appeal to modern music producers (Hip Hop, Trap, Bollywood, EDM, Drill, Cinematic, Lo-Fi, Synthwave).
Return strictly valid JSON with this format:
{
  "ideas": [
    {
      "title": "Creative product name",
      "category": "plugin" or "sample-pack",
      "subcategory": "Synthesizer" or "Drum Kits & One-Shots" or "Reverb" or "Vocal Hooks & Chops",
      "tagline": "One compelling line explaining why producers need it",
      "genres": ["Genre1", "Genre2", "Genre3"],
      "suggested_price": 29.00,
      "prompt": "Detailed generation prompt to create the full listing for this idea"
    }
  ]
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!res.ok) {
      return { success: false, error: 'Could not generate ideas from Prody.' };
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    return {
      success: true,
      ideas: Array.isArray(parsed.ideas) ? parsed.ideas : [],
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error brainstorming ideas.' };
  }
}
