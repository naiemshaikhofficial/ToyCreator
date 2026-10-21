/**
 * Role-Based Access Control (RBAC) Architecture for Toy Creator
 * Modeled after digital audio plugin marketplaces (Plugin Boutique, KVR, Splice, Native Instruments).
 */

export type BrandRole = 'owner' | 'admin' | 'developer' | 'support' | 'finance';

export interface RolePermissionConfig {
  canViewOverview: boolean;
  canManageProducts: boolean;
  canViewOrders: boolean;
  canViewAnalytics: boolean;
  canViewEarnings: boolean;
  canManagePayouts: boolean;
  canEditBankPayouts: boolean;
  canManageLicensing: boolean;
  canManageTeam: boolean;
  canViewDocuments: boolean;
  canManageSupport: boolean;
  canAccessSettings: boolean;
}

export const ROLE_PERMISSIONS: Record<BrandRole, RolePermissionConfig> = {
  owner: {
    canViewOverview: true,
    canManageProducts: true,
    canViewOrders: true,
    canViewAnalytics: true,
    canViewEarnings: true,
    canManagePayouts: true,
    canEditBankPayouts: true,
    canManageLicensing: true,
    canManageTeam: true,
    canViewDocuments: true,
    canManageSupport: true,
    canAccessSettings: true,
  },
  admin: {
    canViewOverview: true,
    canManageProducts: true,
    canViewOrders: true,
    canViewAnalytics: true,
    canViewEarnings: true,
    canManagePayouts: false, // Cannot alter payouts or bank routing
    canEditBankPayouts: false, // Strictly owner
    canManageLicensing: true,
    canManageTeam: true,
    canViewDocuments: true,
    canManageSupport: true,
    canAccessSettings: true,
  },
  developer: {
    canViewOverview: true,
    canManageProducts: true, // Audio plugins, presets, installers, artwork
    canViewOrders: false,
    canViewAnalytics: false,
    canViewEarnings: false, // Isolated from earnings & bank accounts
    canManagePayouts: false,
    canEditBankPayouts: false,
    canManageLicensing: true, // Machine activations and DSP licensing testing
    canManageTeam: false,
    canViewDocuments: false,
    canManageSupport: true,
    canAccessSettings: false,
  },
  support: {
    canViewOverview: true,
    canManageProducts: false, // Cannot edit binaries or pricing
    canViewOrders: true, // Look up customer orders and license keys
    canViewAnalytics: false,
    canViewEarnings: false,
    canManagePayouts: false,
    canEditBankPayouts: false,
    canManageLicensing: true, // Reset hardware machine seats for buyers
    canManageTeam: false,
    canViewDocuments: false,
    canManageSupport: true, // Answer customer support tickets
    canAccessSettings: false,
  },
  finance: {
    canViewOverview: true,
    canManageProducts: false, // Cannot edit code, binaries, or software
    canViewOrders: true,
    canViewAnalytics: true,
    canViewEarnings: true, // 70/30 split, monthly totals, and sales ledger
    canManagePayouts: true, // Payout receipts, invoice statements
    canEditBankPayouts: false, // Only owner can alter payout destination
    canManageLicensing: false,
    canManageTeam: false,
    canViewDocuments: true, // Legal contracts, tax forms
    canManageSupport: false,
    canAccessSettings: false,
  },
};

/**
 * Route-level permission map defining which roles can access which dashboard URLs
 */
export const ROUTE_ALLOWED_ROLES: Record<string, BrandRole[]> = {
  '/dashboard': ['owner', 'admin', 'developer', 'support', 'finance'],
  '/dashboard/products': ['owner', 'admin', 'developer'],
  '/dashboard/orders': ['owner', 'admin', 'support', 'finance'],
  '/dashboard/analytics': ['owner', 'admin', 'finance'],
  '/dashboard/earnings': ['owner', 'admin', 'finance'],
  '/dashboard/payouts': ['owner', 'finance'],
  '/dashboard/licensing': ['owner', 'admin', 'developer', 'support'],
  '/dashboard/documents': ['owner', 'finance'],
  '/dashboard/support': ['owner', 'admin', 'developer', 'support'],
  '/dashboard/settings': ['owner', 'admin'],
  '/dashboard/profile': ['owner', 'admin'],
};

/**
 * Checks whether a given role has a specific capability permission
 */
export function hasPermission(
  role: BrandRole | undefined | null,
  permission: keyof RolePermissionConfig
): boolean {
  if (!role) return false;
  const config = ROLE_PERMISSIONS[role];
  return config ? Boolean(config[permission]) : false;
}

/**
 * Checks whether a given role is allowed to view a specific pathname
 */
export function canAccessRoute(
  role: BrandRole | undefined | null,
  pathname: string
): boolean {
  if (!role) return false;
  if (role === 'owner') return true;

  // Exact or prefix matching
  for (const [route, allowedRoles] of Object.entries(ROUTE_ALLOWED_ROLES)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return allowedRoles.includes(role);
    }
  }

  return true;
}

/**
 * Friendly label and badge styling per role
 */
export const ROLE_BADGES: Record<
  BrandRole,
  { label: string; badgeClass: string; description: string }
> = {
  owner: {
    label: 'Brand Owner',
    badgeClass: 'bg-white/10 text-white border-white/20',
    description: 'Full control over products, bank payouts, and team members.',
  },
  admin: {
    label: 'Brand Admin',
    badgeClass: 'bg-zinc-700/40 text-zinc-200 border-zinc-600/50',
    description: 'Can manage products, serial keys, and team members.',
  },
  developer: {
    label: 'Developer / Sound Designer',
    badgeClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50',
    description: 'Can upload plugins, presets, and audio libraries.',
  },
  support: {
    label: 'Customer Support',
    badgeClass: 'bg-sky-950/40 text-sky-300 border-sky-800/50',
    description: 'Can check orders, reset machine seats, and answer tickets.',
  },
  finance: {
    label: 'Finance / Accounting',
    badgeClass: 'bg-amber-950/40 text-amber-300 border-amber-800/50',
    description: 'Can view sales reports, earnings, and payout invoices.',
  },
};
