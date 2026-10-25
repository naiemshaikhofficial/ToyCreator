import { getSupabaseBrowserClient } from './client';
import { getAdminClient } from './admin';
import { maskCustomerPii } from '../privacy/dataSharing';

// Types
export interface BrandData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  support_email?: string | null;
  country?: string | null;
  contract_accepted_at?: string | null;
  contract_signatory_name?: string | null;
  contract_version?: string | null;
  payout_details?: Record<string, any> | null;
  created_at: string;
}


export interface BrandMembership {
  id: string;
  user_id: string;
  brand_id: string;
  role: 'owner' | 'admin' | 'developer' | 'support' | 'finance';
  status: 'active' | 'pending_approval' | 'suspended';
  payout_email: string | null;
  payout_method: string;
  payout_details?: Record<string, any> | null;
  revenue_share_percent: number;
  created_at: string;
  brands: BrandData;
}

/**
 * Fetch the active brand for the currently authenticated user
 */
export async function getCurrentUserBrand(): Promise<{
  user: any | null;
  membership: BrandMembership | null;
  isRegisteredBrand: boolean;
}> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, membership: null, isRegisteredBrand: false };
  }

  // 1. Query brand_members with brands join
  const { data: member, error } = await supabase
    .from('brand_members')
    .select('*, brands(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (member && member.brands) {
    return {
      user,
      membership: member as BrandMembership,
      isRegisteredBrand: true,
    };
  }

  // 1b. Check if there are pending invites for this user's email
  if (user.email) {
    try {
      const { claimPendingInvitesForUser } = await import('@/actions/brandTeamActions');
      const claimRes = await claimPendingInvitesForUser(user.id, user.email);
      if (claimRes.claimed > 0) {
        const { data: claimedMember } = await supabase
          .from('brand_members')
          .select('*, brands(*)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (claimedMember && claimedMember.brands) {
          return {
            user,
            membership: claimedMember as BrandMembership,
            isRegisteredBrand: true,
          };
        }
      }
    } catch (e) {
      console.error('Error claiming pending invites:', e);
    }
  }


  // 2. Check if user email matches the default platform brand (Producer Toy)
  if (
    user.email === 'naiemshaikhofficial@gmail.com' ||
    user.email === 'producertoy@gmail.com' ||
    user.email?.endsWith('@producertoy.com')
  ) {
    // Fetch Producer Toy brand directly
    const { data: ptBrand } = await supabase
      .from('brands')
      .select('*')
      .eq('slug', 'producer-toy')
      .maybeSingle();

    if (ptBrand) {
      const fallbackMember: BrandMembership = {
        id: 'pt-owner-' + user.id,
        user_id: user.id,
        brand_id: ptBrand.id,
        role: 'owner',
        status: 'active',
        payout_email: user.email,
        payout_method: 'Stripe Connect',
        revenue_share_percent: 70,
        created_at: new Date().toISOString(),
        brands: ptBrand as BrandData,
      };
      return { user, membership: fallbackMember, isRegisteredBrand: true };
    }
  }

  return { user, membership: null, isRegisteredBrand: false };
}

/**
 * Register a new brand along with creator membership
 */
export async function registerBrandForUser({
  userId,
  brandName,
  brandSlug,
  websiteUrl,
  description,
  payoutEmail,
}: {
  userId: string;
  brandName: string;
  brandSlug: string;
  websiteUrl?: string;
  description?: string;
  payoutEmail?: string;
}) {
  const admin = getAdminClient();

  // 1. Check if brand exists or insert
  let brandId: string;
  const { data: existingBrand } = await admin
    .from('brands')
    .select('id')
    .eq('slug', brandSlug)
    .maybeSingle();

  if (existingBrand) {
    brandId = existingBrand.id;
  } else {
    const { data: newBrand, error: brandErr } = await admin
      .from('brands')
      .insert({
        name: brandName,
        slug: brandSlug,
        website_url: websiteUrl || null,
        description: description || null,
      })
      .select('id')
      .single();

    if (brandErr) throw new Error(brandErr.message);
    brandId = newBrand.id;
  }

  // 2. Insert into brand_members
  const { data: membership, error: memberErr } = await admin
    .from('brand_members')
    .upsert({
      user_id: userId,
      brand_id: brandId,
      role: 'owner',
      status: 'active',
      payout_email: payoutEmail || null,
      payout_method: 'Stripe Connect',
      revenue_share_percent: 70,
    })
    .select('*, brands(*)')
    .single();

  if (memberErr) throw new Error(memberErr.message);
  return membership;
}

/**
 * Fetch products for a specific brand
 */
export async function getBrandProducts(brandId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching brand products:', error);
    return [];
  }
  return data || [];
}

/**
 * Fetch a single product by ID or slug
 */
export async function getProductById(productId: string) {
  if (!productId) return null;
  const supabase = getSupabaseBrowserClient();
  
  // 1. Try by ID first if it's a UUID
  const { data, error } = await supabase
    .from('products')
    .select('*, brands(*)')
    .eq('id', productId)
    .maybeSingle();

  if (data) {
    return data;
  }

  // 2. Fallback: search by slug in case parameter was a slug
  const { data: bySlug } = await supabase
    .from('products')
    .select('*, brands(*)')
    .eq('slug', productId)
    .maybeSingle();

  if (bySlug) {
    return bySlug;
  }

  return null;
}

/**
 * Create a new product in Supabase using Server Action
 */
export async function createBrandProduct(productData: any) {
  const { createBrandProductAction } = await import('@/actions/productActions');
  const result = await createBrandProductAction(productData);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
}

/**
 * Update an existing product in Supabase using Server Action
 */
export async function updateBrandProduct(productId: string, updates: any) {
  const { updateBrandProductAction } = await import('@/actions/productActions');
  const result = await updateBrandProductAction(productId, updates);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.data;
}

/**
 * Fetch purchases/orders for a brand
 */
export async function getBrandPurchases(brandId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('purchases')
    .select('*, products!inner(*)')
    .eq('products.brand_id', brandId)
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('Error fetching purchases:', error);
    return [];
  }
  return (data || []).map((p: any) => {
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

/**
 * Fetch device activations for a brand
 */
export async function getBrandDeviceActivations(brandId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('device_activations')
    .select('*, products!inner(*)')
    .eq('products.brand_id', brandId)
    .order('activated_at', { ascending: false });

  if (error) {
    console.error('Error fetching device activations:', error);
    return [];
  }
  return data || [];
}

/**
 * Revoke a device activation seat
 */
export async function revokeDeviceActivation(activationId: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('device_activations')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
    })
    .eq('id', activationId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch payouts for a brand
 */
export async function getBrandPayouts(brandId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching brand payouts:', error);
    return [];
  }
  return data || [];
}

/**
 * Fetch developer support tickets
 */
export async function getDeveloperTickets(email: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .or(`email.eq.${email},category.eq.DEVELOPER`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }
  return data || [];
}

/**
 * Create a new developer support ticket
 */
export async function createDeveloperTicket(ticketData: {
  name: string;
  email: string;
  subject: string;
  description: string;
  priority?: string;
  daw?: string;
  os_platform?: string;
}) {
  const admin = getAdminClient();
  const ticketNumber = `DEV-${Date.now().toString().slice(-6)}`;

  const { data, error } = await admin
    .from('support_tickets')
    .insert({
      ticket_number: ticketNumber,
      category: 'DEVELOPER',
      status: 'OPEN',
      priority: ticketData.priority || 'NORMAL',
      name: ticketData.name,
      email: ticketData.email,
      subject: ticketData.subject,
      description: ticketData.description,
      daw: ticketData.daw || null,
      os_platform: ticketData.os_platform || null,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch messages for a ticket
 */
export async function getDeveloperTicketMessages(ticketId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching ticket messages:', error);
    return [];
  }
  return data || [];
}

/**
 * Developer replies to a ticket
 */
export async function replyDeveloperTicket({
  ticketId,
  message,
  senderName,
}: {
  ticketId: string;
  message: string;
  senderName: string;
}) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      sender_type: 'developer',
      sender_name: senderName || 'Toy Creator Developer',
      message: message.trim(),
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;

  await admin
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  return data;
}

/**
 * Developer escalates a ticket to Producer Toy Team
 */
export async function escalateDeveloperTicketToTeam({
  ticketId,
  reason,
  senderName,
}: {
  ticketId: string;
  reason: string;
  senderName: string;
}) {
  const admin = getAdminClient();

  const { error: ticketErr } = await admin
    .from('support_tickets')
    .update({
      status: 'ESCALATED_TO_TEAM',
      priority: 'URGENT',
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId);

  if (ticketErr) throw ticketErr;

  const escalationText = `🔥 [ESCALATED TO PRODUCERTOY TEAM BY DEVELOPER: ${senderName}]\n\nReason: ${reason.trim()}`;

  const { data, error: msgErr } = await admin
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      sender_type: 'developer',
      sender_name: `${senderName} (Developer Escalation)`,
      message: escalationText,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (msgErr) throw msgErr;
  return data;
}

/**
 * Fetch marketplace categories and subcategories for product cataloging
 */
export async function getCatalogCategories(): Promise<{
  categories: Array<{ id: string; name: string; slug: string }>;
  subcategories: Array<{ id: string; category_id: string; name: string; slug: string }>;
}> {
  try {
    const supabase = getSupabaseBrowserClient();
    const [{ data: cats }, { data: subs }] = await Promise.all([
      supabase.from('categories').select('id, name, slug').order('name'),
      supabase.from('subcategories').select('id, category_id, name, slug, sort_order').order('sort_order', { ascending: true }),
    ]);

    return {
      categories: cats || [],
      subcategories: subs || [],
    };
  } catch (err) {
    console.error('Error loading catalog categories:', err);
    return { categories: [], subcategories: [] };
  }
}

