export type ProductType = 'plugin' | 'sample_pack' | 'preset' | 'template';

export interface CreatorProduct {
  id: string;
  name: string;
  slug: string;
  brand_id?: string;
  product_type: ProductType;
  price_usd: number;
  original_price_usd?: number;
  cover_image?: string;
  demo_audio_url?: string;
  external_url?: string;
  download_url?: string;
  download_url_win?: string;
  download_url_mac?: string;
  youtube_url?: string;
  short_description?: string;
  full_description?: string;
  version?: string;
  changelog?: string;
  vst_format?: string;
  operating_system?: string;
  supported_daws?: string;
  delivery_method?: string;
  license_type?: string;
  file_size?: string;
  plugin_identifier?: string;
  max_activation_seats?: number;
  offline_grace_days?: number;
  is_active: boolean;
  is_featured?: boolean;
  license_delivery_type?: 'pool' | 'external_api' | 'dedicated_licensing_server' | 'direct_download';
  license_api_url?: string | null;
  license_api_secret?: string | null;
  license_api_timeout_ms?: number;
  license_api_fallback_to_pool?: boolean;
  created_at: string;
  updated_at?: string;
  faqs?: Array<{ question: string; answer: string }> | null;
  // Computed / Aggregated metrics
  sales_count: number;
  revenue_usd: number;
  downloads_count: number;
  rating?: number;
  review_count?: number;
}

export interface ProductLicenseApiConfig {
  license_delivery_type: 'pool' | 'external_api' | 'dedicated_licensing_server' | 'direct_download';
  license_api_url: string | null;
  license_api_secret: string | null;
  license_api_timeout_ms: number;
  license_api_fallback_to_pool: boolean;
}

export interface ProductSerialKey {
  id: string;
  product_id: string;
  serial_key: string;
  is_used: boolean;
  assigned_to_user_id?: string | null;
  created_at: string;
  customer_email?: string | null;
  customer_name?: string | null;
  order_id?: string | null;
  purchased_at?: string | null;
  amount_paid?: number | null;
  currency?: string | null;
}

export interface SerialKeyPoolStats {
  total: number;
  available: number;
  used: number;
  availableKeys: ProductSerialKey[];
  claimedKeys: ProductSerialKey[];
  recentKeys: ProductSerialKey[];
  licenseConfig?: ProductLicenseApiConfig;
}

export interface CreatorOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  billing_country: string;
  product_id: string;
  product_name: string;
  product_type: ProductType;
  amount: number;
  currency: string;
  payment_status: 'completed' | 'refunded' | 'pending';
  payment_gateway: 'razorpay' | 'paypal' | 'stripe';
  created_at: string;
  license_key?: string;
}

export interface CreatorPayout {
  id: string;
  payout_number: string;
  amount: number;
  currency: string;
  status: 'completed' | 'processing' | 'scheduled' | 'on_hold';
  destination: string;
  method: 'Stripe Connect' | 'PayPal Business' | 'Bank Transfer (Wise)' | 'Direct Wire';
  date: string;
  estimated_arrival?: string;
  fee: number;
  net_amount: number;
}

export interface DeviceLicense {
  id: string;
  product_id: string;
  product_name: string;
  user_email: string;
  device_name: string;
  os: 'macOS' | 'Windows' | 'Linux';
  device_id_hash: string;
  is_active: boolean;
  activated_at: string;
  last_seen_at: string;
  activation_seats_used: number;
  max_seats: number;
}

export interface LegalDocument {
  id: string;
  title: string;
  category: 'Terms' | 'Revenue Share' | 'Tax & Compliance' | 'Security';
  version: string;
  status: 'Signed' | 'Action Required' | 'Active';
  signed_at?: string;
  effective_date: string;
  file_url: string;
  description: string;
}

export interface CreatorProfile {
  id: string;
  email: string;
  full_name: string;
  creator_handle: string;
  brand_name: string;
  brand_slug: string;
  avatar_url?: string;
  bio?: string;
  website_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  payout_method: string;
  payout_email: string;
  tax_status: 'Verified (W-8BEN)' | 'Under Review' | 'Not Submitted';
  commission_rate: number; // e.g., 0.30 for 30% marketplace fee, 70% creator payout
  stats: {
    total_sales_count: number;
    gross_revenue: number;
    net_earnings: number;
    available_payout: number;
    pending_payout: number;
    active_products_count: number;
    total_downloads: number;
    active_devices: number;
  };
}

export interface AnalyticsDataPoint {
  date: string;
  revenue: number;
  sales: number;
  units: number;
}

export interface OsShare {
  os: string;
  share_percent: number;
  count: number;
  architecture: string;
}

export interface DawShare {
  daw: string;
  share_percent: number;
  count: number;
}

export interface FormatShare {
  format: string;
  share_percent: number;
  count: number;
}

export interface PromotionTierStat {
  tier: string;
  units: number;
  revenue: number;
  avg_discount: string;
}

export interface MonthlyStatementSummary {
  id: string;
  period: string;
  month: string;
  year: number;
  units_sold: number;
  gross_revenue: number;
  platform_fee_30: number;
  net_royalty_70: number;
  status: 'cleared' | 'processing';
  payout_date?: string;
  reference_no: string;
}
