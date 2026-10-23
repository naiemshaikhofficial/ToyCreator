'use server';

import { getCatalogCategories } from '@/lib/supabase/actions';
import { performAudioSeoResearch } from '@/lib/prodySearchEngine';
import { requireAuthenticatedUser } from '@/lib/auth/serverAuth';

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
  try {
    await requireAuthenticatedUser();
  } catch {
    return { success: false, error: 'Unauthorized: You must be logged in as a creator to use Prody AI.' };
  }

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
  try {
    await requireAuthenticatedUser();
  } catch {
    return { success: false, error: 'Unauthorized: You must be logged in as a creator to brainstorm ideas.' };
  }

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
    externalUrl?: string;
  };
}

/**
 * Server Action: Interactive Studio Chatbot with Prody
 * Listens to creator, analyzes current form data, performs live Google Ads & competitor SEO research,
 * respects negative constraints & corrections, asks targeted audio engineering questions, and generates high-ranking SEO product listings on demand.
 */
export async function prodyChatAction(params: ProdyChatParams): Promise<{
  success: boolean;
  content: string;
  product?: ProdyGeneratedProduct | null;
  error?: string;
}> {
  try {
    await requireAuthenticatedUser();
  } catch {
    return { success: false, content: '', error: 'Unauthorized: You must be logged in as a creator to chat with Prody.' };
  }

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

    // Determine the product concept and check for public competitor URL
    const userMessages = messages.filter((m) => m.sender === 'user').map((m) => m.content);
    const latestUserMsg = userMessages[userMessages.length - 1] || '';
    const urlInMsg = latestUserMsg.match(/https?:\/\/[^\s]+/i)?.[0];
    const externalUrl = currentFormValues?.externalUrl || urlInMsg;

    const searchConcept = currentFormValues?.name
      ? `${currentFormValues.name} ${currentFormValues.subcategoryName || ''}`.trim()
      : latestUserMsg || 'audio plugin';

    // Perform research through upgraded SEO engine (Google Ads API + Competitor Page + Supabase Cache)
    const seoDossier = await performAudioSeoResearch(
      searchConcept,
      currentFormValues?.categorySlug,
      {
        subcategoryName: currentFormValues?.subcategoryName,
        externalUrl,
      }
    );

    const formSummary = currentFormValues
      ? `
CURRENT FORM CONTEXT (What the creator currently has in the product editor):
- Product Title: ${currentFormValues.name || 'Not set yet'}
- Storefront Slug: ${currentFormValues.slug || 'Auto-generated'}
- Category: ${currentFormValues.categorySlug || 'Not selected'}
- Subcategory: ${currentFormValues.subcategoryName || 'Not selected'}
- Selling Price: ${currentFormValues.priceUsd ? `$${currentFormValues.priceUsd}` : 'Not set'} (Original: ${currentFormValues.originalPriceUsd ? `$${currentFormValues.originalPriceUsd}` : 'Not set'})
- Selected Genres: ${currentFormValues.selectedGenres && currentFormValues.selectedGenres.length > 0 ? currentFormValues.selectedGenres.join(', ') : 'Not selected'}
- Tagline (Short Description): ${currentFormValues.shortDesc || 'Empty'}
- Full Description: ${currentFormValues.fullDesc ? 'Already written in form' : 'Empty'}
- External / Reference URL: ${currentFormValues.externalUrl || 'None'}
`
      : 'No pre-filled form data.';

    const systemPrompt = `You are Prody, the official AI Audio Product Architect and Google SEO Master at Producer Toy (producertoy.com).
Your mascot is the iconic Producer Toy studio bear wearing headphones with a mic.
You converse with music producers and audio brand creators in friendly, razor-sharp, studio-smart English/Hinglish.
Keep your language clean, easy, and direct so creators immediately understand.

${formSummary}

${seoDossier.groundedDossierText}

STUDIO & CONVERSATION AWARENESS RULES:
1. UNDERSTAND THE CURRENT PRODUCT AUTOMATICALLY:
   - When the creator describes their sound, features, or vision (e.g., "It's an AI reverb for music production"), ALWAYS recognize they are describing their CURRENT form product (${currentFormValues?.name || 'their audio product'}), NOT starting an unrelated new product or wiping context.
   - Retain and build on everything the creator has already entered in the form and previously said in the chat.

2. NEGATIVE CONSTRAINTS & TITLE CORRECTIONS (HIGHEST PRIORITY):
   - When the creator says: "I don't want AI, VST3, or technical specifications in the title. Add music production wording instead":
     * STRICTLY ELIMINATE the rejected terms ("AI", "VST3", technical specs) from title suggestions!
     * PROMPTLY APPLY the creator's requested wording (e.g., "ProVerb — Smart Reverb for Music Production", "ProVerb — Studio Reverb for Music Production").
     * Never repeat the rejected title or ignore creator preferences.
     * Always remember rejected terms for the rest of the conversation.

3. DISTINGUISH DISCUSSION VS. EXPLICIT CONFIRMATION:
   - Discussing, tweaking, or asking questions about a title does NOT lock the title.
   - Stay on STEP 1 while the creator is refining the title.
   - Transition to STEP 2 (DSP & Core Features) ONLY when the creator explicitly confirms their title (e.g., selects an option, says "keep my title", "lock title", "confirm", "proceed to step 2").
   - NEVER overwrite form fields prematurely without creator selection or explicit apply.

4. DO NOT REPEAT QUICK-ACTION MENUS:
   - NEVER dump a repetitive list of identical quick actions after every message.
   - Only output targeted, selectable options relevant to the current active step.

5. STRICT PROGRESSION & COMPREHENSIVE BRIEF HANDLING:
   - When the creator provides a comprehensive sound brief, detailed specification, or full product description:
     * DO NOT force them through Step 1 again!
     * Recognize that they supplied the entire vision!
     * Generate the complete #1 Google-ranking product overview immediately with the JSON block at the bottom, providing the 1-Click "Apply All" master card.
   - In Step-by-Step mode:
     * STEP 1 (TITLE ONLY): Propose selectable titles with checkboxes (- [ ]), and STOP.
     * STEP 2 (DSP & FEATURES): Trigger only after title confirmation. Ask DSP questions with checkboxes (- [ ]), and STOP.
     * STEP 3 (PRICING): Trigger only after DSP confirmation. Suggest pricing tiers with checkboxes (- [ ]), and STOP.
     * STEP 4 (FULL LISTING): Trigger after pricing confirmation, or when creator says "build listing", "generate listing", "build full listing".

6. STRICT SELECTABLE OPTIONS FORMATTING:
   - Format every selectable option on its own bullet line:
     - [ ] Option text
   - Always include as the final option:
     - [ ] Other (custom input)

7. STRICT RULE FOR AUDIO PLUGINS / EFFECTS (REVERB, SATURATOR, COMPRESSOR, EQ, DELAY, SYNTH):
   - A reverb or audio effect is a MIXING & MASTERING TOOL, NOT A MUSIC GENRE.
   - NEVER ask "Are you aiming this at Hip-Hop/Trap, Cinematic, Lo-Fi?". That is amateurish for an audio processor!
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
