'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
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
  PanelLeftClose,
  PanelLeft,
  Tag,
  Star,
  DownloadCloud,
  MessageSquare,
  Shield,
  Activity,
  Users,
} from 'lucide-react';

import { canAccessRoute, hasPermission, ROLE_BADGES, BrandRole } from '@/lib/rbac';

export const NAV_ITEMS = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Products', href: '/dashboard/products', icon: Package },
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

type CreatorSectionId =
  | 'overview'
  | 'products'
  | 'orders'
  | 'analytics'
  | 'finance'
  | 'licensing'
  | 'developers'
  | 'documents'
  | 'support'
  | 'settings';

interface SubMenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  isAction?: boolean;
}

interface SectionConfig {
  id: CreatorSectionId;
  label: string;
  icon: React.ElementType;
  defaultHref: string;
  headerTitle: string;
  subItems: SubMenuItem[];
}

// 100% Creator Toy domain sections - No raw Supabase tables
const SECTIONS: SectionConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    defaultHref: '/dashboard',
    headerTitle: 'Command Center',
    subItems: [
      { label: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Live Sales Overview', href: '/dashboard/orders', icon: ShoppingCart },
      { label: 'Revenue Trends', href: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Brand Public Profile', href: '/dashboard/profile', icon: Building },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    defaultHref: '/dashboard/products',
    headerTitle: 'Product Catalog',
    subItems: [
      { label: 'All Products', href: '/dashboard/products', icon: Package, badge: 'Live' },
      { label: 'Add Product', href: '/dashboard/products/new', icon: PlusCircle, isAction: true },
      { label: 'Audio Assets & Stems', href: '/dashboard/products', icon: DownloadCloud },
      { label: 'Product DRM Seats', href: '/dashboard/licensing', icon: KeyRound },
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    defaultHref: '/dashboard/orders',
    headerTitle: 'Sales & Orders',
    subItems: [
      { label: 'All Orders', href: '/dashboard/orders', icon: ShoppingCart, badge: 'Live' },
      { label: 'Invoices & Receipts', href: '/dashboard/orders', icon: FileText },
      { label: 'Transactions', href: '/dashboard/orders', icon: CreditCard },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    defaultHref: '/dashboard/analytics',
    headerTitle: 'Performance Analytics',
    subItems: [
      { label: 'Revenue Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Product Conversions', href: '/dashboard/analytics', icon: Activity },
      { label: 'Customer Geography', href: '/dashboard/analytics', icon: Globe },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: Coins,
    defaultHref: '/dashboard/earnings',
    headerTitle: 'Finance & Payouts',
    subItems: [
      { label: 'Earnings', href: '/dashboard/earnings', icon: Coins, badge: 'Active' },
      { label: 'Payouts', href: '/dashboard/payouts', icon: CreditCard },
      { label: 'Bank & Payout Setup', href: '/dashboard/settings?tab=payouts', icon: Building },
    ],
  },
  {
    id: 'licensing',
    label: 'Licensing',
    icon: KeyRound,
    defaultHref: '/dashboard/licensing',
    headerTitle: 'Licenses & DRM',
    subItems: [
      { label: 'Active Licenses', href: '/dashboard/licensing', icon: KeyRound },
      { label: 'Device Activations', href: '/dashboard/licensing', icon: Shield },
      { label: 'C++ JUCE SDK Engine', href: '/dashboard/developers', icon: Code },
    ],
  },
  {
    id: 'developers',
    label: 'Developer',
    icon: Code,
    defaultHref: '/dashboard/developers',
    headerTitle: 'Developer Hub & API',
    subItems: [
      { label: 'C++ JUCE SDK Guide', href: '/dashboard/developers', icon: Code, badge: 'C++' },
      { label: 'Brand API Keys', href: '/dashboard/settings?tab=developer', icon: KeyRound },
      { label: 'Webhook Endpoints', href: '/dashboard/settings?tab=developer', icon: Activity },
      { label: 'Offline DRM Guide', href: '/dashboard/developers', icon: FileText },
    ],
  },
  {
    id: 'documents',
    label: 'Agreements',
    icon: FileText,
    defaultHref: '/dashboard/documents',
    headerTitle: 'Agreements & Legal',
    subItems: [
      { label: 'Distribution Agreement', href: '/dashboard/documents', icon: FileText, badge: 'v2.4' },
      { label: 'Royalty & Tax Terms', href: '/dashboard/documents', icon: FileText },
      { label: 'Intellectual Property', href: '/dashboard/documents', icon: Shield },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    icon: LifeBuoy,
    defaultHref: '/dashboard/support',
    headerTitle: 'Support Helpdesk',
    subItems: [
      { label: 'My Support Tickets', href: '/dashboard/support', icon: LifeBuoy },
      { label: 'Raise New Ticket', href: '/dashboard/support?action=new', icon: PlusCircle, isAction: true },
      { label: 'Escalated to Team', href: '/dashboard/support?filter=escalated', icon: MessageSquare, badge: 'Direct' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    defaultHref: '/dashboard/settings',
    headerTitle: 'Brand Settings',
    subItems: [
      { label: 'Profile', href: '/dashboard/settings?tab=profile', icon: Building },
      { label: 'Team', href: '/dashboard/settings?tab=team', icon: Users, badge: 'Admin' },
      { label: 'Payouts', href: '/dashboard/settings?tab=payouts', icon: CreditCard },
      { label: 'Developer API', href: '/dashboard/settings?tab=developer', icon: Code },
      { label: 'Security', href: '/dashboard/settings?tab=security', icon: Shield },
      { label: 'Agreements', href: '/dashboard/settings?tab=agreements', icon: FileText },
      { label: 'Audit Logs', href: '/dashboard/settings?tab=audit', icon: Activity },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { brand, user, membership, signOut } = useBrand();

  const detectSection = (path: string): CreatorSectionId => {
    if (path === '/dashboard') return 'overview';
    if (path.startsWith('/dashboard/products')) return 'products';
    if (path.startsWith('/dashboard/orders')) return 'orders';
    if (path.startsWith('/dashboard/analytics')) return 'analytics';
    if (path.startsWith('/dashboard/earnings') || path.startsWith('/dashboard/payouts')) return 'finance';
    if (path.startsWith('/dashboard/licensing')) return 'licensing';
    if (path.startsWith('/dashboard/developers')) return 'developers';
    if (path.startsWith('/dashboard/documents')) return 'documents';
    if (path.startsWith('/dashboard/support')) return 'support';
    if (path.startsWith('/dashboard/settings') || path.startsWith('/dashboard/profile')) return 'settings';
    return 'overview';
  };

  const [activeSection, setActiveSection] = useState<CreatorSectionId>(() => detectSection(pathname));
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(true); // Open by default
  const [searchQuery, setSearchQuery] = useState('');

  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentRole = membership?.role as BrandRole | undefined;
  const roleBadge = currentRole ? ROLE_BADGES[currentRole] : null;

  useEffect(() => {
    setActiveSection(detectSection(pathname));
  }, [pathname]);

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  const currentConfig = useMemo(() => {
    return SECTIONS.find((s) => s.id === activeSection) || SECTIONS[0];
  }, [activeSection]);

  const filteredSubItems = useMemo(() => {
    if (!searchQuery.trim()) return currentConfig.subItems;
    return currentConfig.subItems.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [currentConfig, searchQuery]);

  const isPanelVisible = isPinned || isHovered;

  const handleSubItemClick = (item: SubMenuItem) => {
    if (item.href.includes('action=new') && pathname === '/dashboard/support') {
      window.dispatchEvent(new CustomEvent('toy-new-ticket'));
    }
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`hidden lg:flex relative shrink-0 min-h-screen sticky top-0 h-screen z-30 select-none transition-[width] duration-200 ease-out ${
        isPinned ? 'w-[316px]' : 'w-[56px]'
      }`}
    >
      {/* =========================================================================
          TIER 1: Primary Icon Rail (56px) - Prominent & clean
         ========================================================================= */}
      <div className="w-[56px] bg-[#101010] border-r border-[#242424] flex flex-col items-center justify-between py-3.5 shrink-0 h-full z-20">
        {/* Top: Brand Emblem */}
        <div className="flex flex-col items-center gap-3.5">
          <Link
            href="/dashboard"
            title="Toy Creator"
            onClick={() => {
              setActiveSection('overview');
              setIsPinned(true);
            }}
            className="w-9 h-9 flex items-center justify-center hover:opacity-85 transition"
          >
            <picture>
              <source srcSet="/logo.webp" type="image/webp" />
              <img
                src="/logo.png"
                alt="Toy Creator Emblem"
                className="w-8 h-8 object-contain"
              />
            </picture>
          </Link>

          {/* Clean divider */}
          <div className="w-6 h-px bg-[#262626]" />

          {/* Rail Navigation Icons */}
          <div className="flex flex-col items-center gap-1.5">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;

              return (
                <Link
                  key={sec.id}
                  href={sec.defaultHref}
                  onClick={() => {
                    setActiveSection(sec.id);
                    setIsPinned(true); // Stays open when clicked
                  }}
                  onMouseEnter={() => {
                    if (!isPinned) {
                      setActiveSection(sec.id);
                    }
                  }}
                  title={sec.label}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative group ${
                    isActive
                      ? 'bg-[#222222] text-white shadow-inner border border-white/10'
                      : 'text-zinc-400 hover:text-white hover:bg-[#181818]'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {isActive && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-4.5 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  )}

                  {/* Clean Tooltip on hover when collapsed */}
                  {!isPanelVisible && (
                    <span className="absolute left-14 px-2.5 py-1 bg-[#181818] text-white text-xs font-medium rounded-md shadow-xl border border-[#2a2a2a] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {sec.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Rail Actions */}
        <div className="flex flex-col items-center gap-2">
          {/* External Store Link */}
          <a
            href="https://producertoy.com"
            target="_blank"
            rel="noreferrer"
            title="Open ProducerToy Store"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#181818] transition relative group"
          >
            <ExternalLink className="w-4 h-4" />
            {!isPanelVisible && (
              <span className="absolute left-14 px-2.5 py-1 bg-[#181818] text-white text-xs rounded-md shadow-xl border border-[#2a2a2a] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                producertoy.com
              </span>
            )}
          </a>

          {/* Collapse/Expand Toggle Button */}
          <button
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Collapse Sidebar' : 'Expand Sidebar'}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#181818] transition"
          >
            {isPinned ? <PanelLeftClose className="w-4.5 h-4.5" /> : <PanelLeft className="w-4.5 h-4.5" />}
          </button>

          {/* Sign Out */}
          <button
            onClick={() => signOut()}
            title="Sign Out"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#181818] transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          TIER 2: Sub-Panel (260px) - Spacious, clear, prominent text
         ========================================================================= */}
      <div
        className={`w-[260px] bg-[#141414] border-r border-[#262626] flex flex-col shrink-0 h-screen overflow-hidden transition-all duration-200 ease-out ${
          isPinned
            ? 'relative opacity-100 translate-x-0'
            : isHovered
            ? 'absolute left-[56px] top-0 bottom-0 z-30 shadow-[12px_0_35px_rgba(0,0,0,0.8)] opacity-100 translate-x-0'
            : 'absolute left-[56px] top-0 bottom-0 z-30 opacity-0 -translate-x-3 pointer-events-none'
        }`}
      >
        {/* Header Title & Active Brand */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#242424] bg-[#121212]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-sm font-bold text-white tracking-tight truncate">
              {currentConfig.headerTitle}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-[#202020] text-zinc-300 border border-[#2e2e2e] rounded-md font-semibold">
              {currentConfig.subItems.length}
            </span>
          </div>

          <button
            onClick={() => setIsPinned(false)}
            title="Collapse Sidebar"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1f1f1f] transition"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Scope / Role Tag */}
        <div className="px-4 py-2.5 border-b border-[#242424] bg-[#141414] flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-500 truncate max-w-[120px] font-semibold">
            {brand?.name || 'Producer Toy'}
          </span>
          {roleBadge && (
            <span className={`px-2 py-0.5 rounded border uppercase font-bold text-[10px] ${roleBadge.badgeClass}`}>
              {roleBadge.label}
            </span>
          )}
        </div>

        {/* Search Box */}
        <div className="p-3 border-b border-[#242424]">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] border border-[#2a2a2a] focus:border-zinc-400 rounded-lg px-3 pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 outline-none transition font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-zinc-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSubItems.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <p className="text-xs text-zinc-500">No items found</p>
            </div>
          ) : (
            filteredSubItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => handleSubItemClick(item)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition group ${
                    isActive
                      ? 'bg-[#222222] text-white font-semibold border-l-2 border-white'
                      : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                      }`}
                    />
                    <span className="truncate text-xs font-medium">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#202020] text-zinc-300 border border-[#2e2e2e]">
                        {item.badge}
                      </span>
                    )}
                    {item.isAction ? (
                      <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">+new</span>
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400" />
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Bottom Footer Details */}
        <div className="h-11 px-4 border-t border-[#242424] bg-[#111111] flex items-center justify-between text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="text-zinc-400">verified</span>
          </div>
          <span className="text-zinc-400 truncate max-w-[100px]">
            {user?.email?.split('@')[0]}
          </span>
        </div>
      </div>
    </aside>
  );
}
