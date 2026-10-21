# Toy Creator — Engineering, Security & Business Rules

These rules are mandatory invariants for the **Toy Creator** portal (`creators.producertoy.com` / `d:\Website\Toy Creator`).

---

## 1. Theme & Color Palette Invariant (Charcoal Standard)
- **Palette**: Strictly adhere to ProducerToy's pure dark charcoal palette (`#121212` background, `#161616` card surface, `#181818` input background, `#202020` / `#262626` / `#2a2a2a` borders, `#34363d` button primary, `#42454e` hover).
- **Text & Accents**: High-contrast pure white text, zinc-400 (`#a0a0a0`) muted labels.
- **FORBIDDEN COLORS**: Never use purple, violet, indigo, neon blue, or green accents.
- **Error Banners**: Use ProducerToy's official `#ff4053` background with bold black text.

---

## 2. Gated Brand Onboarding (No Public Self-Registration)
- **Closed Registration**: Never allow arbitrary public self-registration of brands or open brand creation.
- **Application Gating**: Anyone wanting to become a brand creator must submit the Creator Partnership Application Form (`/signup`), which dispatches a verified high-priority ticket into Supabase and an email to `contact@producertoy.com`.
- **Authorization**: Only verified brands in the `brand_members` table have access to `/dashboard`. Unverified users are intercepted by `BrandGate`.

---

## 3. Mandatory Next.js Server Actions for Supabase Mutations
- **Server Execution**: All database mutations (`insert`, `update`, `delete`) must be executed inside dedicated Next.js Server Actions marked with `'use server'` (e.g. `src/actions/productActions.ts`, `src/actions/brandActions.ts`).
- **Service Role Key Security**: Never execute database mutations from Client Components (`'use client'`). In client components, `SUPABASE_SERVICE_ROLE_KEY` is undefined and falls back to anonymous client, causing Supabase RLS to return 0 rows.
- **Safe Query Methods**: Always use `.maybeSingle()` instead of `.single()` on update/insert return queries to prevent PostgREST `PGRST116` ("Cannot coerce the result to a single JSON object") coercion crashes.
- **Cache Invalidation**: Call `revalidatePath(...)` after mutations to refresh server-side cache.

---

## 4. 70% Creator / 30% Platform Revenue Share Standard
- **Revenue Model**: The business model is strictly 70% Creator Retain / 30% ProducerToy Platform Fee.
- **Consistency**: This 70/30 split must be consistently reflected across all interactive earnings calculators, landing page hero copy, FAQ accordions, dashboard analytics, database defaults, and publisher legal document schedules.

---

## 5. Resilient Cloudflare Turnstile Verification in Development
- **Localhost Resiliency**: Cloudflare Turnstile token validation in `src/lib/turnstile.ts` must gracefully allow local development / test environments without locking out authorized developers due to secret key domain restrictions.

---

## 6. Official Brand Assets & Identifiers
- **Logo & Favicon**: The official emblem for Toy Creator is the circular Bear "C" mascot (`/logo.webp`, `/logo.png`, `/icon.png`, `/favicon.ico`).
- **Brand Text**: "TOY CREATOR — by ProducerToy".

---

## 7. Minimalist UI & No Buzzword Clutter
- **No Marketing Noise**: Never inject third-party marketplace buzzwords, architecture branding, or clutter badges (e.g. "Plugin Boutique Architecture") into creator-facing tools.
- **Minimalist Precision**: Use concise, professional audio industry terminology (e.g., "Automated Delivery", "Windows Installer", "Machine Seats", "Offline Grace").
- **Clarity Over Jargon**: Labels must be self-explanatory to VST architects, sound designers, and independent sample pack creators.

---

## 8. YouTube Studio-Style Stepped Workflow Invariant
- **Stepped Product Setup**: Complex product creation and editing must follow a clean, structured 5-step flow:
  1. **Details & Pricing** (Title, Slug, Category, Pricing, Description)
  2. **Media & Previews** (Square Artwork, Audio Preview, Video Demo)
  3. **Installers & Specs** (Windows .exe, macOS .pkg, Universal ZIP, File Size, DAWs, OS)
  4. **Licensing & Serials** (Plugin Formats, Machine Seats, Automated Key Pool)
  5. **Review & Visibility** (Catalog Status, Readiness Checklist)
- **Non-Blocking Navigation**: Creators can click any step tab directly or use "Previous / Next" buttons.
- **Persistent Save**: The "Save / Publish" action must always remain accessible from any step.

---

## 9. Product Versioning & Update Lifecycle Standards
- **Non-Destructive Updates**: Updating product installers (e.g. v1.0.0 to v1.1.0) must never invalidate previously assigned serial keys, device activations, or buyer order records.
- **Download URL Integrity**: When new binary installers are uploaded, existing customer download links in ProducerToy vault must point to the updated asset automatically.
- **Version & Changelog Tracking**: Provide clear semantic version fields and release notes so buyers know what is new in each patch.

---

## 10. 5TB Google Drive Storage & Cloud Helper Streaming Architecture
- **Dedicated Storage Destination**: All product binaries, VST installers (.exe, .pkg, .dmg), universal archives (.zip), and sample libraries must be hosted in the owner's 5TB Google Drive (`sampleswaladrive@gmail.com`), NEVER in Supabase Storage.
- **Strictly Forbid In-Memory Base64 for Large Binaries**: Never use `buffer.toString('base64')` or full in-memory buffering on binary assets in Next.js Server Actions. V8 crashes with `ERR_STRING_TOO_LONG` on files exceeding ~380MB.
- **Cloud Helper Streaming Pipeline**:
  1. **Direct Stream Route**: Use a raw HTTP streaming route (`/api/drive/upload`) or Cloudflare Edge Worker proxy that pipes `request.body` directly to Google Drive as an octet-stream chunk by chunk.
  2. **Google Drive Resumable Upload**: For multi-gigabyte files (400MB–5TB), initiate a Resumable Upload session URI with Google Drive API v3, allowing the client to stream chunks directly to Google with real-time percentage progress (`0% -> 100%`).
  3. **Dual-Mode Fallback**: When users upload through the browser, auto-detect the file size (MB/GB) and support direct link entry from Google Drive with zero size barriers.
- **ProducerToy CDN Delivery Compatibility**: All generated Google Drive file IDs and shareable URLs must maintain compatibility with ProducerToy's streaming download engine (`/api/download/[id]/route.ts`).


