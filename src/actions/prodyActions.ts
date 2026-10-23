'use server';

import { getCatalogCategories } from '@/lib/supabase/actions';
import { performAudioSeoResearch } from '@/lib/prodySearchEngine';

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
  const key = process.env.PRODY_API_KEY || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('Prody AI key is not configured in environment variables.');
  }
  return key;
}

/**
 * Server Action: Generate complete product metadata from a user idea or rough prompt
 * Grounded in real-time Google search trends & audio competitor research
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
    return { success: false, error: 'Prody AI engine is not configured on server.' };
  }

  try {
    // 1. Fetch available database categories & subcategories so Prody can match them accurately
    const { categories, subcategories } = await getCatalogCategories();

    const categoryNames = categories.map((c) => `${c.name} (slug: ${c.slug})`).join(', ');
    const subcategoryNames = subcategories.map((s) => `${s.name} (id: ${s.id})`).join(', ');

    // 2. Perform live Google search and competitor research for this exact sound/product concept
    const seoDossier = await performAudioSeoResearch(prompt, categorySlug);

    // 3. Build Deep Intent & Google SEO system prompt backed by real research
    const systemPrompt = `You are Prody, the official AI Audio Product Architect and Google SEO Master for Producer Toy (producertoy.com) and Toy Creator.
Your mission is to analyze live Google search trends, competitor benchmarks, and creator concept, then craft an elite, highly commercial, #1 Google-ranking product listing.
NEVER invent random facts, generic filler, or fake product counts. All copy must strictly reflect real audio engineering standards.

TAXONOMY & PLATFORM KNOWLEDGE:
- Categories: ${categoryNames}
- Subcategories: ${subcategoryNames}
- Curated Genres (MUST use exact Title Case strings): "Hip Hop", "Trap", "Drill", "Bollywood", "Lo-Fi", "EDM", "Pop", "Cinematic", "R&B", "Rock", "Acoustic", "Ambient"

${seoDossier.groundedDossierText}

CRITICAL INTENT & CATEGORY RULES:
1. CATEGORY CLASSIFICATION:
   - If the user concept or research mentions "plugin", "reverb", "vst", "au", "aax", "synthesizer", "synth", "compressor", "eq", "dsp", "algorithm", "analyzer", "distortion", "saturation", "delay", "effect", or audio software:
     -> IT IS 100% A PLUGIN (category_slug: "plugin"). NEVER classify it as a sample pack or presets!
     -> vst_format MUST be "VST3, AU, AAX (64-bit)"
     -> license_delivery_type MUST be "pool"
     -> supported_daws MUST be "Ableton Live, FL Studio, Logic Pro, Pro Tools, Studio One, Reaper, Cubase"
     -> operating_system MUST be "macOS (Apple Silicon & Intel), Windows 10/11"
   - If the user concept mentions "sample pack", "samples", "drum kit", "loops", "one-shots", "stems", "vocals", "wav":
     -> IT IS A SAMPLE PACK (category_slug: "sample-pack")
     -> license_delivery_type MUST be "direct_download"
     -> vst_format MUST be null

2. HIGH-INTENT GOOGLE SEO COPYWRITING RULES (STRICT):
   - Product Name: Catchy, commercial, and high-search-intent combining brand name + target keyword + format (e.g. "AuraReverb AI – Smart Waveform Reverb VST3").
   - Short Description: Strictly 145–160 character high-CTR Google SERP meta description containing primary keyword, DAW compatibility, and action. NO truncation.
   - Full Description: Rich, structured Markdown engineered for #1 Google ranking:
     * Semantic H3 title with primary search intent
     * "Why Producers Need This" section with compelling bullet points addressing real mixing problems identified in research
     * "Key Features & DSP Highlights" detailing intelligent processing, low CPU usage, and zero latency
     * "Google FAQ / Rich Snippets" with 3 concise questions (DAW compatibility, royalty-free commercial terms, Apple Silicon native)
     * "Technical Specifications" (formats, bit-depth, OS, sample rate support up to 192kHz)

3. GENRES:
   - Must be an array of 4 to 6 genres chosen ONLY from the Curated Genres list in proper Title Case (never lowercase or hyphenated).

4. SUBCATEGORY:
   - Must match the closest subcategory name from the provided list (e.g., "Reverb", "Synthesizer", "Delay & Echo", "Drum Kits & One-Shots", etc.).

Return strictly valid JSON with this exact schema:
{
  "name": "string",
  "slug": "string",
  "category_slug": "plugin" or "sample-pack",
  "subcategory_name": "string",
  "category_slugs": ["Genre1", "Genre2", "Genre3", "Genre4"],
  "price_usd": number,
  "original_price_usd": number,
  "short_description": "string (strictly 145-160 characters)",
  "full_description": "string (structured markdown)",
  "version": "1.0.0",
  "release_year": "2025",
  "license_type": "Royalty-Free Commercial",
  "vst_format": "VST3, AU, AAX (64-bit)",
  "operating_system": "macOS (Apple Silicon & Intel), Windows 10/11",
  "supported_daws": "Ableton Live, FL Studio, Logic Pro, Pro Tools, Studio One, Reaper, Cubase",
  "license_delivery_type": "pool" or "direct_download"
}`;

    const userPrompt = `Brand / Creator: "${brandName}"
Requested Category Preference: ${categorySlug}
Creator's Product Vision & Sound Concept:
"${prompt.trim()}"

Analyze the attached Google SERP research dossier deeply and construct the complete, top-ranking SEO product listing.`;

    // 4. Call Prody AI Engine with fallback models
    const modelsToTry = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
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
            temperature: 0.35,
            max_tokens: 1600,
          }),
        });

        if (res.ok) {
          const body = await res.json();
          const rawText = body.choices?.[0]?.message?.content;
          if (rawText) {
            jsonContent = JSON.parse(rawText);
            break;
          }
        } else {
          const errText = await res.text();
          console.warn(`[Prody] Model ${model} returned error status ${res.status}:`, errText);
        }
      } catch (e) {
        console.warn(`[Prody] Model ${model} failed, trying fallback...`, e);
      }
    }

    if (!jsonContent) {
      return { success: false, error: 'Prody is momentarily busy. Please try again in a few seconds.' };
    }

    // 4. Intent Recognition Override & Category Mapping
    const lowerPrompt = prompt.toLowerCase();
    const hasPluginKeywords =
      categorySlug === 'plugin' ||
      lowerPrompt.includes('plugin') ||
      lowerPrompt.includes('vst') ||
      lowerPrompt.includes('au ') ||
      lowerPrompt.includes('aax') ||
      lowerPrompt.includes('synthesizer') ||
      lowerPrompt.includes('synth') ||
      lowerPrompt.includes('reverb') ||
      lowerPrompt.includes('delay') ||
      lowerPrompt.includes('compressor') ||
      lowerPrompt.includes('equalizer') ||
      lowerPrompt.includes('eq ') ||
      lowerPrompt.includes('dsp') ||
      lowerPrompt.includes('analyzer') ||
      lowerPrompt.includes('saturation') ||
      lowerPrompt.includes('distortion') ||
      lowerPrompt.includes('audio effect');

    const hasSampleKeywords =
      categorySlug === 'sample-pack' ||
      (!hasPluginKeywords &&
        (lowerPrompt.includes('sample pack') ||
         lowerPrompt.includes('drum kit') ||
         lowerPrompt.includes('one-shot') ||
         lowerPrompt.includes('loops') ||
         lowerPrompt.includes('stems') ||
         lowerPrompt.includes('sound pack')));

    let finalCategorySlug: 'plugin' | 'sample-pack' = 'plugin';
    if (categorySlug === 'plugin') {
      finalCategorySlug = 'plugin';
    } else if (categorySlug === 'sample-pack') {
      finalCategorySlug = 'sample-pack';
    } else if (hasSampleKeywords) {
      finalCategorySlug = 'sample-pack';
    } else if (hasPluginKeywords) {
      finalCategorySlug = 'plugin';
    } else {
      finalCategorySlug = jsonContent.category_slug === 'sample-pack' ? 'sample-pack' : 'plugin';
    }

    const matchedCat = categories.find((c) => c.slug === finalCategorySlug) || categories[0];

    // Subcategory mapping: match exact, slug, or fuzzy
    const returnedSubName = (jsonContent.subcategory_name || '').toLowerCase();
    let matchedSub = subcategories.find(
      (s) =>
        s.category_id === matchedCat?.id &&
        (s.name.toLowerCase() === returnedSubName ||
         s.slug === returnedSubName.replace(/[^a-z0-9]+/g, '-'))
    );

    // Keyword fallback for subcategory if exact name didn't match
    if (!matchedSub && matchedCat) {
      const combinedText = `${returnedSubName} ${lowerPrompt}`;
      matchedSub = subcategories.find(
        (s) => s.category_id === matchedCat.id && combinedText.includes(s.name.toLowerCase())
      );
    }

    // Curated Genre Validation (Force Title Case)
    const VALID_GENRES = [
      'Hip Hop',
      'Trap',
      'Drill',
      'Bollywood',
      'Lo-Fi',
      'EDM',
      'Pop',
      'Cinematic',
      'R&B',
      'Rock',
      'Acoustic',
      'Ambient',
    ];

    const rawGenres = Array.isArray(jsonContent.category_slugs) ? jsonContent.category_slugs : [];
    const sanitizedGenres: string[] = [];
    for (const g of rawGenres) {
      const normalized = String(g).toLowerCase().replace(/[-_]+/g, ' ').trim();
      const match = VALID_GENRES.find((vg) => vg.toLowerCase() === normalized);
      if (match && !sanitizedGenres.includes(match)) {
        sanitizedGenres.push(match);
      }
    }

    // If none matched, apply intelligent genre defaults
    if (sanitizedGenres.length === 0) {
      if (lowerPrompt.includes('drill')) sanitizedGenres.push('Drill', 'Trap', 'Hip Hop');
      else if (lowerPrompt.includes('bollywood') || lowerPrompt.includes('tabla')) sanitizedGenres.push('Bollywood', 'Hip Hop', 'Pop');
      else if (lowerPrompt.includes('lo-fi') || lowerPrompt.includes('lofi')) sanitizedGenres.push('Lo-Fi', 'Hip Hop', 'Ambient');
      else if (lowerPrompt.includes('edm') || lowerPrompt.includes('synth')) sanitizedGenres.push('EDM', 'Pop', 'Cinematic');
      else sanitizedGenres.push('Hip Hop', 'Trap', 'Pop', 'EDM');
    }

    const isPlugin = finalCategorySlug === 'plugin';

    const result: ProdyGeneratedProduct = {
      name: jsonContent.name || 'Untitled Audio Product',
      slug: (jsonContent.slug || jsonContent.name || 'audio-product')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, ''),
      category_id: matchedCat?.id || null,
      category_slug: finalCategorySlug,
      subcategory_id: matchedSub?.id || null,
      subcategory_name: matchedSub?.name || jsonContent.subcategory_name || null,
      category_slugs: sanitizedGenres,
      price_usd: Number(jsonContent.price_usd) || (isPlugin ? 49.0 : 29.0),
      original_price_usd: jsonContent.original_price_usd ? Number(jsonContent.original_price_usd) : (isPlugin ? 89.0 : 49.0),
      short_description: jsonContent.short_description || '',
      full_description: jsonContent.full_description || '',
      version: jsonContent.version || '1.0.0',
      release_year: jsonContent.release_year || new Date().getFullYear().toString(),
      license_type: jsonContent.license_type || 'Royalty-Free Commercial',
      vst_format: isPlugin ? (jsonContent.vst_format || 'VST3, AU, AAX (64-bit)') : null,
      operating_system: isPlugin ? (jsonContent.operating_system || 'macOS (Apple Silicon & Intel), Windows 10/11') : 'Any OS (macOS, Windows, Linux, iOS, Android)',
      supported_daws: jsonContent.supported_daws || 'Ableton Live, FL Studio, Logic Pro, Pro Tools, Studio One, Reaper, Cubase',
      license_delivery_type: isPlugin ? 'pool' : 'direct_download',
    };

    return { success: true, data: result };
  } catch (err: any) {
    console.error('generateProductWithProdyAction exception:', err);
    return { success: false, error: err.message || 'Error generating product with Prody.' };
  }
}

/**
 * Server Action: Brainstorm 3 trending audio product concepts when brand has zero ideas
 * Backed by live Google search and competitor trends
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
  if (!apiKey) return { success: false, error: 'Prody AI engine is not configured.' };

  try {
    const seoDossier = await performAudioSeoResearch(
      categoryFilter !== 'all' ? categoryFilter : 'trending music producer plugins and sample packs 2026',
      categoryFilter
    );

    const prompt = `You are Prody, the official AI Product Strategist & Trend Hunter at Producer Toy.
Brainstorm 3 unique, high-potential commercial audio product ideas for the brand "${brandName}".
Category filter: ${categoryFilter}

${seoDossier.groundedDossierText}

Each concept must be Google SEO-friendly and highly appealing to modern music producers (Hip Hop, Trap, Bollywood, EDM, Drill, Cinematic, Lo-Fi, R&B).
Never invent random ideas—base all concepts on the Google search trends and real producer pain points above.
Genre tags must only be chosen from: "Hip Hop", "Trap", "Drill", "Bollywood", "Lo-Fi", "EDM", "Pop", "Cinematic", "R&B", "Rock", "Acoustic", "Ambient".

Return strictly valid JSON with this format:
{
  "ideas": [
    {
      "title": "Creative, commercially viable product name",
      "category": "plugin" or "sample-pack",
      "subcategory": "Reverb" or "Synthesizer" or "Delay & Echo" or "Drum Kits & One-Shots" or "Vocal Hooks & Chops" or "Bass & 808s",
      "tagline": "High-CTR search-optimized meta tagline (strictly 145-160 chars)",
      "genres": ["Genre1", "Genre2", "Genre3"],
      "suggested_price": 29.00,
      "prompt": "Detailed generation prompt to create the full SEO listing for this idea"
    }
  ]
}`;

    const modelsToTry = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
    let parsed: any = null;

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
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.65,
            max_tokens: 1200,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.choices?.[0]?.message?.content;
          if (rawText) {
            parsed = JSON.parse(rawText);
            break;
          }
        }
      } catch (e) {
        console.warn(`[Prody Brainstorm] Model ${model} failed, trying fallback...`, e);
      }
    }

    if (!parsed || !Array.isArray(parsed.ideas)) {
      return { success: false, error: 'Prody is momentarily busy. Please try again in a few seconds.' };
    }

    return {
      success: true,
      ideas: parsed.ideas,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error brainstorming ideas.' };
  }
}

export interface ProdyChatMessage {
  sender: 'user' | 'assistant';
  content: string;
}

export interface ProdyChatParams {
  messages: ProdyChatMessage[];
  brandName?: string;
  currentFormValues?: {
    name?: string;
    slug?: string;
    productType?: string;
    categorySlug?: string;
    subcategoryName?: string;
    selectedGenres?: string[];
    priceUsd?: string;
    originalPriceUsd?: string;
    shortDesc?: string;
    fullDesc?: string;
    vstFormat?: string;
  };
}

/**
 * Server Action: Interactive Studio Chatbot with Prody
 * Listens to creator, analyzes current form data, performs live Google search research,
 * asks targeted audio engineering questions, and generates high-ranking SEO product listings on demand.
 */
export async function prodyChatAction(params: ProdyChatParams): Promise<{
  success: boolean;
  content: string;
  product?: ProdyGeneratedProduct | null;
  error?: string;
}> {
  const { messages, brandName = 'Producer Toy', currentFormValues } = params;
  const apiKey = getApiKey();
  if (!apiKey) return { success: false, content: '', error: 'Prody AI engine is not configured.' };

  if (!messages || messages.length === 0) {
    return { success: false, content: 'Please provide a message for Prody.' };
  }

  try {
    const { categories, subcategories } = await getCatalogCategories();

    const categoryNames = categories.map((c) => `${c.name} (slug: ${c.slug})`).join(', ');
    const subcategoryNames = subcategories.map((s) => `${s.name}`).join(', ');

    // Determine the product concept to research on Google
    const userMessages = messages.filter((m) => m.sender === 'user').map((m) => m.content);
    const latestUserMsg = userMessages[userMessages.length - 1] || '';
    const searchConcept =
      currentFormValues?.name ||
      currentFormValues?.subcategoryName ||
      latestUserMsg ||
      'audio plugin';

    // Perform live Google search and competitor research
    const seoDossier = await performAudioSeoResearch(
      searchConcept,
      currentFormValues?.categorySlug
    );

    const formSummary = currentFormValues
      ? `
CURRENT FORM CONTEXT (What the creator has already typed into the form):
- Title: ${currentFormValues.name || 'Not set yet'}
- Storefront Slug: ${currentFormValues.slug || 'Auto-generated'}
- Category: ${currentFormValues.categorySlug || 'Not selected'}
- Subcategory: ${currentFormValues.subcategoryName || 'Not selected'}
- Selling Price: ${currentFormValues.priceUsd ? `$${currentFormValues.priceUsd}` : 'Not set'} (Original: ${currentFormValues.originalPriceUsd ? `$${currentFormValues.originalPriceUsd}` : 'Not set'})
- Genres: ${currentFormValues.selectedGenres && currentFormValues.selectedGenres.length > 0 ? currentFormValues.selectedGenres.join(', ') : 'Not selected'}
- Tagline: ${currentFormValues.shortDesc || 'Empty'}
- Full Description: ${currentFormValues.fullDesc ? 'Already written' : 'Empty'}
`
      : 'No pre-filled form data.';

    const systemPrompt = `You are Prody, the official AI Audio Product Architect and Google SEO Master at Producer Toy (producertoy.com).
Your mascot is the iconic Producer Toy studio bear wearing headphones with a mic.
You converse with music producers and audio brand creators in friendly, razor-sharp, studio-smart English/Hinglish.
Keep your language clean, easy, and direct so creators immediately understand.

${formSummary}

${seoDossier.groundedDossierText}

MANDATORY GOOGLE SEARCH & COMPETITOR RESEARCH GROUNDING:
- You have live Google search research, competitor benchmarks, and high-volume keywords in your dossier above.
- NEVER invent random facts, fake sample counts, or vague generic fluff.
- All product names, descriptions, bullet points, and DSP/sound features must strictly derive from this Google SEO search analysis.
- When advising the creator or building the listing, explicitly reference the search insights (e.g. "Analyzing top Google search trends for this, the most requested feature is...") to give creators confidence in their product's organic ranking capability.

STUDIO & AUDIO PRODUCT RULES:
1. STRICT ONE-STEP-AT-A-TIME PROGRESSION (CRITICAL):
   - You MUST guide the creator sequentially through exactly 4 steps:
     * STEP 1: Title & Storefront Identity
     * STEP 2: Core DSP & Audio Engine Features
     * STEP 3: Pricing Strategy & Competitor Benchmarks
     * STEP 4: Full Google SEO Product Listing
   - ABSOLUTE RULE: NEVER output multiple steps in the same message!
   - NEVER jump to Step 2, Step 3, or ask about DSP until Step 1 (Title) has been explicitly finalized by the creator!
   - If the user asks a question, gives thoughts, or tweaks their idea, LISTEN, UNDERSTAND, and answer specifically for the current step. Do not rush to future steps until the current step is locked in.

2. STEP 1 (TITLE ONLY) EXECUTION:
   - If the creator already has a title (e.g. "${currentFormValues?.name || ''}"):
     * Acknowledge it, explain how it aligns with Google search intent, and offer to keep it or present 3 high-ranking alternatives.
     * FORMAT EVERY OPTION AS A SELECTABLE CHECKBOX:
       - [ ] Keep: "${currentFormValues?.name || 'Current Title'}"
       - [ ] [High-Ranking Alternative Title 1]
       - [ ] [High-Ranking Alternative Title 2]
       - [ ] [High-Ranking Alternative Title 3]
       - [ ] Other (custom input)
     * STOP IMMEDIATELY after presenting Step 1 options. DO NOT write "Step 2" or ask about DSP. Wait for the creator to select, confirm, or tweak their title.

3. STEP 2 (CORE DSP & FEATURES ONLY) EXECUTION:
   - Trigger: Only when the creator confirms their title (e.g. picks a title, says "keep my title", "proceed", "next").
   - Acknowledge their locked title: "Title locked as **[Chosen Title]**! Now let's dial in **Step 2: Core DSP & Audio Engine**."
   - Ask about the DSP architecture, latency, and key controls.
   - FORMAT WITH SELECTABLE CHECKBOXES:
     - [ ] [DSP Configuration 1]
     - [ ] [DSP Configuration 2]
     - [ ] [DSP Configuration 3]
     - [ ] Other (custom input)
   - STOP IMMEDIATELY. DO NOT write Step 3 or pricing. Wait for creator response.

4. STEP 3 (PRICING STRATEGY ONLY) EXECUTION:
   - Trigger: Only when creator confirms Step 2 DSP features.
   - Present realistic pricing options based on the Google competitor research dossier:
     - [ ] Recommended Price (e.g. $49 Pro Tier)
     - [ ] Entry Price (e.g. $29 Launch Special)
     - [ ] Flagship Suite (e.g. $79 Studio Suite)
     - [ ] Other (custom input)
   - STOP IMMEDIATELY. DO NOT write Step 4. Wait for creator response.

5. STEP 4 (FULL GOOGLE SEO LISTING) EXECUTION:
   - Trigger: When creator confirms pricing or explicitly says "build listing", "generate listing", "build full listing".
   - Construct the complete #1 Google-ranking product overview and append the JSON block (enclosed in triple backticks json) at the very bottom.

6. STRICT SELECTABLE OPTIONS FORMATTING:
   - NEVER use plain bullets (• or -) when offering titles, choices, or questions.
   - ALWAYS format every selectable choice as:
     - [ ] Option text
   - ALWAYS include as the final option:
     - [ ] Other (custom input)

7. STRICT RULE FOR AUDIO PLUGINS / EFFECTS (REVERB, SATURATOR, COMPRESSOR, EQ, DELAY, SYNTH):
   - A reverb or audio effect is a MIXING & MASTERING TOOL, NOT A MUSIC GENRE.
   - NEVER ask "Are you aiming this at Hip-Hop/Trap, Cinematic, Lo-Fi?". That is WRONG and amateurish for an audio processor!
   - Ask only about real audio DSP and plugin workflow (IR convolution, algorithmic FDN, latency, CPU, oversampling, wet/dry lock).
   - Only ask musical genres if the product is explicitly a Sample Pack, Loop Kit, or Drum Kit.

8. GOOGLE #1 RANKING CONTENT FORMAT:
   - short_description: Strictly 145–160 characters (prevents SERP truncation).
   - full_description: Rich structured Markdown:
     * ### Primary Search Hook Title
     * #### Why Music Producers Need This (Problem / Solution bullets)
     * #### Key Features & DSP Highlights (Bold benefits & specs)
     * #### Google FAQ / Rich Snippets (3 concise questions & answers)
     * #### Technical Specifications (DAWs, OS, formats, sample rates, latency)

TAXONOMY:
- Categories: ${categoryNames}
- Subcategories: ${subcategoryNames}
- Curated Genres (Use Title Case): Hip Hop, Trap, Drill, Bollywood, Lo-Fi, EDM, Pop, Cinematic, R&B, Rock, Acoustic, Ambient

SCHEMA FOR JSON BLOCK (Enclose in triple backticks json at the bottom of your message when generating a listing):
{
  "name": "string (Catchy, commercial, high-intent title)",
  "slug": "string (clean-url-slug)",
  "category_slug": "plugin" | "sample-pack",
  "subcategory_name": "string",
  "category_slugs": ["Genre1", "Genre2", "Genre3", "Genre4"],
  "price_usd": number,
  "original_price_usd": number,
  "short_description": "string (strictly 145-160 char high-CTR Google meta description packed with keywords)",
  "full_description": "string (Rich, structured Markdown with H3 hook, Why Producers Need This, Key Features & DSP Highlights, Google FAQ, Technical Specifications)",
  "version": "1.0.0",
  "release_year": "2025",
  "license_type": "Royalty-Free Commercial",
  "vst_format": "VST3, AU, AAX (64-bit)",
  "operating_system": "macOS (Apple Silicon & Intel), Windows 10/11",
  "supported_daws": "Ableton Live, FL Studio, Logic Pro, Pro Tools, Studio One, Reaper, Cubase",
  "license_delivery_type": "pool" | "direct_download"
}`;

    const conversationPayload = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    ];

    const modelsToTry = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
    let rawReply = '';

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
            messages: conversationPayload,
            temperature: 0.45,
            max_tokens: 1800,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          rawReply = data.choices?.[0]?.message?.content || '';
          if (rawReply) break;
        }
      } catch (e) {
        console.warn(`[Prody Chat] Model ${model} failed, trying fallback...`, e);
      }
    }

    if (!rawReply) {
      return {
        success: false,
        content: 'Prody is currently busy at the mixing desk. Please send your message again!',
      };
    }

    // Check if reply contains a JSON block
    let product: ProdyGeneratedProduct | null = null;
    let cleanText = rawReply;

    const jsonMatch = rawReply.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const jsonContent = JSON.parse(jsonMatch[1]);
        cleanText = rawReply.replace(/```json[\s\S]*?```/, '').trim();

        // Detect category override
        const allText = `${messages.map((m) => m.content).join(' ')} ${rawReply}`.toLowerCase();
        const hasPluginKeywords =
          allText.includes('plugin') ||
          allText.includes('vst') ||
          allText.includes('reverb') ||
          allText.includes('synth') ||
          allText.includes('delay') ||
          allText.includes('compressor') ||
          allText.includes('dsp') ||
          allText.includes('audio effect');

        const isPlugin = jsonContent.category_slug === 'plugin' || hasPluginKeywords;
        const finalCategorySlug = isPlugin ? 'plugin' : 'sample-pack';
        const matchedCat = categories.find((c) => c.slug === finalCategorySlug) || categories[0];

        // Subcategory match
        const returnedSub = (jsonContent.subcategory_name || '').toLowerCase();
        let matchedSub = subcategories.find(
          (s) =>
            s.category_id === matchedCat?.id &&
            (s.name.toLowerCase() === returnedSub || s.slug === returnedSub.replace(/[^a-z0-9]+/g, '-'))
        );

        if (!matchedSub && matchedCat) {
          matchedSub = subcategories.find(
            (s) => s.category_id === matchedCat.id && allText.includes(s.name.toLowerCase())
          );
        }

        // Validate curated genres
        const VALID_GENRES = [
          'Hip Hop',
          'Trap',
          'Drill',
          'Bollywood',
          'Lo-Fi',
          'EDM',
          'Pop',
          'Cinematic',
          'R&B',
          'Rock',
          'Acoustic',
          'Ambient',
        ];

        const rawGenres = Array.isArray(jsonContent.category_slugs) ? jsonContent.category_slugs : [];
        const sanitizedGenres: string[] = [];
        for (const g of rawGenres) {
          const normalized = String(g).toLowerCase().replace(/[-_]+/g, ' ').trim();
          const match = VALID_GENRES.find((vg) => vg.toLowerCase() === normalized);
          if (match && !sanitizedGenres.includes(match)) {
            sanitizedGenres.push(match);
          }
        }
        if (sanitizedGenres.length === 0) {
          sanitizedGenres.push('Hip Hop', 'Trap', 'Pop', 'EDM');
        }

        product = {
          name: jsonContent.name || 'Untitled Audio Product',
          slug: (jsonContent.slug || jsonContent.name || 'audio-product')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, ''),
          category_id: matchedCat?.id || null,
          category_slug: finalCategorySlug,
          subcategory_id: matchedSub?.id || null,
          subcategory_name: matchedSub?.name || jsonContent.subcategory_name || null,
          category_slugs: sanitizedGenres,
          price_usd: Number(jsonContent.price_usd) || (isPlugin ? 49.0 : 29.0),
          original_price_usd: jsonContent.original_price_usd ? Number(jsonContent.original_price_usd) : (isPlugin ? 89.0 : 49.0),
          short_description: jsonContent.short_description || '',
          full_description: jsonContent.full_description || '',
          version: jsonContent.version || '1.0.0',
          release_year: jsonContent.release_year || new Date().getFullYear().toString(),
          license_type: jsonContent.license_type || 'Royalty-Free Commercial',
          vst_format: isPlugin ? (jsonContent.vst_format || 'VST3, AU, AAX (64-bit)') : null,
          operating_system: isPlugin ? (jsonContent.operating_system || 'macOS (Apple Silicon & Intel), Windows 10/11') : 'Any OS (macOS, Windows, Linux, iOS, Android)',
          supported_daws: jsonContent.supported_daws || 'Ableton Live, FL Studio, Logic Pro, Pro Tools, Studio One, Reaper, Cubase',
          license_delivery_type: isPlugin ? 'pool' : 'direct_download',
        };
      } catch (parseErr) {
        console.warn('[Prody Chat] Could not parse embedded JSON:', parseErr);
      }
    }

    return {
      success: true,
      content: cleanText,
      product,
    };
  } catch (err: any) {
    return {
      success: false,
      content: '',
      error: err.message || 'Error processing chat message with Prody.',
    };
  }
}
