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
      })
      .eq('id', brandId);

    if (brandErr) throw brandErr;

    // 2. Update payout info in brand_members table if membership exists
    if (membershipId) {
      const { error: memErr } = await admin
        .from('brand_members')
        .update({
          payout_email: data.payoutEmail?.trim() || null,
          payout_method: data.payoutMethod || 'Stripe Connect',
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
