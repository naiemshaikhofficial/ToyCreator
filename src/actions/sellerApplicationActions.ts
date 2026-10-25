'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { validateTurnstileAction } from '@/actions/authActions';

export interface SellerApplicationPayload {
  // Section 1: Company Overview
  manufacturerName: string;
  website: string;
  socialMedia: string;
  companyOverview: string;
  establishedDate: string;
  productTypes: string[];
  userBaseEstimate: string;

  // Section 2: Products & Marketing
  productCatalog: string;
  releasePlans: string;
  videoWalkthroughs: string;
  marketingAssets: string;
  nfrCopies: string;

  // Section 3: Technical
  drmSystem: string;

  // Section 4: Business & Legal
  manufacturerBio: string;
  logoUrl?: string | null;
  fullLegalName: string;
  businessAddress: string;

  // Section 5: Contacts
  email: string;
  productContactEmail: string;
  serialsContactEmail: string;
  supportContactEmail: string;
  accountingContactEmail: string;
  partnerAreaEmails: string;

  // Section 6: Commercial Setup
  paymentPreference: string;
  accountingPeriod: string;
  productListPricing: string;

  turnstileToken: string;
}

export async function submitSellerApplicationAction(payload: SellerApplicationPayload) {
  try {
    // 1. Validate Cloudflare Turnstile token
    if (!payload.turnstileToken) {
      return { success: false, error: 'Security verification is required. Please verify with Cloudflare Turnstile.' };
    }

    const turnstileCheck = await validateTurnstileAction(payload.turnstileToken);
    if (!turnstileCheck.success) {
      return { success: false, error: turnstileCheck.error || 'Security verification failed. Please try again.' };
    }

    // 2. Validate mandatory fields
    if (!payload.manufacturerName?.trim() || !payload.website?.trim() || !payload.email?.trim()) {
      return { success: false, error: 'Please provide all required company information and contact email.' };
    }

    const admin = getAdminClient();

    // 3. Save into seller_applications table
    const { data: application, error: appErr } = await admin
      .from('seller_applications')
      .insert({
        manufacturer_name: payload.manufacturerName.trim(),
        website: payload.website.trim(),
        social_media: payload.socialMedia.trim(),
        company_overview: payload.companyOverview.trim(),
        established_date: payload.establishedDate.trim(),
        product_types: payload.productTypes,
        user_base_estimate: payload.userBaseEstimate.trim(),

        product_catalog: payload.productCatalog.trim(),
        release_plans: payload.releasePlans.trim(),
        video_walkthroughs: payload.videoWalkthroughs.trim(),
        marketing_assets: payload.marketingAssets.trim(),
        nfr_copies: payload.nfrCopies.trim(),

        drm_system: payload.drmSystem.trim(),

        manufacturer_bio: payload.manufacturerBio.trim(),
        logo_url: payload.logoUrl?.trim() || null,
        full_legal_name: payload.fullLegalName.trim(),
        business_address: payload.businessAddress.trim(),

        email: payload.email.trim(),
        product_contact_email: payload.productContactEmail.trim(),
        serials_contact_email: payload.serialsContactEmail.trim(),
        support_contact_email: payload.supportContactEmail.trim(),
        accounting_contact_email: payload.accountingContactEmail.trim(),
        partner_area_emails: payload.partnerAreaEmails.trim(),

        payment_preference: payload.paymentPreference.trim(),
        accounting_period: payload.accountingPeriod.trim(),
        product_list_pricing: payload.productListPricing.trim(),

        status: 'pending',
      })
      .select('*')
      .single();

    if (appErr) {
      console.error('Error saving seller application to database:', appErr);
      throw appErr;
    }

    // 4. Create support ticket for operations team tracking
    const ticketNumber = `APP-${Date.now().toString().slice(-6)}`;
    const markdownSummary = `
# 📝 PRODUCERTOY SELLER APPLICATION
**Application ID:** \`${application.id}\` | **Manufacturer:** **${payload.manufacturerName}**

---

### 🏢 Section 1: Company Overview
- **Manufacturer Name:** ${payload.manufacturerName}
- **Website:** ${payload.website}
- **Social Media:** ${payload.socialMedia}
- **Established Date:** ${payload.establishedDate}
- **Product Types Offered:** ${payload.productTypes.join(', ')}
- **User Base Estimate:** ${payload.userBaseEstimate}
- **Company Overview:**
${payload.companyOverview}

---

### 📦 Section 2: Products & Marketing
- **Product Catalog & Pricing:**
${payload.productCatalog}
- **Release Plans:**
${payload.releasePlans}
- **Video Walkthroughs:**
${payload.videoWalkthroughs}
- **Marketing Assets:**
${payload.marketingAssets}
- **NFR Copies Access:**
${payload.nfrCopies}

---

### 🔒 Section 3: Technical
- **DRM System:** ${payload.drmSystem}

---

### ⚖️ Section 4: Business & Legal
- **Manufacturer Biography:**
${payload.manufacturerBio}
- **High-Res Logo URL:** ${payload.logoUrl || 'Not uploaded'}
- **Authorized Legal Signatory:** ${payload.fullLegalName}
- **Business Address:**
${payload.businessAddress}

---

### 📬 Section 5: Contacts
- **Primary Correspondence Email:** ${payload.email}
- **Product Specialist Email:** ${payload.productContactEmail}
- **Serials Management Email:** ${payload.serialsContactEmail}
- **Customer Support Email:** ${payload.supportContactEmail}
- **Accounting & Invoicing Email:** ${payload.accountingContactEmail}
- **Partner Area Access Emails:** ${payload.partnerAreaEmails}

---

### 💼 Section 6: Commercial Setup
- **Payment Preference:** ${payload.paymentPreference}
- **Accounting Period:** ${payload.accountingPeriod}
- **Product List Pricing Setup:** ${payload.productListPricing}
    `.trim();

    await admin.from('support_tickets').insert({
      ticket_number: ticketNumber,
      category: 'DEVELOPER',
      status: 'OPEN',
      priority: 'HIGH',
      name: `${payload.fullLegalName} (${payload.manufacturerName})`,
      email: payload.email.trim(),
      subject: `[Seller Application] Partner Onboarding Request: ${payload.manufacturerName}`,
      description: markdownSummary,
    });

    return {
      success: true,
      applicationId: application.id,
      ticketNumber,
    };
  } catch (err: any) {
    console.error('submitSellerApplicationAction error:', err);
    return {
      success: false,
      error: err.message || 'Failed to submit seller application. Please check your network and try again.',
    };
  }
}
