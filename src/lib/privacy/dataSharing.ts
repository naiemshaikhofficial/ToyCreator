import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ProductDataSharingConfig {
  productId: string
  productName: string
  sellerName: string
  brandId?: string | null
  sharingEnabled: boolean
  requiresExplicitConsent: boolean
  purpose: string
  sharedFields: string[]
  disclosureVersion: string
  productEulaUrl?: string | null
  productEulaText?: string | null
}

export interface CartDataSharingAudit {
  requiresSharing: boolean
  requiresExplicitConsent: boolean
  configs: ProductDataSharingConfig[]
}

/**
 * Masks customer personal identifiers when seller data sharing is not authorized.
 */
export function maskCustomerPii(
  value: string | null | undefined,
  isConsentGranted: boolean,
  type: 'email' | 'name' | 'phone' = 'email'
): string {
  if (isConsentGranted && value) {
    return value
  }

  if (!value) {
    return type === 'email' ? 'Protected Customer' : 'Customer'
  }

  if (type === 'email') {
    const parts = value.split('@')
    if (parts.length === 2) {
      const userPart = parts[0]
      const domainPart = parts[1]
      const maskedUser = userPart.length > 2
        ? `${userPart[0]}***${userPart[userPart.length - 1]}`
        : `${userPart[0]}***`
      return `${maskedUser}@${domainPart}`
    }
    return 'Protected Customer'
  }

  if (type === 'name') {
    const parts = value.trim().split(' ')
    if (parts.length > 0 && parts[0]) {
      return `${parts[0]} (Protected Buyer)`
    }
    return 'Protected Buyer'
  }

  return '[Protected by ProducerToy]'
}
