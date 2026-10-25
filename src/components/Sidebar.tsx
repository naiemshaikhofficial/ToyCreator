'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import {
  Sidebar as AceternitySidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Coins,
  CreditCard,
  KeyRound,
  FileText,
  LifeBuoy,
  Settings,
  LogOut,
  ExternalLink,
  PlusCircle,
  Building,
  Code,
  Search,
  X,
  Globe,
  Pin,
  PinOff,
  Tag,
  Activity,
  Users,
  Disc,
  Music,
  CheckCircle,
  RotateCcw,
  FileSpreadsheet,
  Percent,
  Ticket,
  MessageSquare,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { canAccessRoute, ROLE_BADGES, BrandRole } from '@/lib/rbac';
import { motion, AnimatePresence } from 'motion/react';

export const NAV_ITEMS = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Products', href: '/dashboard/products', icon: Package },
  { name: 'Coupons & Deals', href: '/dashboard/coupons', icon: Tag },
  { name: 'Orders & Sales', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Earnings', href: '/dashboard/earnings', icon: Coins },
  { name: 'Payouts', href: '/dashboard/payouts', icon: CreditCard },
  { name: 'Licensing & DRM', href: '/dashboard/licensing', icon: KeyRound },
  { name: 'Developer Guide & API', href: '/dashboard/developers', icon: Code },
  { name: 'Agreements & Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Support', href: '/dashboard/support', icon: LifeBuoy },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export interface SubMenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export interface NavSection {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  subItems: SubMenuItem[];
}

const SECTIONS: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    subItems: [],
  },
  {
    id: 'products',
    label: 'Products',
    href: '/dashboard/products',
    icon: Package,
    subItems: [
      { label: 'All Products', href: '/dashboard/products', icon: Package },
      { label: 'Audio Plugins', href: '/dashboard/products?type=plugin', icon: Disc },
      { label: 'Sample Packs', href: '/dashboard/products?type=sample_pack', icon: Music },
      { label: 'Add Product', href: '/dashboard/products/new', icon: PlusCircle },
    ],
  },
  {
    id: 'coupons',
    label: 'Offers & Deals',
    href: '/dashboard/coupons',
    icon: Tag,
    subItems: [
      { label: 'All Coupons & Deals', href: '/dashboard/coupons', icon: Tag },
      { label: 'Product Discounts', href: '/dashboard/coupons?tab=discounts', icon: Percent },
      { label: 'Coupon Codes', href: '/dashboard/coupons?tab=codes', icon: Ticket },
      { label: 'Create New Offer', href: '/dashboard/coupons?action=new', icon: PlusCircle },
    ],
  },
  {
    id: 'orders',
    label: 'Orders & Sales',
    href: '/dashboard/orders',
    icon: ShoppingCart,
    subItems: [
      { label: 'All Orders', href: '/dashboard/orders', icon: ShoppingCart },
      { label: 'Completed Sales', href: '/dashboard/orders?status=completed', icon: CheckCircle },
      { label: 'Refunds & Disputes', href: '/dashboard/orders?status=refunded', icon: RotateCcw },
      { label: 'Invoices & Receipts', href: '/dashboard/orders?tab=invoices', icon: FileText },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    subItems: [
      { label: 'Revenue Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Product Conversions', href: '/dashboard/analytics', icon: Activity },
      { label: 'Customer Geography', href: '/dashboard/analytics', icon: Globe },
    ],
  },
  {
    id: 'finance',
    label: 'Earnings',
    href: '/dashboard/earnings',
    icon: Coins,
    subItems: [
      { label: 'Earnings', href: '/dashboard/earnings', icon: Coins },
      { label: 'Payouts', href: '/dashboard/payouts', icon: CreditCard },
      { label: 'Tax Invoices', href: '/dashboard/orders?tab=invoices', icon: FileSpreadsheet },
      { label: 'Bank Setup', href: '/dashboard/settings?tab=payouts', icon: Building },
    ],
  },
  {
    id: 'payouts',
    label: 'Payouts',
    href: '/dashboard/payouts',
    icon: CreditCard,
    subItems: [
      { label: 'Payout History', href: '/dashboard/payouts', icon: CreditCard },
      { label: 'Bank Setup', href: '/dashboard/settings?tab=payouts', icon: Building },
    ],
  },
  {
    id: 'licensing',
    label: 'Licensing & DRM',
    href: '/dashboard/licensing',
    icon: KeyRound,
    subItems: [
      { label: 'Active Licenses', href: '/dashboard/licensing', icon: KeyRound },
      { label: 'Device Activations', href: '/dashboard/licensing', icon: Shield },
      { label: 'JUCE SDK Engine', href: '/dashboard/developers', icon: Code },
    ],
  },
  {
    id: 'developers',
    label: 'Developers & API',
    href: '/dashboard/developers',
    icon: Code,
    subItems: [
      { label: 'C++ JUCE SDK Guide', href: '/dashboard/developers', icon: Code },
      { label: 'Brand API Keys', href: '/dashboard/settings?tab=developer', icon: KeyRound },
      { label: 'Webhook Endpoints', href: '/dashboard/settings?tab=developer', icon: Activity },
      { label: 'Offline DRM Guide', href: '/dashboard/developers', icon: FileText },
    ],
  },
  {
    id: 'documents',
    label: 'Agreements',
    href: '/dashboard/documents',
    icon: FileText,
    subItems: [
      { label: 'Distribution Agreement', href: '/dashboard/documents', icon: FileText },
      { label: 'Royalty & Tax Terms', href: '/dashboard/documents', icon: FileText },
      { label: 'Intellectual Property', href: '/dashboard/documents', icon: Shield },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    href: '/dashboard/support',
    icon: LifeBuoy,
    subItems: [
      { label: 'My Support Tickets', href: '/dashboard/support', icon: LifeBuoy },
      { label: 'Raise New Ticket', href: '/dashboard/support?action=new', icon: PlusCircle },
      { label: 'Escalated to Team', href: '/dashboard/support?filter=escalated', icon: MessageSquare },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    subItems: [
      { label: 'Profile', href: '/dashboard/settings?tab=profile', icon: Building },
      { label: 'Team', href: '/dashboard/settings?tab=team', icon: Users },
      { label: 'Payouts', href: '/dashboard/settings?tab=payouts', icon: CreditCard },
      { label: 'Developer API', href: '/dashboard/settings?tab=developer', icon: Code },
      { label: 'Security', href: '/dashboard/settings?tab=security', icon: Shield },
      { label: 'Agreements', href: '/dashboard/settings?tab=agreements', icon: FileText },
      { label: 'Audit Logs', href: '/dashboard/settings?tab=audit', icon: Activity },
    ],
  },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // If pinned, open state remains true
  const effectiveOpen = isPinned || open;

  return (
    <AceternitySidebar open={effectiveOpen} setOpen={setOpen} animate={true}>
      <SidebarBodyContent isPinned={isPinned} setIsPinned={setIsPinned} />
    </AceternitySidebar>
  );
}

function SidebarBodyContent({
  isPinned,
  setIsPinned,
}: {
  isPinned: boolean;
  setIsPinned: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { brand, user, membership, signOut } = useBrand();
  const { open } = useSidebar();
  const [searchQuery, setSearchQuery] = useState('');

  const currentRole = membership?.role as BrandRole | undefined;
  const roleBadge = currentRole ? ROLE_BADGES[currentRole] : null;

  // Filter sections by RBAC
  const accessibleSections = useMemo(() => {
    return SECTIONS.filter((section) => canAccessRoute(currentRole, section.href));
  }, [currentRole]);

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return accessibleSections;
    const q = searchQuery.toLowerCase().trim();
    return accessibleSections.filter(
      (sec) =>
        sec.label.toLowerCase().includes(q) ||
        sec.subItems.some((sub) => sub.label.toLowerCase().includes(q))
    );
  }, [accessibleSections, searchQuery]);

  // Find currently active section
  const activeSectionId = useMemo(() => {
    if (pathname === '/dashboard') return 'overview';
    for (const sec of accessibleSections) {
      if (sec.href !== '/dashboard' && pathname.startsWith(sec.href)) {
        return sec.id;
      }
    }
    return '';
  }, [pathname, accessibleSections]);

  return (
    <SidebarBody className="justify-between gap-4 h-full bg-[#101010] border-r border-[#242424] text-white">
      {/* Top Header / Logo / Navigation */}
      <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto no-scrollbar">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242424] shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden group/brand py-1"
          >
            <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
              <picture>
                <source srcSet="/logo.webp" type="image/webp" />
                <img
                  src="/logo.png"
                  alt="Toy Creator Logo"
                  className="w-8 h-8 object-contain transition-transform group-hover/brand:scale-105"
                />
              </picture>
            </div>

            <motion.div
              animate={{
                display: open ? 'block' : 'none',
                opacity: open ? 1 : 0,
              }}
              transition={{ duration: 0.15 }}
              className="flex flex-col min-w-0"
            >
              <span className="font-bold text-xs uppercase tracking-tight text-white leading-tight whitespace-nowrap">
                Toy Creator
              </span>
              <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                by ProducerToy
              </span>
            </motion.div>
          </Link>

          {/* Desktop Pin Toggle Button */}
          {open && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'Unpin sidebar (auto-collapse)' : 'Pin sidebar open'}
              className={`hidden md:flex p-1.5 rounded-lg text-zinc-400 hover:text-white transition ${
                isPinned ? 'bg-[#222222] text-white' : 'hover:bg-[#1a1a1a]'
              }`}
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </motion.button>
          )}
        </div>

        {/* Brand / Role pill when open */}
        {open && brand?.name && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-[#161616] border border-[#262626] flex items-center justify-between shrink-0"
          >
            <span className="text-[11px] font-medium text-zinc-300 truncate max-w-[130px]">
              {brand.name}
            </span>
            {roleBadge && (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase tracking-wider border shrink-0 ${roleBadge.badgeClass}`}
              >
                {roleBadge.label}
              </span>
            )}
          </motion.div>
        )}

        {/* Search input when open */}
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-3 relative shrink-0"
          >
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search nav..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161616] border border-[#282828] focus:border-zinc-400 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        )}

        {/* Navigation Links */}
        <div className="mt-3 flex flex-col gap-1 overflow-y-auto no-scrollbar py-1">
          {filteredSections.map((sec) => {
            const Icon = sec.icon;
            const isActive =
              sec.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(sec.href);

            return (
              <div key={sec.id} className="flex flex-col">
                <SidebarLink
                  link={{
                    label: sec.label,
                    href: sec.href,
                    icon: (
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-zinc-400 group-hover/sidebar:text-white'
                        }`}
                      />
                    ),
                  }}
                  isActive={isActive}
                />

                {/* Sub-items when expanded and active */}
                {open && isActive && sec.subItems.length > 0 && !searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="ml-6 pl-2.5 my-1 border-l border-[#282828] flex flex-col gap-1"
                  >
                    {sec.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isSubActive = pathname === sub.href;

                      return (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className={`flex items-center gap-2 py-1 px-2 rounded-md text-[11px] transition ${
                            isSubActive
                              ? 'text-white font-medium bg-[#1e1e1e]'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#161616]'
                          }`}
                        >
                          <SubIcon className="w-3 h-3 shrink-0 text-zinc-500" />
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile & Live Store Actions */}
      <div className="pt-3 border-t border-[#242424] flex flex-col gap-1 shrink-0">
        {/* External Live Store Link */}
        <SidebarLink
          link={{
            label: 'Live Store',
            href: 'https://producertoy.com',
            icon: (
              <ExternalLink className="w-4 h-4 shrink-0 text-zinc-400 group-hover/sidebar:text-white" />
            ),
          }}
          target="_blank"
          rel="noreferrer"
        />

        {/* User Profile / Logout */}
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-[#161616] transition group">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden"
          >
            <div className="w-7 h-7 rounded-full bg-[#242424] border border-zinc-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
              {brand?.name ? brand.name[0] : 'C'}
            </div>

            <motion.div
              animate={{
                display: open ? 'block' : 'none',
                opacity: open ? 1 : 0,
              }}
              transition={{ duration: 0.15 }}
              className="flex flex-col min-w-0"
            >
              <span className="text-xs font-medium text-white truncate max-w-[130px]">
                {brand?.name || 'Producer Toy'}
              </span>
              <span className="text-[10px] text-zinc-400 truncate max-w-[130px]">
                {user?.email || 'creator@toy.com'}
              </span>
            </motion.div>
          </Link>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={() => signOut()}
            title="Sign Out"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#202020] rounded-lg transition shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </SidebarBody>
  );
}
