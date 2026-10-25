'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { requireAuthenticatedUser, requireBrandMembership } from '@/lib/auth/serverAuth';
import { maskCustomerPii } from '@/lib/privacy/dataSharing';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Redacts any embedded customer email addresses inside text descriptions
 */
function redactEmbeddedEmails(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(EMAIL_REGEX, (matched) => {
    const parts = matched.split('@');
    if (parts.length === 2) {
      const userPart = parts[0];
      const domainPart = parts[1];
      const maskedUser =
        userPart.length > 2
          ? `${userPart[0]}***${userPart[userPart.length - 1]}`
          : `${userPart[0]}***`;
      return `${maskedUser}@${domainPart}`;
    }
    return '[email protected]';
  });
}

/**
 * Server-side zero-trust fetch for developer support tickets.
 * Customer personal emails are masked BEFORE the payload leaves the server.
 */
export async function getDeveloperSupportTicketsAction(brandId?: string): Promise<{
  success: boolean;
  tickets: any[];
  error?: string;
}> {
  try {
    const user = await requireAuthenticatedUser();
    if (brandId) {
      await requireBrandMembership(brandId);
    }

    const admin = getAdminClient();
    let query = admin.from('support_tickets').select('*');

    if (brandId) {
      query = query.or(`brand_id.eq.${brandId},and(email.eq.${user.email},category.eq.DEVELOPER)`);
    } else {
      query = query.eq('email', user.email).eq('category', 'DEVELOPER');
    }

    // Strictly exclude internal platform applications
    query = query
      .not('subject', 'ilike', '%[Brand Application]%')
      .not('subject', 'ilike', '%[Seller Application]%')
      .neq('category', 'PARTNERSHIP')
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('[getDeveloperSupportTicketsAction] Database error:', error);
      return { success: false, tickets: [], error: error.message };
    }

    // Server-side Zero-Trust Privacy Transformation
    const sanitizedTickets = (data || []).map((t) => {
      const isCustomerTicket =
        t.category !== 'DEVELOPER' && t.routing_source !== 'DEVELOPER_DESK';

      if (isCustomerTicket) {
        return {
          ...t,
          // Mask customer personal identifiers on the server
          email: maskCustomerPii(t.email, false, 'email'),
          name: maskCustomerPii(t.name, false, 'name'),
          // Redact any accidentally typed emails inside ticket subject/description
          description: redactEmbeddedEmails(t.description),
          subject: redactEmbeddedEmails(t.subject),
          // Never leak internal customer UUID to third-party brand developers
          user_id: null,
          is_customer_query: true,
        };
      }

      // Developer's own tickets to core team
      return {
        ...t,
        is_customer_query: false,
      };
    });

    return { success: true, tickets: sanitizedTickets };
  } catch (err: any) {
    console.error('[getDeveloperSupportTicketsAction] Server error:', err);
    return { success: false, tickets: [], error: err.message || 'Failed to load tickets.' };
  }
}

/**
 * Server-side zero-trust fetch for ticket thread messages.
 * Verifies caller access and redacts customer PII from message contents.
 */
export async function getDeveloperTicketMessagesAction(
  ticketId: string,
  brandId?: string
): Promise<{
  success: boolean;
  messages: any[];
  error?: string;
}> {
  try {
    const user = await requireAuthenticatedUser();
    if (brandId) {
      await requireBrandMembership(brandId);
    }

    const admin = getAdminClient();

    // 1. Authorization: Ensure ticket belongs to caller's brand or email
    const { data: ticket, error: ticketErr } = await admin
      .from('support_tickets')
      .select('id, brand_id, email, category, routing_source')
      .eq('id', ticketId)
      .single();

    if (ticketErr || !ticket) {
      return { success: false, messages: [], error: 'Ticket not found.' };
    }

    const isAuthorized =
      (brandId && ticket.brand_id === brandId) ||
      ticket.email?.toLowerCase() === user.email?.toLowerCase();

    if (!isAuthorized) {
      return { success: false, messages: [], error: 'Forbidden: Unauthorized ticket access.' };
    }

    // 2. Fetch messages
    const { data: msgs, error: msgsErr } = await admin
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (msgsErr) {
      return { success: false, messages: [], error: msgsErr.message };
    }

    const isCustomerTicket =
      ticket.category !== 'DEVELOPER' && ticket.routing_source !== 'DEVELOPER_DESK';

    // 3. Redact any customer personal contact info from message stream
    const sanitizedMessages = (msgs || []).map((m) => {
      const isCustomerSender =
        m.sender_type === 'CUSTOMER' || m.sender_type === 'customer';

      return {
        ...m,
        sender_name: isCustomerSender
          ? maskCustomerPii(m.sender_name, false, 'name')
          : m.sender_name,
        message: isCustomerTicket ? redactEmbeddedEmails(m.message) : m.message,
      };
    });

    return { success: true, messages: sanitizedMessages };
  } catch (err: any) {
    console.error('[getDeveloperTicketMessagesAction] Server error:', err);
    return { success: false, messages: [], error: err.message || 'Failed to load thread.' };
  }
}

/**
 * Server action: Developer creates a support ticket to ProducerToy Core Team
 */
export async function createDeveloperTicketAction(ticketData: {
  subject: string;
  description: string;
  priority?: string;
  daw?: string;
  os_platform?: string;
  brandId?: string;
}): Promise<{
  success: boolean;
  ticket?: any;
  error?: string;
}> {
  try {
    const user = await requireAuthenticatedUser();
    let brandName = 'Developer';

    if (ticketData.brandId) {
      const membership = await requireBrandMembership(ticketData.brandId);
      const admin = getAdminClient();
      const { data: b } = await admin.from('brands').select('name').eq('id', ticketData.brandId).single();
      if (b?.name) brandName = b.name;
    }

    const admin = getAdminClient();
    const ticketNumber = `DEV-${Date.now().toString().slice(-6)}`;

    const { data, error } = await admin
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        category: 'DEVELOPER',
        status: 'OPEN',
        priority: ticketData.priority || 'NORMAL',
        name: brandName,
        email: user.email,
        subject: ticketData.subject.trim(),
        description: ticketData.description.trim(),
        daw: ticketData.daw?.trim() || null,
        os_platform: ticketData.os_platform?.trim() || null,
        brand_id: ticketData.brandId || null,
        routing_source: 'DEVELOPER_DESK',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;
    return { success: true, ticket: data };
  } catch (err: any) {
    console.error('[createDeveloperTicketAction] Error:', err);
    return { success: false, error: err.message || 'Failed to create ticket.' };
  }
}

/**
 * Server action: Developer sends response to a ticket thread
 */
export async function replyDeveloperTicketAction({
  ticketId,
  message,
  brandId,
}: {
  ticketId: string;
  message: string;
  brandId?: string;
}): Promise<{
  success: boolean;
  message?: any;
  error?: string;
}> {
  try {
    const user = await requireAuthenticatedUser();
    let senderName = 'Developer Support';

    if (brandId) {
      await requireBrandMembership(brandId);
      const admin = getAdminClient();
      const { data: b } = await admin.from('brands').select('name').eq('id', brandId).single();
      if (b?.name) senderName = b.name;
    }

    const admin = getAdminClient();

    const { data: newMsg, error } = await admin
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_type: 'developer',
        sender_name: senderName,
        message: message.trim(),
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;

    // Update ticket updated_at timestamp
    await admin
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    return { success: true, message: newMsg };
  } catch (err: any) {
    console.error('[replyDeveloperTicketAction] Error:', err);
    return { success: false, error: err.message || 'Failed to send response.' };
  }
}

/**
 * Server action: Escalate an issue to ProducerToy Core Engineering Team
 */
export async function escalateDeveloperTicketToTeamAction({
  ticketId,
  reason,
  brandId,
}: {
  ticketId: string;
  reason: string;
  brandId?: string;
}): Promise<{
  success: boolean;
  message?: any;
  error?: string;
}> {
  try {
    const user = await requireAuthenticatedUser();
    let brandName = 'Developer Partner';

    if (brandId) {
      await requireBrandMembership(brandId);
      const admin = getAdminClient();
      const { data: b } = await admin.from('brands').select('name').eq('id', brandId).single();
      if (b?.name) brandName = b.name;
    }

    const admin = getAdminClient();

    // 1. Update ticket status
    const { error: ticketErr } = await admin
      .from('support_tickets')
      .update({
        status: 'ESCALATED_TO_TEAM',
        priority: 'URGENT',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (ticketErr) throw ticketErr;

    // 2. Post escalation log message
    const escalationText = `🔥 [ESCALATED TO PRODUCERTOY CORE TEAM by ${brandName}]\n\nEscalation Reason:\n${reason.trim()}`;

    const { data: newMsg, error: msgErr } = await admin
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_type: 'developer',
        sender_name: `${brandName} (Core Escalation)`,
        message: escalationText,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (msgErr) throw msgErr;

    return { success: true, message: newMsg };
  } catch (err: any) {
    console.error('[escalateDeveloperTicketToTeamAction] Error:', err);
    return { success: false, error: err.message || 'Failed to escalate ticket.' };
  }
}
