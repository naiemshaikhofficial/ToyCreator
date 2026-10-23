/**
 * Prody SEO & Audio Intelligence Engine
 * 
 * Orchestrates:
 * 1. Google Ads API Keyword Planner (verified search volumes, advertiser competition, bid ranges)
 * 2. Competitor Product-Page Researcher (analyzes public product URLs when provided)
 * 3. Hybrid Supabase & Memory Research Caching
 * 4. Professional Studio Audio Engineering & E-E-A-T SEO Taxonomy
 * 
 * Never fabricates API metrics, search rankings, or unverified competitors.
 */

import {
  fetchGoogleAdsKeywordIdeas,
  type GoogleAdsKeywordMetric,
  type GoogleAdsKeywordPlannerResult,
} from '@/lib/seo/googleAdsKeywordProvider';
import {
  analyzeCompetitorProductPage,
  type CompetitorPageAnalysis,
} from '@/lib/seo/competitorPageResearcher';
import {
  getCachedResearch,
  setCachedResearch,
  normalizeQueryKey,
  withInFlightLock,
} from '@/lib/seo/seoCache';

export interface SerpSnippet {
  title: string;
  snippet: string;
}

export interface AudioSeoResearchDossier {
  query: string;
  isPlugin: boolean;
  googleAdsResult: GoogleAdsKeywordPlannerResult;
  competitorPageAnalysis: CompetitorPageAnalysis;
  verifiedKeywords: GoogleAdsKeywordMetric[];
  aiCuratedKeywords: string[];
  topKeywords: string[]; // Backward compatibility
  competitorsFound: string[]; // Backward compatibility
  producerPainPoints: string[]; // Backward compatibility
  snippets: SerpSnippet[]; // Backward compatibility
  groundedDossierText: string;
  summaryForChat: string;
}

/**
 * Derive intelligent, high-intent keyword seeds from product context
 */
export function deriveKeywordSeeds(
  concept: string,
  categorySlug?: string,
  subcategoryName?: string
): string[] {
  const seeds: string[] = [];
  const clean = concept.trim();
  const lower = clean.toLowerCase();

  const isPlugin =
    categorySlug === 'plugin' ||
    lower.includes('plugin') ||
    lower.includes('vst') ||
    lower.includes('synth') ||
    lower.includes('reverb') ||
    lower.includes('delay') ||
    lower.includes('compressor') ||
    lower.includes('eq') ||
    lower.includes('dsp') ||
    lower.includes('audio effect');

  if (isPlugin) {
    const sub = (subcategoryName || '').toLowerCase();
    const effect =
      sub ||
      lower.match(/(reverb|delay|compressor|equalizer|eq|distortion|saturation|synthesizer|synth|limiter|phaser|chorus|filter)/i)?.[0] ||
      'audio effect';

    seeds.push(
      `${effect} plugin`,
      `${effect} vst3`,
      `best ${effect} plugin`,
      `${effect} for music production`,
      `${effect} plugin for vocals`
    );

    if (clean && !clean.toLowerCase().includes(effect)) {
      seeds.push(`${clean} ${effect}`);
    }
  } else {
    const genre =
      subcategoryName ||
      lower.match(/(drill|trap|hip hop|bollywood|lofi|lo-fi|808|vocal|drums|synthwave|ambient|edm|pop)/i)?.[0] ||
      'sample pack';

    seeds.push(
      `${genre} sample pack`,
      `${genre} drum kit`,
      `royalty free ${genre} samples`,
      `${genre} loops 24 bit wav`,
      `${genre} sound kit for producers`
    );

    if (clean) {
      seeds.push(`${clean} samples`);
    }
  }

  // Deduplicate and trim
  return Array.from(new Set(seeds.map((s) => s.trim().toLowerCase()))).slice(0, 8);
}

/**
 * Perform deep SEO research and construct grounded intelligence dossier
 */
export async function performAudioSeoResearch(
  concept: string,
  categoryPreference?: string,
  options?: {
    subcategoryName?: string;
    externalUrl?: string;
    skipCache?: boolean;
  }
): Promise<AudioSeoResearchDossier> {
  const cleanPrompt = concept.trim();
  const lower = cleanPrompt.toLowerCase();

  const isPlugin =
    categoryPreference === 'sample-pack'
      ? false
      : categoryPreference === 'plugin' ||
        lower.includes('plugin') ||
        lower.includes('vst') ||
        lower.includes('reverb') ||
        lower.includes('delay') ||
        lower.includes('synth') ||
        lower.includes('compressor') ||
        lower.includes('dsp') ||
        lower.includes('audio effect');

  // 1. Derive keyword seeds
  const seeds = deriveKeywordSeeds(cleanPrompt, categoryPreference, options?.subcategoryName);
  const primarySeed = seeds[0] || (isPlugin ? 'reverb plugin' : 'sample pack');
  const cacheKey = `google_ads:${normalizeQueryKey(primarySeed)}`;

  // 2. Retrieve keyword data (from cache or Google Ads API)
  let googleAdsResult: GoogleAdsKeywordPlannerResult;

  if (!options?.skipCache) {
    const cached = await getCachedResearch<GoogleAdsKeywordPlannerResult>(cacheKey);
    if (cached?.data) {
      googleAdsResult = cached.data;
    } else {
      googleAdsResult = await withInFlightLock(cacheKey, async () => {
        const res = await fetchGoogleAdsKeywordIdeas(seeds);
        if (res.status === 'configured' && res.metrics.length > 0) {
          await setCachedResearch({
            cacheKey,
            query: primarySeed,
            normalizedQuery: normalizeQueryKey(primarySeed),
            provider: 'google_ads',
            status: res.status,
            data: res,
            ttlDays: 14,
          });
        }
        return res;
      });
    }
  } else {
    googleAdsResult = await fetchGoogleAdsKeywordIdeas(seeds);
  }

  // 3. Competitor Product-Page Research (only if a valid URL was provided)
  let competitorPageAnalysis: CompetitorPageAnalysis;
  if (options?.externalUrl) {
    const urlCacheKey = `page_analysis:${options.externalUrl.trim()}`;
    const cachedPage = await getCachedResearch<CompetitorPageAnalysis>(urlCacheKey);
    if (cachedPage?.data) {
      competitorPageAnalysis = cachedPage.data;
    } else {
      competitorPageAnalysis = await withInFlightLock(urlCacheKey, async () => {
        const pageRes = await analyzeCompetitorProductPage(options.externalUrl);
        if (pageRes.status === 'success') {
          await setCachedResearch({
            cacheKey: urlCacheKey,
            query: options.externalUrl!,
            normalizedQuery: options.externalUrl!.toLowerCase().trim(),
            provider: 'competitor_page',
            status: pageRes.status,
            data: pageRes,
            ttlDays: 7,
          });
        }
        return pageRes;
      });
    }
  } else {
    competitorPageAnalysis = {
      status: 'not_provided',
      detectedFeatures: [],
      supportedFormats: [],
      keyHeadings: [],
      retrievedAt: new Date().toISOString(),
      notes: 'No external competitor product URL supplied for direct page analysis.',
    };
  }

  // 4. Curated baseline audio keywords (fallback when Google Ads is unconfigured or returns low volume)
  const aiCuratedKeywords = isPlugin
    ? [
        'Algorithmic Reverb',
        'Stereo Width & Diffusion',
        'Zero Latency DSP',
        '64-Bit Float Engine',
        'Apple Silicon & Windows 11',
        'BPM Sync Pre-Delay',
      ]
    : [
        '24-Bit 44.1kHz WAV',
        '100% Royalty-Free Commercial',
        'Key & BPM Labeled',
        'Mixed & Mastered Loops',
        'Full Stem Bounces Included',
        'FL Studio & Ableton Ready',
      ];

  const verifiedMetrics = googleAdsResult.metrics || [];

  // Build markdown for verified Google Ads data
  let keywordSectionMarkdown = '';
  if (googleAdsResult.status === 'configured' && verifiedMetrics.length > 0) {
    keywordSectionMarkdown = `VERIFIED GOOGLE ADS KEYWORD PLANNER METRICS:
(Note: "Advertiser Competition" measures paid ad auction density, NOT organic SEO ranking difficulty)
${verifiedMetrics
  .slice(0, 10)
  .map(
    (m) =>
      `- "${m.keyword}" | Avg Monthly Searches: ${m.avgMonthlySearches ?? 'N/A'} | Advertiser Competition: ${m.advertiserCompetition ?? 'UNSPECIFIED'} (${m.advertiserCompetitionIndex ?? 'N/A'}/100)${
        m.lowTopOfPageBidUsd ? ` | Top-of-Page Bid: $${m.lowTopOfPageBidUsd} - $${m.highTopOfPageBidUsd}` : ''
      }`
  )
  .join('\n')}`;
  } else if (googleAdsResult.status === 'unconfigured') {
    keywordSectionMarkdown = `GOOGLE ADS KEYWORD PLANNER STATUS:
[Notice: Official Google Ads API credentials are not yet configured in server environment. Missing: ${
      googleAdsResult.missingVariables?.join(', ') || 'credentials'
    }. Using curated ProducerToy audio SEO taxonomy.]`;
  } else {
    keywordSectionMarkdown = `GOOGLE ADS KEYWORD PLANNER STATUS:
[${googleAdsResult.message || 'No direct keyword metrics returned for this specific seed'}. Using curated ProducerToy audio SEO taxonomy.]`;
  }

  // Build markdown for competitor page analysis
  let competitorSectionMarkdown = '';
  if (competitorPageAnalysis.status === 'success') {
    competitorSectionMarkdown = `VERIFIED PUBLIC PRODUCT-PAGE ANALYSIS (${competitorPageAnalysis.vendor || 'Vendor'}):
- Source URL: ${competitorPageAnalysis.url}
- Page Title: "${competitorPageAnalysis.productTitle || 'N/A'}"
- Meta Description: "${competitorPageAnalysis.metaDescription || 'N/A'}"
- Advertised Features: ${
      competitorPageAnalysis.detectedFeatures.length > 0
        ? competitorPageAnalysis.detectedFeatures.map((f) => `\n  * ${f}`).join('')
        : 'None extracted'
    }
- Formats & Compatibility: ${competitorPageAnalysis.supportedFormats.join(', ') || 'N/A'}`;
  } else {
    competitorSectionMarkdown = `COMPETITOR PRODUCT-PAGE RESEARCH:
[Status: No public competitor URL was supplied for direct page inspection. Do NOT invent fake URLs or claim unverified competitors.]`;
  }

  // 5. Build Complete Grounded Dossier Text for LLM Injection
  const groundedDossierText = `
=== PRODY AUDIO SEO & KEYWORD INTELLIGENCE DOSSIER ===
SEARCH SEED ANALYZED: "${primarySeed}"
DERIVED KEYWORD SEEDS: ${seeds.map((s) => `"${s}"`).join(', ')}
PRODUCT CLASSIFICATION: ${isPlugin ? 'AUDIO PLUGIN / VST SOFTWARE' : 'SAMPLE PACK / AUDIO ASSET'}

${keywordSectionMarkdown}

CURATED AUDIO DOMAIN KEYWORDS:
${aiCuratedKeywords.map((k) => `- ${k}`).join('\n')}

${competitorSectionMarkdown}

CRITICAL RULES FOR REASONING & COPYWRITING:
1. DISTINGUISH DATA SOURCES:
   - If Google Ads metrics are present above, prioritize those exact high-volume phrases.
   - If Google Ads is unconfigured, use clean, commercial audio terms from domain knowledge. NEVER claim "Google search data shows 12,000 monthly searches" when Keyword Planner was unconfigured!
2. RESPECT CREATOR INSTRUCTIONS:
   - If the creator says "I don't want AI, VST3, or technical specifications in the title. Add music production wording instead", strictly comply!
3. ADVERTISER COMPETITION IS NOT ORGANIC SEO:
   - Never confuse paid ad competition with organic search rankings.
4. DO NOT INVENT SPECIFICATIONS:
   - Never invent DSP architecture, latency claims, preset counts, or compatibility unless specified by the creator.
=== END INTELLIGENCE DOSSIER ===
`;

  // Build summary for chat interface
  let summaryForChat = '';
  if (googleAdsResult.status === 'configured' && verifiedMetrics.length > 0) {
    summaryForChat = `📊 **Google Ads Keyword Planner:** Analyzed **${verifiedMetrics.length} verified keyword ideas** for *"${primarySeed}"*. Top searches: ${verifiedMetrics
      .slice(0, 3)
      .map((m) => `"${m.keyword}" (${m.avgMonthlySearches ? `${m.avgMonthlySearches}/mo` : 'verified'})`)
      .join(', ')}.`;
  } else if (googleAdsResult.status === 'unconfigured') {
    summaryForChat = `🎧 **Audio SEO Intelligence:** Grounded in high-intent keyword taxonomy for ${isPlugin ? 'Audio Plugins & VSTs' : 'Sample Packs'}. (Google Ads API credentials pending in server config).`;
  } else {
    summaryForChat = `🎧 **Audio SEO Intelligence:** Analyzing keyword intent for *"${primarySeed}"* using curated studio taxonomy.`;
  }

  return {
    query: primarySeed,
    isPlugin,
    googleAdsResult,
    competitorPageAnalysis,
    verifiedKeywords: verifiedMetrics,
    aiCuratedKeywords,
    topKeywords: aiCuratedKeywords,
    competitorsFound: competitorPageAnalysis.vendor ? [competitorPageAnalysis.vendor] : [],
    producerPainPoints: isPlugin
      ? [
          'High CPU consumption freezing DAW sessions during large mix projects',
          'Artificial, metallic or phase-smeared frequency response on vocal and drum busses',
          'Clunky, non-resizable interfaces that slow down studio workflow',
        ]
      : [
          'Generic, over-recycled sounds that lack unique character and punch',
          'Muddy low frequencies and poor mono compatibility on 808s and kicks',
          'Vague licensing terms risking copyright claims on streaming platforms',
        ],
    snippets: [],
    groundedDossierText,
    summaryForChat,
  };
}
