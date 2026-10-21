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
