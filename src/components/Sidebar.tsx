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
  Table2,
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
  | 'earnings'
  | 'licensing'
  | 'developers'
  | 'documents'
  | 'support'
  | 'settings'
  | 'tables';

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

// Raw table entities for creator catalog
const CREATOR_TABLES = [
  { name: 'my_products', href: '/dashboard/products', badge: 'Catalog' },
  { name: 'product_assets_stems', href: '/dashboard/products', badge: 'Audio' },
  { name: 'sales_orders', href: '/dashboard/orders', badge: 'Live' },
  { name: 'device_activations', href: '/dashboard/licensing', badge: 'DRM' },
  { name: 'support_tickets', href: '/dashboard/support', badge: 'Help' },
  { name: 'ticket_messages', href: '/dashboard/support' },
  { name: 'payout_distributions', href: '/dashboard/payouts', badge: '70%' },
  { name: 'brand_members', href: '/dashboard/settings?tab=team', badge: 'RBAC' },
  { name: 'api_webhooks', href: '/dashboard/settings?tab=developer', badge: 'Key' },
  { name: 'creator_agreements', href: '/dashboard/documents', badge: 'PDF' },
  { name: 'audit_security_logs', href: '/dashboard/settings?tab=audit' },
];

const SECTIONS: SectionConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    defaultHref: '/dashboard',
    headerTitle: 'Creator Overview',
    subItems: [
      { label: 'Executive Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Live Sales Overview', href: '/dashboard/orders', icon: ShoppingCart },
      { label: 'Revenue & Royalties', href: '/dashboard/earnings', icon: Coins, badge: '70%' },
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
      { label: 'All My Products', href: '/dashboard/products', icon: Package, badge: 'Live' },
      { label: 'Add New Product', href: '/dashboard/products/new', icon: PlusCircle, isAction: true },
      { label: 'Asset Stems & Audio', href: '/dashboard/products', icon: DownloadCloud },
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
      { label: 'Customer Transactions', href: '/dashboard/orders', icon: ShoppingCart },
      { label: 'Net Revenue Splits', href: '/dashboard/earnings', icon: Coins, badge: '70/30' },
      { label: 'Order Receipts & Tax', href: '/dashboard/orders', icon: FileText },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    defaultHref: '/dashboard/analytics',
    headerTitle: 'Performance Analytics',
    subItems: [
      { label: 'Revenue Trends', href: '/dashboard/analytics', icon: BarChart3 },
      { label: 'Product Conversions', href: '/dashboard/analytics', icon: Activity },
      { label: 'Customer Geography', href: '/dashboard/analytics', icon: Globe },
    ],
  },
  {
    id: 'earnings',
    label: 'Earnings',
    icon: Coins,
    defaultHref: '/dashboard/earnings',
    headerTitle: 'Earnings & Payouts',
    subItems: [
      { label: 'Creator Royalty Balance', href: '/dashboard/earnings', icon: Coins, badge: 'Active' },
      { label: 'Payout Disbursements', href: '/dashboard/payouts', icon: CreditCard },
      { label: 'Bank & Stripe Setup', href: '/dashboard/settings?tab=payouts', icon: Building },
    ],
  },
  {
    id: 'licensing',
    label: 'Licensing',
    icon: KeyRound,
    defaultHref: '/dashboard/licensing',
    headerTitle: 'Licensing & DRM',
    subItems: [
      { label: 'Hardware Machine Seats', href: '/dashboard/licensing', icon: KeyRound },
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
      { label: 'C++ Audio Plugin SDK', href: '/dashboard/developers', icon: Code, badge: 'JUCE' },
      { label: 'Live Brand API Key', href: '/dashboard/settings?tab=developer', icon: KeyRound },
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
    headerTitle: 'Portal Settings',
    subItems: [
      { label: 'General Brand Profile', href: '/dashboard/settings?tab=general', icon: Building },
      { label: 'Brand Team & Roles', href: '/dashboard/settings?tab=team', icon: Users, badge: 'RBAC' },
      { label: 'Payouts & Banking', href: '/dashboard/settings?tab=payouts', icon: CreditCard },
      { label: 'Developer API Keys', href: '/dashboard/settings?tab=developer', icon: Code },
      { label: 'Security & Access', href: '/dashboard/settings?tab=security', icon: Shield },
      { label: 'Agreements & Legal', href: '/dashboard/settings?tab=agreements', icon: FileText },
      { label: 'Activity & Audit', href: '/dashboard/settings?tab=audit', icon: Activity },
    ],
  },
  {
    id: 'tables',
    label: 'Tables',
    icon: Table2,
    defaultHref: '/dashboard/products',
    headerTitle: 'Catalog Explorer',
    subItems: [],
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
    if (path.startsWith('/dashboard/earnings') || path.startsWith('/dashboard/payouts')) return 'earnings';
    if (path.startsWith('/dashboard/licensing')) return 'licensing';
    if (path.startsWith('/dashboard/developers')) return 'developers';
    if (path.startsWith('/dashboard/documents')) return 'documents';
    if (path.startsWith('/dashboard/support')) return 'support';
    if (path.startsWith('/dashboard/settings') || path.startsWith('/dashboard/profile')) return 'settings';
    return 'overview';
  };

  const [activeSection, setActiveSection] = useState<CreatorSectionId>(() => detectSection(pathname));
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(true); // Open by default like Supabase
  const [searchQuery, setSearchQuery] = useState('');

  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentRole = membership?.role as BrandRole | undefined;
  const roleBadge = currentRole ? ROLE_BADGES[currentRole] : null;

  // Sync active section when path changes
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

  const isTableEditor = activeSection === 'tables';

  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return CREATOR_TABLES;
    return CREATOR_TABLES.filter((t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [searchQuery]);

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
        isPinned ? 'w-[282px]' : 'w-[52px]'
      }`}
    >
      {/* =========================================================================
          TIER 1: Thin Icon Rail (~52px)
         ========================================================================= */}
      <div className="w-[52px] bg-[#101010] border-r border-[#202020] flex flex-col items-center justify-between py-3 shrink-0 h-full z-20">
        {/* Top: Brand Emblem */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/dashboard"
            title="Toy Creator"
            onClick={() => {
              setActiveSection('overview');
              setIsPinned(true);
            }}
            className="w-8 h-8 flex items-center justify-center hover:opacity-80 transition"
          >
            <picture>
              <source srcSet="/logo.webp" type="image/webp" />
              <img
                src="/logo.png"
                alt="Toy Creator Emblem"
                className="w-7 h-7 object-contain"
              />
            </picture>
          </Link>

          {/* Thin separator */}
          <div className="w-5 h-px bg-[#242424]" />

          {/* Rail Navigation Icons */}
          <div className="flex flex-col items-center gap-1">
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
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative group ${
                    isActive
                      ? 'bg-[#222222] text-white shadow-inner'
                      : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {isActive && (
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-r-full" />
                  )}

                  {/* Tooltip on Hover when sub-panel is closed */}
                  {!isPanelVisible && (
                    <span className="absolute left-12 px-2 py-1 bg-[#181818] text-white text-[11px] font-medium rounded shadow-lg border border-[#2a2a2a] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {sec.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Rail Actions */}
        <div className="flex flex-col items-center gap-1.5">
          {/* External Store Link */}
          <a
            href="https://producertoy.com"
            target="_blank"
            rel="noreferrer"
            title="Open ProducerToy Store"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1a1a1a] transition relative group"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {!isPanelVisible && (
              <span className="absolute left-12 px-2 py-1 bg-[#181818] text-white text-[11px] rounded shadow-lg border border-[#2a2a2a] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                producertoy.com
              </span>
            )}
          </a>

          {/* Collapse/Expand Toggle Button */}
          <button
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Collapse Panel' : 'Expand Panel'}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1a1a1a] transition"
          >
            {isPinned ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>

          {/* Sign Out */}
          <button
            onClick={() => signOut()}
            title="Sign Out"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#1a1a1a] transition"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          TIER 2: Sub-Panel (~230px) - Opens on Hover, Closes on Leave (or Pinned)
         ========================================================================= */}
      <div
        className={`w-56 bg-[#141414] border-r border-[#222222] flex flex-col shrink-0 h-screen overflow-hidden transition-all duration-200 ease-out ${
          isPinned
            ? 'relative opacity-100 translate-x-0'
            : isHovered
            ? 'absolute left-[52px] top-0 bottom-0 z-30 shadow-[10px_0_30px_rgba(0,0,0,0.7)] opacity-100 translate-x-0'
            : 'absolute left-[52px] top-0 bottom-0 z-30 opacity-0 -translate-x-3 pointer-events-none'
        }`}
      >
        {/* Header Title & Active Brand */}
        <div className="h-12 px-3 flex items-center justify-between border-b border-[#202020] bg-[#121212]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-white tracking-tight truncate">
              {currentConfig.headerTitle}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#202020] text-zinc-400 border border-[#2a2a2a] rounded">
              {isTableEditor ? filteredTables.length : currentConfig.subItems.length}
            </span>
          </div>

          <button
            onClick={() => setIsPinned(false)}
            title="Collapse Sidebar"
            className="p-1 rounded text-zinc-500 hover:text-white hover:bg-[#1f1f1f] transition"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Scope / Role Tag */}
        <div className="px-3 py-2 border-b border-[#202020] bg-[#141414] flex items-center justify-between text-[10px] font-mono">
          <span className="text-zinc-500 truncate max-w-[110px]">{brand?.name || 'Producer Toy'}</span>
          {roleBadge && (
            <span className={`px-1.5 py-0.2 rounded border uppercase font-medium ${roleBadge.badgeClass}`}>
              {roleBadge.label}
            </span>
          )}
        </div>

        {/* Search Box */}
        <div className="p-2.5 border-b border-[#202020]">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder={isTableEditor ? 'Search tables...' : 'Search items...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] border border-[#282828] focus:border-zinc-500 rounded px-2.5 pl-8 pr-7 py-1 text-xs text-white placeholder-zinc-500 outline-none transition font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-zinc-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {isTableEditor ? (
            filteredTables.length === 0 ? (
              <div className="py-8 px-3 text-center">
                <p className="text-xs text-zinc-500">No tables found</p>
              </div>
            ) : (
              filteredTables.map((tbl) => {
                const isActive = pathname === tbl.href;
                return (
                  <Link
                    key={tbl.name}
                    href={tbl.href}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition group ${
                      isActive
                        ? 'bg-[#222222] text-white font-medium border-l-2 border-white'
                        : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Table2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                        }`}
                      />
                      <span className="truncate font-mono text-[11px]">{tbl.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {tbl.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#202020] text-zinc-300 border border-[#2e2e2e]">
                          {tbl.badge}
                        </span>
                      )}
                      <Globe className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
                    </div>
                  </Link>
                );
              })
            )
          ) : filteredSubItems.length === 0 ? (
            <div className="py-8 px-3 text-center">
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
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition group ${
                    isActive
                      ? 'bg-[#222222] text-white font-medium border-l-2 border-white'
                      : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                      }`}
                    />
                    <span className="truncate text-xs">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#202020] text-zinc-300 border border-[#2e2e2e]">
                        {item.badge}
                      </span>
                    )}
                    {item.isAction ? (
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">+new</span>
                    ) : (
                      <Globe className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Bottom Footer Details */}
        <div className="h-10 px-3 border-t border-[#202020] bg-[#111111] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>verified</span>
          </div>
          <span className="text-zinc-500 truncate max-w-[90px]">
            {user?.email?.split('@')[0]}
          </span>
        </div>
      </div>
    </aside>
  );
}
