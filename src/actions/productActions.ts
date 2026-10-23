'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { verifyProductOwnership, requireBrandMembership } from '@/lib/auth/serverAuth';

/**
 * Server Action: Update an existing brand product in Supabase using the service role client
 */
export async function updateBrandProductAction(productId: string, updates: any) {
  if (!productId || typeof productId !== 'string') {
    return { success: false, error: 'Valid product ID is required.' };
  }

  try {
    // Multi-tenant security check: Ensure caller has permissions for this product's brand
    await verifyProductOwnership(productId, ['owner', 'admin', 'developer']);

    const admin = getAdminClient();

    // Clean updates: strip undefined and format types
    const cleanedUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    for (const [key, value] of Object.entries(updates || {})) {
      if (value !== undefined) {
        cleanedUpdates[key] = value;
      }
    }

    const { data, error } = await admin
      .from('products')
      .update(cleanedUpdates)
      .eq('id', productId)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error updating product in Supabase:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Product not found in database or update was not applied.' };
    }

    revalidatePath('/dashboard/products');
    revalidatePath(`/dashboard/products/${productId}`);
    return { success: true, data };
  } catch (err: any) {
    console.error('updateBrandProductAction exception:', err);
    return { success: false, error: err.message || 'Server error updating product.' };
  }
}

/**
 * Server Action: Create a new brand product in Supabase using the service role client
 */
export async function createBrandProductAction(productData: any) {
  try {
    if (!productData?.brand_id) {
      return { success: false, error: 'Brand ID is required to create a product.' };
    }

    // Verify caller has permissions to create products for this brand
    const session = await requireBrandMembership(productData.brand_id, ['owner', 'admin', 'developer']);

    const admin = getAdminClient();

    // Clean product data: strip undefined
    const cleanedData: Record<string, any> = {
      brand_id: session.brandId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    for (const [key, value] of Object.entries(productData || {})) {
      if (value !== undefined) {
        cleanedData[key] = value;
      }
    }

    const { data, error } = await admin
      .from('products')
      .insert(cleanedData)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error creating product in Supabase:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Failed to insert product.' };
    }

    revalidatePath('/dashboard/products');
    return { success: true, data };
  } catch (err: any) {
    console.error('createBrandProductAction exception:', err);
    return { success: false, error: err.message || 'Server error creating product.' };
  }
}
