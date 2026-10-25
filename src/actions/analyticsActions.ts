'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { requireBrandMembership } from '@/lib/auth/serverAuth';
import { calculateItemizedSettlement } from '@/lib/accounting';
import { maskCustomerPii } from '@/lib/privacy/dataSharing';

export interface BrandAnalyticsData {
  grossRevenue: number;
  grossRevenueUsd: number;
  grossRevenueInr: number;
  netRoyalty70: number;
  platformFee30: number;
  netRoyaltyInr70?: number;
  totalUnits: number;
  totalProducts: number;
  activeProductsCount: number;
  activeDeviceSeats: number;
  products: any[];
  purchases: any[];
  activations: any[];
  payouts: any[];
  revenueTimeline: { name: string; revenue: number; sales: number }[];
  productPerformance: { id: string; name: string; revenue: number; sales: number; price: number }[];
  osTelemetry: { os: string; architecture: string; count: number; share_percent: number }[];
  dawTelemetry: { daw: string; count: number; share_percent: number }[];
  formatTelemetry: { format: string; count: number; share_percent: number }[];
  promotionalData: { tier: string; avg_discount: string; revenue: number; units: number }[];
  analyticsEvents?: {
    id: string;
    product_id: string;
    brand_id: string;
    event_type: string;
    referrer?: string;
    created_at: string;
  }[];
}

export async function getBrandFullAnalyticsAction(brandId: string): Promise<{
  success: boolean;
  data?: BrandAnalyticsData;
  error?: string;
}> {
  if (!brandId) {
    return { success: false, error: 'Brand ID is required.' };
  }

  try {
    await requireBrandMembership(brandId);
    const admin = getAdminClient();

    // 1. Fetch real products for this brand
    const { data: productsData, error: prodErr } = await admin
      .from('products')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (prodErr) {
      console.error('Error fetching brand products:', prodErr);
      return { success: false, error: prodErr.message };
    }

    const products = productsData || [];
    const productIds = products.map((p) => p.id);

    // 2. Fetch real purchases for this brand's products
    let purchases: any[] = [];
    if (productIds.length > 0) {
      const { data: purchData, error: purchErr } = await admin
        .from('purchases')
        .select('*, products(id, name, slug, price_usd, product_type)')
        .in('product_id', productIds)
        .order('purchased_at', { ascending: false });

      if (purchErr) {
        console.error('Error fetching brand purchases:', purchErr);
      } else {
        purchases = (purchData || []).map((p: any) => {
          const isConsented = Boolean(p.seller_data_sharing_consented);
          return {
            ...p,
            customer_email: maskCustomerPii(p.customer_email, isConsented, 'email'),
            customer_name: maskCustomerPii(p.customer_name, isConsented, 'name'),
            customer_phone: isConsented ? p.customer_phone : null,
            billing_address: isConsented ? p.billing_address : null,
            billing_city: isConsented ? p.billing_city : null,
            billing_state: isConsented ? p.billing_state : null,
            billing_zip: isConsented ? p.billing_zip : null,
            billing_country: isConsented ? p.billing_country : null,
          };
        });
      }
    }

    // 3. Fetch real device activations for this brand's products
    let activations: any[] = [];
    if (productIds.length > 0) {
      const { data: actData, error: actErr } = await admin
        .from('device_activations')
        .select('*, products(id, name, slug)')
        .in('product_id', productIds)
        .order('activated_at', { ascending: false });

      if (actErr) {
        console.error('Error fetching device activations:', actErr);
      } else {
        activations = actData || [];
      }
    }

    // 4. Fetch real payouts for this brand
    let payouts: any[] = [];
    const { data: payData, error: payErr } = await admin
      .from('payouts')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (payErr) {
      console.error('Error fetching payouts:', payErr);
    } else {
      payouts = payData || [];
    }

    // 5. Fetch real recorded analytics events (views, cart adds, external clicks)
    let analyticsEvents: any[] = [];
    try {
      const { data: eventData, error: eventErr } = await admin
        .from('product_analytics')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });

      if (eventErr) {
        console.warn('Note: product_analytics query returned:', eventErr.message);
      } else {
        analyticsEvents = eventData || [];
      }
    } catch (e: any) {
      console.warn('product_analytics fetch non-fatal error:', e.message);
    }

    // 6. Compute real financial metrics separated by currency to prevent raw INR/USD blending
    let grossRevenueUsd = 0;
    let grossRevenueInr = 0;
    let netRoyaltyUsd70 = 0;
    let platformFeeUsd30 = 0;
    let netRoyaltyInr70 = 0;
    let platformFeeInr30 = 0;

    purchases.forEach((p) => {
      const isUsd = p.currency === 'USD' || (!p.currency && p.paypal_order_id);
      const rawAmt = parseFloat(p.amount_paid) || (p.products?.price_usd ? parseFloat(p.products.price_usd) : 0);
      const isRefunded = p.status === 'refunded';

      if (isUsd) {
        grossRevenueUsd += rawAmt;
        const settlement = calculateItemizedSettlement({
          productPrice: rawAmt,
          currency: 'USD',
          paymentGateway: 'paypal',
          isRefunded,
        });
        netRoyaltyUsd70 += settlement.sellerFinalPayable;
        platformFeeUsd30 += settlement.platformGrossShare;
      } else {
        grossRevenueInr += rawAmt;
        const settlement = calculateItemizedSettlement({
          productPrice: rawAmt,
          currency: 'INR',
          paymentGateway: 'razorpay',
          isRefunded,
        });
        netRoyaltyInr70 += settlement.sellerFinalPayable;
        platformFeeInr30 += settlement.platformGrossShare;
      }
    });

    const grossRevenue = Number(grossRevenueUsd.toFixed(2));
    const netRoyalty70 = Number(netRoyaltyUsd70.toFixed(2));
    const platformFee30 = Number(platformFeeUsd30.toFixed(2));
    const totalUnits = purchases.length;
    const totalProducts = products.length;
    const activeProductsCount = products.filter((p) => p.is_active).length;
    const activeDeviceSeats = activations.filter((a) => a.is_active).length;

    // 6. Compute real product performance (separating currencies)
    const productPerformance = products.map((p) => {
      const pPurchases = purchases.filter((ord) => ord.product_id === p.id);
      const rev = pPurchases.reduce((acc, ord) => {
        const isUsd = ord.currency === 'USD' || (!ord.currency && ord.paypal_order_id);
        const amt = parseFloat(ord.amount_paid) || parseFloat(p.price_usd) || 0;
        return isUsd ? acc + amt : acc;
      }, 0);
      return {
        id: p.id,
        name: p.name,
        revenue: Number(rev.toFixed(2)),
        sales: pPurchases.length,
        price: parseFloat(p.price_usd) || 0,
      };
    });

    // 7. Compute real revenue timeline (grouped by date from real purchases in USD)
    let revenueTimeline: { name: string; revenue: number; sales: number }[] = [];
    if (purchases.length > 0) {
      const dateMap = new Map<string, { revenue: number; sales: number }>();
      purchases.forEach((p) => {
        const isUsd = p.currency === 'USD' || (!p.currency && p.paypal_order_id);
        const amt = isUsd ? (parseFloat(p.amount_paid) || 0) : 0;
        const dateStr = p.purchased_at
          ? new Date(p.purchased_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : 'Recent';
        const existing = dateMap.get(dateStr) || { revenue: 0, sales: 0 };
        existing.revenue += amt;
        existing.sales += 1;
        dateMap.set(dateStr, existing);
      });

      revenueTimeline = Array.from(dateMap.entries()).map(([name, val]) => ({
        name,
        revenue: parseFloat(val.revenue.toFixed(2)),
        sales: val.sales,
      }));
    }

    // 8. Compute real OS telemetry from real device_activations
    let osTelemetry: { os: string; architecture: string; count: number; share_percent: number }[] = [];
    if (activations.length > 0) {
      const osCountMap = new Map<string, number>();
      activations.forEach((a) => {
        const rawOs = a.os || 'Unknown OS';
        osCountMap.set(rawOs, (osCountMap.get(rawOs) || 0) + 1);
      });

      const totalActs = activations.length;
      osTelemetry = Array.from(osCountMap.entries()).map(([rawOs, count]) => {
        let arch = 'x86_64';
        if (rawOs.toLowerCase().includes('apple') || rawOs.toLowerCase().includes('m1') || rawOs.toLowerCase().includes('arm')) {
          arch = 'ARM64';
        }
        return {
          os: rawOs,
          architecture: arch,
          count,
          share_percent: Math.round((count / totalActs) * 100),
        };
      });
    }

    // 9. Compute real DAW telemetry from activations or purchases if available
    let dawTelemetry: { daw: string; count: number; share_percent: number }[] = [];
    const activationsWithDaw = activations.filter((a) => a.daw || a.host_daw);
    if (activationsWithDaw.length > 0) {
      const dawCountMap = new Map<string, number>();
      activationsWithDaw.forEach((a) => {
        const daw = a.daw || a.host_daw || 'Other DAW';
        dawCountMap.set(daw, (dawCountMap.get(daw) || 0) + 1);
      });
      const totalDaws = activationsWithDaw.length;
      dawTelemetry = Array.from(dawCountMap.entries()).map(([daw, count]) => ({
        daw,
        count,
        share_percent: Math.round((count / totalDaws) * 100),
      }));
    }

    // 10. Compute real Plugin Formats & Asset Delivery from catalog & purchases
    let formatTelemetry: { format: string; count: number; share_percent: number }[] = [];
    if (purchases.length > 0) {
      const formatCountMap = new Map<string, number>();
      purchases.forEach((p) => {
        const fmt = p.products?.vst_format?.split(',')[0]?.trim() || p.products?.product_type || 'Digital Asset';
        formatCountMap.set(fmt, (formatCountMap.get(fmt) || 0) + 1);
      });
      const totalFmt = purchases.length;
      formatTelemetry = Array.from(formatCountMap.entries()).map(([format, count]) => ({
        format,
        count,
        share_percent: Math.round((count / totalFmt) * 100),
      }));
    }

    // 11. Compute real Promotional Pricing Elasticity from real purchases
    let promotionalData: { tier: string; avg_discount: string; revenue: number; units: number }[] = [];
    if (purchases.length > 0) {
      let fullPriceRev = 0;
      let fullPriceUnits = 0;
      let promoRev = 0;
      let promoUnits = 0;

      purchases.forEach((p) => {
        const amount = parseFloat(p.amount_paid) || 0;
        const listPrice = parseFloat(p.products?.original_price_usd) || parseFloat(p.products?.price_usd) || 0;
        if (listPrice > 0 && amount < listPrice) {
          promoRev += amount;
          promoUnits += 1;
        } else {
          fullPriceRev += amount;
          fullPriceUnits += 1;
        }
      });

      if (fullPriceUnits > 0) {
        promotionalData.push({
          tier: 'Standard Retail',
          avg_discount: '0%',
          revenue: parseFloat(fullPriceRev.toFixed(2)),
          units: fullPriceUnits,
        });
      }
      if (promoUnits > 0) {
        promotionalData.push({
          tier: 'Promotional / Discounted',
          avg_discount: 'Discounted',
          revenue: parseFloat(promoRev.toFixed(2)),
          units: promoUnits,
        });
      }
    }

    return {
      success: true,
      data: {
        grossRevenue,
        grossRevenueUsd: Number(grossRevenueUsd.toFixed(2)),
        grossRevenueInr: Number(grossRevenueInr.toFixed(2)),
        netRoyalty70,
        platformFee30,
        netRoyaltyInr70: Number(netRoyaltyInr70.toFixed(2)),
        totalUnits,
        totalProducts,
        activeProductsCount,
        activeDeviceSeats,
        products,
        purchases,
        activations,
        payouts,
        revenueTimeline,
        productPerformance,
        osTelemetry,
        dawTelemetry,
        formatTelemetry,
        promotionalData,
        analyticsEvents,
      },
    };
  } catch (err: any) {
    console.error('getBrandFullAnalyticsAction exception:', err);
    return { success: false, error: err.message || 'Failed to retrieve brand analytics.' };
  }
}
