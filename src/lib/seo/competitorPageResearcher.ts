/**
 * Public Competitor Product-Page Intelligence Module
 * 
 * Analyzes specific public product URLs when supplied by the creator or available in product context.
 * Strictly independent of Google Ads Keyword Planner.
 * Does NOT scrape Google Search results or fabricate unverified competitor URLs.
 */

export interface CompetitorPageAnalysis {
  status: 'success' | 'not_provided' | 'fetch_failed' | 'invalid_url';
  url?: string;
  vendor?: string;
  productTitle?: string;
  metaDescription?: string;
  detectedFeatures: string[];
  supportedFormats: string[];
  keyHeadings: string[];
  retrievedAt: string;
  notes?: string;
}

const KNOWN_FORMAT_PATTERNS = [
  'VST3',
  'VST2',
  'AU',
  'AAX',
  'CLAP',
  'AudioUnit',
  '64-bit',
  'Apple Silicon',
  'M1/M2/M3/M4',
  'Windows 10',
  'Windows 11',
  'macOS',
  '24-Bit WAV',
  '16-Bit WAV',
  'MIDI',
  'Kontakt',
  'Decent Sampler',
];

const KNOWN_VENDOR_DOMAINS: Record<string, string> = {
  'fabfilter.com': 'FabFilter',
  'valhalladsp.com': 'Valhalla DSP',
  'soundtoys.com': 'Soundtoys',
  'eventideaudio.com': 'Eventide',
  'izotope.com': 'iZotope',
  'native-instruments.com': 'Native Instruments',
  'arturia.com': 'Arturia',
  'babyaud.io': 'Baby Audio',
  'output.com': 'Output',
  'spitfireaudio.com': 'Spitfire Audio',
  'splice.com': 'Splice',
  'cymatics.fm': 'Cymatics',
  'loopmasters.com': 'Loopmasters',
  'waves.com': 'Waves Audio',
  'uaudio.com': 'Universal Audio',
  'slatedigital.com': 'Slate Digital',
};

/**
 * Safely analyzes a public product page URL
 */
export async function analyzeCompetitorProductPage(
  rawUrl?: string | null
): Promise<CompetitorPageAnalysis> {
  const timestamp = new Date().toISOString();

  if (!rawUrl || !rawUrl.trim()) {
    return {
      status: 'not_provided',
      detectedFeatures: [],
      supportedFormats: [],
      keyHeadings: [],
      retrievedAt: timestamp,
      notes: 'No public competitor URL provided for direct page extraction.',
    };
  }

  const cleanUrl = rawUrl.trim();

  // Validate URL syntax
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only HTTP/HTTPS URLs are supported.');
    }
  } catch (err: any) {
    return {
      status: 'invalid_url',
      url: cleanUrl,
      detectedFeatures: [],
      supportedFormats: [],
      keyHeadings: [],
      retrievedAt: timestamp,
      notes: `Invalid URL format: ${err.message}`,
    };
  }

  // Detect vendor from domain
  const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
  const matchedVendor =
    KNOWN_VENDOR_DOMAINS[hostname] ||
    hostname.split('.')[0]?.charAt(0).toUpperCase() + hostname.split('.')[0]?.slice(1);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'ProducerToy-SEO-Auditor/1.0 (+https://producertoy.com/bot; public product inspection)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        status: 'fetch_failed',
        url: cleanUrl,
        vendor: matchedVendor,
        detectedFeatures: [],
        supportedFormats: [],
        keyHeadings: [],
        retrievedAt: timestamp,
        notes: `HTTP ${res.status} returned by vendor server.`,
      };
    }

    const html = await res.text();

    // Extract title
    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const rawTitle = ogTitleMatch?.[1] || titleTagMatch?.[1] || '';
    const cleanTitle = rawTitle.replace(/\s+/g, ' ').trim();

    // Extract description
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const rawDesc = ogDescMatch?.[1] || metaDescMatch?.[1] || '';
    const cleanDesc = rawDesc.replace(/\s+/g, ' ').trim();

    // Extract H1 / H2 headings
    const headings: string[] = [];
    const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
    const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];

    for (const m of [...h1Matches, ...h2Matches].slice(0, 6)) {
      const text = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (text && text.length < 120 && !headings.includes(text)) {
        headings.push(text);
      }
    }

    // Extract audio formats and specs mentioned in text
    const lowerHtml = html.toLowerCase();
    const formatsFound: string[] = [];
    for (const fmt of KNOWN_FORMAT_PATTERNS) {
      if (lowerHtml.includes(fmt.toLowerCase())) {
        formatsFound.push(fmt);
      }
    }

    // Extract feature bullet points if present
    const featureBullets: string[] = [];
    const liMatches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
    for (const li of liMatches) {
      const text = li[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (
        text.length > 20 &&
        text.length < 160 &&
        (text.toLowerCase().includes('reverb') ||
          text.toLowerCase().includes('audio') ||
          text.toLowerCase().includes('plugin') ||
          text.toLowerCase().includes('preset') ||
          text.toLowerCase().includes('dsp') ||
          text.toLowerCase().includes('sound') ||
          text.toLowerCase().includes('latency') ||
          text.toLowerCase().includes('mix') ||
          text.toLowerCase().includes('vocal'))
      ) {
        if (!featureBullets.includes(text)) {
          featureBullets.push(text);
        }
      }
      if (featureBullets.length >= 5) break;
    }

    return {
      status: 'success',
      url: cleanUrl,
      vendor: matchedVendor,
      productTitle: cleanTitle,
      metaDescription: cleanDesc,
      detectedFeatures: featureBullets,
      supportedFormats: formatsFound,
      keyHeadings: headings,
      retrievedAt: timestamp,
      notes: `Successfully analyzed public page of ${matchedVendor}.`,
    };
  } catch (err: any) {
    return {
      status: 'fetch_failed',
      url: cleanUrl,
      vendor: matchedVendor,
      detectedFeatures: [],
      supportedFormats: [],
      keyHeadings: [],
      retrievedAt: timestamp,
      notes: `Failed to fetch page: ${err.message || 'Timeout'}`,
    };
  }
}
