'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { requireBrandMembership, verifyCouponOwnership } from '@/lib/auth/serverAuth';

export interface CouponItem {
  id: string;
  code: string;
  discount_percent: number;
  discount_type: 'percentage' | 'fixed';
  discount_amount_usd: number;
  is_active: boolean;
  expires_at: string | null;
  start_date: string | null;
  max_redemptions: number | null;
  times_redeemed: number;
  brand_id: string | null;
  product_id: string | null;
  created_at: string;
  products?: {
    id: string;
    name: string;
    slug: string;
    cover_image: string | null;
  } | null;
}

/**
 * Fetch all coupons for a given brand
 */
export async function getBrandCouponsAction(brandId: string): Promise<{
  success: boolean;
  coupons: CouponItem[];
  error?: string;
}> {
  if (!brandId) {
    return { success: false, coupons: [], error: 'Brand ID is required.' };
  }

  try {
    await requireBrandMembership(brandId);
    const admin = getAdminClient();
    const { data, error } = await admin
      .from('coupons')
      .select('*, products(id, name, slug, cover_image)')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching brand coupons:', error);
      return { success: false, coupons: [], error: error.message };
    }

    return { success: true, coupons: (data || []) as CouponItem[] };
  } catch (err: any) {
    console.error('getBrandCouponsAction exception:', err);
    return { success: false, coupons: [], error: err.message || 'Server error loading coupons.' };
  }
}

/**
 * Fetch brand products for coupon target dropdown
 */
export async function getBrandProductsForCouponsAction(brandId: string): Promise<{
  id: string;
  name: string;
  price_usd: number;
}[]> {
  if (!brandId) return [];

  try {
    await requireBrandMembership(brandId);
    const admin = getAdminClient();
    const { data } = await admin
      .from('products')
      .select('id, name, price_usd')
      .eq('brand_id', brandId)
      .order('name', { ascending: true });

    return (data || []) as any[];
  } catch (err) {
    console.error('Error fetching brand products for coupons:', err);
    return [];
  }
}

export interface CreateCouponParams {
  brandId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountPercent?: number;
  discountAmountUsd?: number;
  productId?: string | null;
  expiresAt?: string | null;
  maxRedemptions?: number | null;
}

/**
 * Create a new coupon / promotional offer
 */
export async function createCouponAction(params: CreateCouponParams): Promise<{
  success: boolean;
  coupon?: CouponItem;
  error?: string;
}> {
  const cleanCode = (params.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

  if (!cleanCode) {
    return { success: false, error: 'A valid coupon code is required (e.g. SUMMER20).' };
  }
  if (!params.brandId) {
    return { success: false, error: 'Brand ID is required.' };
  }

  const isPercent = params.discountType === 'percentage';
  const percentVal = isPercent ? Math.min(100, Math.max(1, Math.round(params.discountPercent || 0))) : 0;
  const fixedVal = !isPercent ? Math.max(0, Number(params.discountAmountUsd || 0)) : 0;

  if (isPercent && percentVal <= 0) {
    return { success: false, error: 'Percentage discount must be between 1% and 100%.' };
  }
  if (!isPercent && fixedVal <= 0) {
    return { success: false, error: 'Fixed discount amount must be greater than $0.00.' };
  }

  try {
    const session = await requireBrandMembership(params.brandId, ['owner', 'admin', 'developer']);
    const admin = getAdminClient();

    // Check if code already exists
    const { data: existing } = await admin
      .from('coupons')
      .select('id')
      .eq('code', cleanCode)
      .maybeSingle();

    if (existing) {
      return { success: false, error: `Coupon code "${cleanCode}" is already in use. Please choose another code.` };
    }

    const payload: any = {
      code: cleanCode,
      brand_id: session.brandId,
      product_id: params.productId || null,
      discount_type: params.discountType,
      discount_percent: isPercent ? percentVal : Math.min(100, Math.round((fixedVal / 50) * 100)), // fallback percent for legacy checks
      discount_amount_usd: fixedVal,
      max_redemptions: params.maxRedemptions ? Number(params.maxRedemptions) : null,
      times_redeemed: 0,
      expires_at: params.expiresAt ? new Date(params.expiresAt).toISOString() : null,
      start_date: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await admin
      .from('coupons')
      .insert(payload)
      .select('*, products(id, name, slug, cover_image)')
      .single();

    if (error) {
      console.error('Error inserting coupon:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/coupons');
    return { success: true, coupon: data as CouponItem };
  } catch (err: any) {
    console.error('createCouponAction exception:', err);
    return { success: false, error: err.message || 'Server error creating coupon.' };
  }
}

/**
 * Toggle active / paused status of a coupon
 */
export async function toggleCouponStatusAction(
  couponId: string,
  currentStatus: boolean
): Promise<{ success: boolean; is_active?: boolean; error?: string }> {
  if (!couponId) return { success: false, error: 'Coupon ID is required.' };

  try {
    await verifyCouponOwnership(couponId, ['owner', 'admin', 'developer']);
    const admin = getAdminClient();
    const newStatus = !currentStatus;

    const { error } = await admin
      .from('coupons')
      .update({ is_active: newStatus })
      .eq('id', couponId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/coupons');
    return { success: true, is_active: newStatus };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to toggle coupon status.' };
  }
}

/**
 * Delete a coupon
 */
export async function deleteCouponAction(couponId: string): Promise<{ success: boolean; error?: string }> {
  if (!couponId) return { success: false, error: 'Coupon ID is required.' };

  try {
    await verifyCouponOwnership(couponId, ['owner', 'admin']);
    const admin = getAdminClient();
    const { error } = await admin
      .from('coupons')
      .delete()
      .eq('id', couponId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/coupons');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete coupon.' };
  }
}
