'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateBrandProfileAction(
  brandId: string,
  membershipId: string | null | undefined,
  data: {
    brandName: string;
    websiteUrl?: string | null;
    description?: string | null;
    logoUrl?: string | null;
    supportEmail?: string | null;
    country?: string | null;
    payoutEmail?: string | null;
    payoutMethod?: string;
  }
) {
  try {
    const admin = getAdminClient();

    // 1. Update brand info in brands table
    const { error: brandErr } = await admin
      .from('brands')
      .update({
        name: data.brandName.trim(),
        website_url: data.websiteUrl?.trim() || null,
        description: data.description?.trim() || null,
        logo_url: data.logoUrl?.trim() || null,
        support_email: data.supportEmail?.trim() || null,
        country: data.country?.trim() || null,
      })
      .eq('id', brandId);

    if (brandErr) throw brandErr;

    // 2. Update payout info in brand_members table if membership exists
    if (membershipId) {
      const { error: memErr } = await admin
        .from('brand_members')
        .update({
          payout_email: data.payoutEmail?.trim() || null,
          payout_method: data.payoutMethod || 'Direct Bank Wire / SWIFT',
          updated_at: new Date().toISOString(),
        })
        .eq('id', membershipId);

      if (memErr) throw memErr;
    }

    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    console.error('updateBrandProfileAction error:', err);
    return { success: false, error: err.message || 'Failed to update brand profile in database.' };
  }
}

export async function completeBrandOnboardingAction(params: {
  brandId: string;
  membershipId?: string | null;
  brandName: string;
  brandSlug?: string;
  logoUrl?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
  supportEmail: string;
  country?: string | null;
  payoutEmail: string;
  payoutMethod: string;
  signatoryName: string;
  signatoryTitle?: string;
}) {
  try {
    const admin = getAdminClient();

    if (!params.brandId) {
      return { success: false, error: 'Brand ID is required.' };
    }
    if (!params.brandName?.trim()) {
      return { success: false, error: 'Brand name is required.' };
    }
    if (!params.supportEmail?.trim()) {
      return { success: false, error: 'Support email is required.' };
    }
    if (!params.signatoryName?.trim()) {
      return { success: false, error: 'Digital signature (legal name) is required to accept the agreement.' };
    }

    const now = new Date().toISOString();

    // 1. Update brand info in brands table
    const brandUpdates: Record<string, any> = {
      name: params.brandName.trim(),
      support_email: params.supportEmail.trim(),
      country: params.country?.trim() || 'Global',
      contract_accepted_at: now,
      contract_signatory_name: `${params.signatoryName.trim()}${params.signatoryTitle?.trim() ? ` (${params.signatoryTitle.trim()})` : ''}`,
      contract_version: 'v1.0',
    };

    if (params.logoUrl !== undefined) {
      brandUpdates.logo_url = params.logoUrl?.trim() || null;
    }
    if (params.description !== undefined) {
      brandUpdates.description = params.description?.trim() || null;
    }
    if (params.websiteUrl !== undefined) {
      brandUpdates.website_url = params.websiteUrl?.trim() || null;
    }
    if (params.brandSlug?.trim()) {
      const sanitizedSlug = params.brandSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (sanitizedSlug) {
        brandUpdates.slug = sanitizedSlug;
      }
    }

    const { error: brandErr } = await admin
      .from('brands')
      .update(brandUpdates)
      .eq('id', params.brandId);

    if (brandErr) throw brandErr;

    // 2. Update brand_members table if membership exists
    if (params.membershipId) {
      const { error: memErr } = await admin
        .from('brand_members')
        .update({
          payout_email: params.payoutEmail?.trim() || params.supportEmail.trim(),
          payout_method: params.payoutMethod || 'Direct Bank Wire / SWIFT',
          status: 'active',
          updated_at: now,
        })
        .eq('id', params.membershipId);

      if (memErr) throw memErr;
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/profile');
    return { success: true };
  } catch (err: any) {
    console.error('completeBrandOnboardingAction error:', err);
    return { success: false, error: err.message || 'Failed to complete brand onboarding and contract acceptance.' };
  }
}

