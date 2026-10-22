'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Plus,
  ShieldCheck,
  Building,
  Code,
  Search,
  X,
  Globe,
  Pin,
  PinOff,
} from 'lucide-react';

import { canAccessRoute, hasPermission, ROLE_BADGES, BrandRole } from '@/lib/rbac';

export const NAV_ITEMS = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, badge: null },
  { name: 'My Products', href: '/dashboard/products', icon: Package, badge: 'Live' },
  { name: 'Orders & Sales', href: '/dashboard/orders', icon: ShoppingCart, badge: null },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, badge: null },
  { name: 'Earnings', href: '/dashboard/earnings', icon: Coins, badge: '70%' },
  { name: 'Payouts', href: '/dashboard/payouts', icon: CreditCard, badge: null },
  { name: 'Licensing & DRM', href: '/dashboard/licensing', icon: KeyRound, badge: null },
  { name: 'Developer & API', href: '/dashboard/developers', icon: Code, badge: 'C++' },
  { name: 'Agreements', href: '/dashboard/documents', icon: FileText, badge: null },
  { name: 'Support Tickets', href: '/dashboard/support', icon: LifeBuoy, badge: '2' },
  { name: 'Portal Settings', href: '/dashboard/settings', icon: Settings, badge: null },
];

export function Sidebar() {
  const pathname = usePathname();
  const { brand, user, membership, signOut } = useBrand();

  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentRole = membership?.role as BrandRole | undefined;
  const filteredNavItems = NAV_ITEMS.filter((item) => canAccessRoute(currentRole, item.href));
  const canAddProduct = hasPermission(currentRole, 'canManageProducts');
  const roleBadge = currentRole ? ROLE_BADGES[currentRole] : null;

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

  // Search filter for Tier 2
  const searchedItems = useMemo(() => {
    if (!searchQuery.trim()) return filteredNavItems;
    return filteredNavItems.filter((i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [filteredNavItems, searchQuery]);

  const isPanelVisible = isPinned || isHovered;

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
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/dashboard"
            title="Toy Creator"
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
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.name}
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

                  {/* Tooltip on Hover when panel is closed */}
                  {!isPanelVisible && (
                    <span className="absolute left-12 px-2 py-1 bg-[#181818] text-white text-[11px] font-medium rounded shadow-lg border border-[#2a2a2a] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {item.name}
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

          {/* Pin/Unpin Toggle */}
          <button
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Unpin Panel (Hover to Open)' : 'Pin Panel Open'}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
              isPinned
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
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
            <Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-xs font-semibold text-white truncate">
              {brand?.name || 'Producer Toy'}
            </span>
          </div>
          {canAddProduct && (
            <Link
              href="/dashboard/products/new"
              title="Create Product"
              className="w-6 h-6 rounded bg-[#222222] hover:bg-[#2c2c2c] text-zinc-300 hover:text-white flex items-center justify-center transition border border-white/5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Quick Scope / Role Tag */}
        <div className="px-3 py-2 border-b border-[#202020] bg-[#141414] flex items-center justify-between text-[10px] font-mono">
          <span className="text-zinc-500">scope brand</span>
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
              placeholder="Search modules..."
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

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {searchedItems.length === 0 ? (
            <div className="py-8 px-3 text-center">
              <p className="text-xs text-zinc-500">No modules found</p>
            </div>
          ) : (
            searchedItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
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
                    <span className="truncate text-xs">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#202020] text-zinc-300 border border-[#2e2e2e]">
                        {item.badge}
                      </span>
                    )}
                    <Globe className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Bottom Footer Info */}
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
