import { getUser } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export interface CreatorSessionContext {
  userId: string;
  email: string;
  brandId: string;
  role: 'owner' | 'admin' | 'developer' | 'support' | 'finance';
}

/**
 * Requires the caller to have an active authenticated session.
 */
export async function requireAuthenticatedUser() {
  const { data: { user } } = await getUser();
  if (!user || !user.id) {
    throw new Error('Unauthorized: Authentication required.');
  }
  return user;
}

/**
 * Verifies that the authenticated caller is an active member of the specified brand.
 * Optionally enforces specific roles (e.g. ['owner', 'admin']).
 */
export async function requireBrandMembership(
  brandId: string,
  allowedRoles?: ('owner' | 'admin' | 'developer' | 'support' | 'finance')[]
): Promise<CreatorSessionContext> {
  const user = await requireAuthenticatedUser();

  if (!brandId || typeof brandId !== 'string') {
    throw new Error('Bad Request: Valid brand ID is required.');
  }

  const admin = getAdminClient();
  const { data: membership, error } = await admin
    .from('brand_members')
    .select('id, user_id, brand_id, role, status')
    .eq('user_id', user.id)
    .eq('brand_id', brandId)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !membership) {
    throw new Error('Forbidden: You do not have active authorized access to this brand.');
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(membership.role as any)) {
      throw new Error(`Forbidden: Insufficient permissions. Required role: ${allowedRoles.join(' or ')}.`);
    }
  }

  return {
    userId: user.id,
    email: user.email || '',
    brandId: membership.brand_id,
    role: membership.role as any,
  };
}

/**
 * Verifies that a product belongs to the authenticated user's authorized brand.
 */
export async function verifyProductOwnership(
  productId: string,
  allowedRoles?: ('owner' | 'admin' | 'developer' | 'support' | 'finance')[]
): Promise<{ product: any; session: CreatorSessionContext }> {
  const user = await requireAuthenticatedUser();
  const admin = getAdminClient();

  // 1. Fetch product to discover its brand_id
  const { data: product, error: prodErr } = await admin
    .from('products')
    .select('*, brands(id, name, slug)')
    .eq('id', productId)
    .maybeSingle();

  if (prodErr || !product) {
    throw new Error('Product not found in catalog.');
  }

  if (!product.brand_id) {
    throw new Error('Product does not have an assigned brand.');
  }

  // 2. Verify caller has membership in product's brand
  const session = await requireBrandMembership(product.brand_id, allowedRoles);

  return { product, session };
}

/**
 * Verifies that a coupon belongs to the authenticated user's authorized brand.
 */
export async function verifyCouponOwnership(
  couponId: string,
  allowedRoles?: ('owner' | 'admin' | 'developer' | 'support' | 'finance')[]
): Promise<{ coupon: any; session: CreatorSessionContext }> {
  const user = await requireAuthenticatedUser();
  const admin = getAdminClient();

  const { data: coupon, error: coupErr } = await admin
    .from('coupons')
    .select('*')
    .eq('id', couponId)
    .maybeSingle();

  if (coupErr || !coupon) {
    throw new Error('Coupon not found.');
  }

  if (!coupon.brand_id) {
    throw new Error('Coupon is not associated with any brand.');
  }

  const session = await requireBrandMembership(coupon.brand_id, allowedRoles);

  return { coupon, session };
}
