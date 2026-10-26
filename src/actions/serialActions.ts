'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { SerialKeyPoolStats, ProductLicenseApiConfig } from '@/lib/types';
import { maskCustomerPii } from '@/lib/privacy/dataSharing';
import { verifyProductOwnership } from '@/lib/auth/serverAuth';

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
    await verifyProductOwnership(productId, ['owner', 'admin', 'developer']);
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

    // 2. Fetch purchases for this product to enrich claimed licenses
    const { data: purchases } = await admin
      .from('purchases')
      .select('id, serial_key, customer_name, customer_email, seller_data_sharing_consented, purchased_at, razorpay_order_id, razorpay_payment_id, amount_paid, currency')
      .eq('product_id', productId)
      .order('purchased_at', { ascending: false });

    const purchaseMap = new Map<string, any>();
    const trackedKeysSet = new Set<string>();

    (purchases || []).forEach((p) => {
      if (p.serial_key) {
        purchaseMap.set(p.serial_key.trim(), p);
      }
    });

    const poolKeys = (keys || []).map((k) => {
      const match = purchaseMap.get(k.serial_key.trim());
      trackedKeysSet.add(k.serial_key.trim());
      return {
        id: k.id,
        product_id: k.product_id,
        serial_key: k.serial_key,
        is_used: Boolean(k.is_used || match),
        assigned_to_user_id: k.assigned_to_user_id,
        created_at: k.created_at,
        customer_email: null, // Zero-trust buyer privacy
        customer_name: match ? maskCustomerPii(match.customer_name, false, 'name') : null,
        order_id: match?.razorpay_order_id || match?.razorpay_payment_id || match?.id || null,
        purchased_at: match?.purchased_at || null,
        amount_paid: match?.amount_paid ? Number(match.amount_paid) : null,
        currency: match?.currency || 'USD',
      };
    });

    // 3. Include any direct purchases that issued genuine keys not in pre-pool
    const extraClaimedFromPurchases = (purchases || [])
      .filter((p) => p.serial_key && !trackedKeysSet.has(p.serial_key.trim()))
      .map((p) => ({
        id: p.id,
        product_id: productId,
        serial_key: p.serial_key.trim(),
        is_used: true,
        created_at: p.purchased_at || new Date().toISOString(),
        customer_email: null, // Zero-trust buyer privacy
        customer_name: maskCustomerPii(p.customer_name, false, 'name'),
        order_id: p.razorpay_order_id || p.razorpay_payment_id || p.id || null,
        purchased_at: p.purchased_at || null,
        amount_paid: p.amount_paid ? Number(p.amount_paid) : null,
        currency: p.currency || 'USD',
      }));

    const availableKeys = poolKeys.filter((k) => !k.is_used);
    const claimedKeys = [...poolKeys.filter((k) => k.is_used), ...extraClaimedFromPurchases];
    const total = availableKeys.length + claimedKeys.length;
    const available = availableKeys.length;
    const used = claimedKeys.length;
    const recentKeys = [...availableKeys, ...claimedKeys].slice(0, 30);

    // 4. Fetch product license configuration (delivery type, external webhook URL, secret)
    let licenseConfig: ProductLicenseApiConfig | undefined = undefined;
    try {
      const { data: prodData } = await admin
        .from('products')
        .select('license_delivery_type, license_api_url, license_api_secret, license_api_timeout_ms, license_api_fallback_to_pool, delivery_method')
        .eq('id', productId)
        .maybeSingle();

      if (prodData) {
        licenseConfig = {
          license_delivery_type: (prodData.license_delivery_type as any) || (prodData.delivery_method === 'direct_download' ? 'direct_download' : 'pool'),
          license_api_url: prodData.license_api_url || null,
          license_api_secret: prodData.license_api_secret || null,
          license_api_timeout_ms: prodData.license_api_timeout_ms || 3000,
          license_api_fallback_to_pool: prodData.license_api_fallback_to_pool ?? true,
        };
      }
    } catch (confErr) {
      console.warn('Note retrieving product license config:', confErr);
    }

    return {
      success: true,
      data: {
        total,
        available,
        used,
        availableKeys,
        claimedKeys,
        recentKeys,
        licenseConfig,
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
    await verifyProductOwnership(productId, ['owner', 'admin', 'developer']);
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
    await verifyProductOwnership(productId, ['owner', 'admin']);
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

/**
 * Server Action: Update a product's external license API / webhook configuration
 */
export async function updateProductLicenseConfigAction(
  productId: string,
  config: Partial<ProductLicenseApiConfig>
): Promise<{ success: boolean; error?: string }> {
  if (!productId) {
    return { success: false, error: 'Product ID is required.' };
  }

  try {
    await verifyProductOwnership(productId, ['owner', 'admin', 'developer']);
    const admin = getAdminClient();
    const updatePayload: Record<string, any> = {};

    if (config.license_delivery_type !== undefined) {
      updatePayload.license_delivery_type = config.license_delivery_type;
      if (config.license_delivery_type === 'direct_download') {
        updatePayload.delivery_method = 'direct_download';
      } else if (config.license_delivery_type === 'dedicated_licensing_server') {
        updatePayload.delivery_method = 'dedicated_licensing_server';
      } else {
        updatePayload.delivery_method = 'serial_key';
      }
    }

    if (config.license_api_url !== undefined) {
      updatePayload.license_api_url = config.license_api_url ? config.license_api_url.trim() : null;
    }

    if (config.license_api_secret !== undefined) {
      updatePayload.license_api_secret = config.license_api_secret ? config.license_api_secret.trim() : null;
    }

    if (config.license_api_timeout_ms !== undefined) {
      updatePayload.license_api_timeout_ms = Math.min(Math.max(Number(config.license_api_timeout_ms) || 3000, 1000), 10000);
    }

    if (config.license_api_fallback_to_pool !== undefined) {
      updatePayload.license_api_fallback_to_pool = Boolean(config.license_api_fallback_to_pool);
    }

    const { error } = await admin
      .from('products')
      .update(updatePayload)
      .eq('id', productId);

    if (error) {
      console.error('Error updating product license config:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/products/${productId}`);
    return { success: true };
  } catch (err: any) {
    console.error('updateProductLicenseConfigAction exception:', err);
    return { success: false, error: err.message || 'Failed to update license configuration.' };
  }
}

/**
 * Server Action: Test a developer's external license generation API endpoint
 * Dispatches a diagnostic test payload with HMAC-SHA256 signature and measures response latency.
 */
export async function testExternalLicenseApiAction(
  productId: string,
  url: string,
  secret?: string | null
): Promise<{
  success: boolean;
  latencyMs: number;
  statusCode?: number;
  receivedKey?: string;
  rawPreview?: string;
  error?: string;
}> {
  const cleanUrl = (url || '').trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return {
      success: false,
      latencyMs: 0,
      error: 'Invalid URL. Must begin with http:// or https://',
    };
  }

  const startTime = Date.now();
  const testPayload = {
    event: 'license.test',
    test: true,
    order_id: 'PT_TEST_DIAGNOSTIC_' + Date.now().toString(36).toUpperCase(),
    product_id: productId,
    customer_reference: 'pt_test_client_001',
    timestamp: Math.floor(Date.now() / 1000),
  };

  try {
    const bodyString = JSON.stringify(testPayload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ProducerToy-License-Tester/1.0 (+https://creators.producertoy.com)',
      'X-ProducerToy-Event': 'license.test',
      'X-ProducerToy-Timestamp': String(testPayload.timestamp),
    };

    if (secret && secret.trim()) {
      const cleanSecret = secret.trim();
      headers['Authorization'] = `Bearer ${cleanSecret}`;
      const crypto = await import('crypto');
      const signature = crypto.createHmac('sha256', cleanSecret).update(bodyString).digest('hex');
      headers['X-ProducerToy-Signature'] = signature;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers,
        body: bodyString,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      const rawText = await response.text().catch(() => '');
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(rawText);
      } catch {
        // Response not JSON
      }

      if (!response.ok) {
        return {
          success: false,
          latencyMs,
          statusCode: response.status,
          rawPreview: rawText.slice(0, 300),
          error: `Server responded with HTTP ${response.status} (${response.statusText})${rawText ? `: ${rawText.slice(0, 160)}` : ''}`,
        };
      }

      const receivedKey =
        parsedJson?.serial_key ||
        parsedJson?.serialKey ||
        parsedJson?.license_key ||
        parsedJson?.licenseKey ||
        parsedJson?.key ||
        (typeof parsedJson?.data === 'string' ? parsedJson.data : parsedJson?.data?.serial_key);

      if (!receivedKey) {
        return {
          success: false,
          latencyMs,
          statusCode: response.status,
          rawPreview: rawText.slice(0, 300),
          error: 'Received HTTP 200 OK, but response JSON did not contain a "serial_key" or "license_key" string field.',
        };
      }

      return {
        success: true,
        latencyMs,
        statusCode: response.status,
        receivedKey: String(receivedKey).trim(),
        rawPreview: rawText.slice(0, 300),
      };
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      if (fetchErr.name === 'AbortError') {
        return {
          success: false,
          latencyMs,
          error: 'Connection timed out after 6000ms. Please ensure your server responds promptly.',
        };
      }
      return {
        success: false,
        latencyMs,
        error: fetchErr.message || 'Network error occurred during test dispatch.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      error: err.message || 'Unexpected exception during API test.',
    };
  }
}
