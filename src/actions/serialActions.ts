'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { SerialKeyPoolStats } from '@/lib/types';

/**
 * Server Action: Get serial key pool statistics and latest keys for a product
 */
export async function getProductSerialStatsAction(productId: string): Promise<{
  success: boolean;
  data?: SerialKeyPoolStats;
  error?: string;
}> {
  if (!productId) {
    return { success: false, error: 'Product ID is required.' };
  }

  try {
    const admin = getAdminClient();

    // 1. Fetch all serial keys for this product
    const { data: keys, error } = await admin
      .from('serial_keys')
      .select('id, product_id, serial_key, is_used, assigned_to_user_id, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching serial keys from Supabase:', error);
      return { success: false, error: error.message };
    }

    const allKeys = keys || [];
    const total = allKeys.length;
    const available = allKeys.filter((k) => !k.is_used).length;
    const used = allKeys.filter((k) => k.is_used).length;
    const recentKeys = allKeys.slice(0, 20);

    return {
      success: true,
      data: {
        total,
        available,
        used,
        recentKeys,
      },
    };
  } catch (err: any) {
    console.error('getProductSerialStatsAction exception:', err);
    return { success: false, error: err.message || 'Failed to retrieve serial statistics.' };
  }
}

/**
 * Server Action: Batch upload a list of raw serial keys (one per line or comma separated)
 */
export async function batchUploadSerialsAction(
  productId: string,
  rawKeysText: string
): Promise<{
  success: boolean;
  addedCount?: number;
  duplicateCount?: number;
  error?: string;
}> {
  if (!productId) {
    return { success: false, error: 'Product ID is required.' };
  }
  if (!rawKeysText || !rawKeysText.trim()) {
    return { success: false, error: 'Please enter at least one serial key.' };
  }

  try {
    const admin = getAdminClient();

    // Split by newlines or commas, trim whitespace and quotes, filter empty
    const parsedKeys = rawKeysText
      .split(/[\r\n,]+/)
      .map((k) => k.trim().replace(/^["']|["']$/g, ''))
      .filter((k) => k.length > 0);

    // Deduplicate within the input list
    const uniqueInputKeys = Array.from(new Set(parsedKeys));

    if (uniqueInputKeys.length === 0) {
      return { success: false, error: 'No valid serial keys found in input.' };
    }

    // Fetch existing keys for this product to avoid duplicates
    const { data: existingRows } = await admin
      .from('serial_keys')
      .select('serial_key')
      .eq('product_id', productId);

    const existingKeySet = new Set((existingRows || []).map((r) => r.serial_key));

    const keysToInsert = uniqueInputKeys
      .filter((key) => !existingKeySet.has(key))
      .map((key) => ({
        product_id: productId,
        serial_key: key,
        is_used: false,
        created_at: new Date().toISOString(),
      }));

    const duplicateCount = uniqueInputKeys.length - keysToInsert.length;

    if (keysToInsert.length === 0) {
      return {
        success: true,
        addedCount: 0,
        duplicateCount,
        error: 'All provided keys already exist in the pool for this product.',
      };
    }

    // Insert keys in batches of 100 to avoid request size limits
    const BATCH_SIZE = 100;
    let totalInserted = 0;

    for (let i = 0; i < keysToInsert.length; i += BATCH_SIZE) {
      const batch = keysToInsert.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await admin
        .from('serial_keys')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting serial batch:', insertError);
        return {
          success: false,
          addedCount: totalInserted,
          duplicateCount,
          error: `Inserted ${totalInserted} keys before error: ${insertError.message}`,
        };
      }
      totalInserted += batch.length;
    }

    revalidatePath(`/dashboard/products/${productId}`);
    revalidatePath('/dashboard/products');

    return {
      success: true,
      addedCount: totalInserted,
      duplicateCount,
    };
  } catch (err: any) {
    console.error('batchUploadSerialsAction exception:', err);
    return { success: false, error: err.message || 'Failed to batch upload serial keys.' };
  }
}

/**
 * Server Action: Delete a specific unused serial key from the pool
 */
export async function deleteSerialKeyAction(
  serialId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  if (!serialId || !productId) {
    return { success: false, error: 'Serial ID and Product ID are required.' };
  }

  try {
    const admin = getAdminClient();

    // Only allow deleting unused keys
    const { error } = await admin
      .from('serial_keys')
      .delete()
      .eq('id', serialId)
      .eq('product_id', productId)
      .eq('is_used', false);

    if (error) {
      console.error('Error deleting serial key:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/products/${productId}`);
    return { success: true };
  } catch (err: any) {
    console.error('deleteSerialKeyAction exception:', err);
    return { success: false, error: err.message || 'Failed to delete serial key.' };
  }
}
