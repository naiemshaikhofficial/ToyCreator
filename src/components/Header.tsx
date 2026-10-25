'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';
import {
  Menu,
  X,
  Bell,
  Plus,
  ExternalLink,
  ChevronDown,
  Building,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { NAV_ITEMS } from './Sidebar';
import { canAccessRoute, hasPermission, ROLE_BADGES, BrandRole } from '@/lib/rbac';

const PAGE_CONFIG: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Overview',
    subtitle: 'Real-time sales velocity, verified revenue, and catalog telemetry',
  },
  '/dashboard/products': {
    title: 'My Audio Products',
    subtitle: 'Manage audio plugins, sample libraries, and presets published under your brand',
  },
  '/dashboard/products/new': {
    title: 'New Product',
    subtitle: 'Publish a new audio plugin, preset pack, or sound library',
  },
  '/dashboard/coupons': {
    title: 'Offers & Deals',
    subtitle: 'Create promotional discounts, coupons, and seasonal sales',
  },
  '/dashboard/orders': {
    title: 'Orders & Sales',
    subtitle: 'Verified customer orders, revenue receipts, and purchase history',
  },
  '/dashboard/analytics': {
    title: 'Analytics & Conversions',
    subtitle: 'Deep-dive gross merchandise volume, OS metrics, and DAW telemetry',
  },
  '/dashboard/earnings': {
    title: 'Earnings & Royalties',
    subtitle: '70% creator payout breakdown and monthly statements',
  },
  '/dashboard/payouts': {
    title: 'Payouts & Banking',
    subtitle: 'Weekly bank transfers, UPI credits, and payout history',
  },
  '/dashboard/licensing': {
    title: 'Licensing & DRM',
    subtitle: 'Machine activations, hardware seats, and serial key inventory',
  },
  '/dashboard/developers': {
    title: 'Developer Guide & API',
    subtitle: 'C++ JUCE SDK integration, REST endpoints, and webhook delivery',
  },
  '/dashboard/documents': {
    title: 'Agreements & Legal',
    subtitle: 'Distribution terms, intellectual property, and signed contracts',
  },
  '/dashboard/support': {
    title: 'Customer Support',
    subtitle: 'Buyer inquiries, ticket resolutions, and license assistance',
  },
  '/dashboard/settings': {
    title: 'Brand Settings',
    subtitle: 'Manufacturer profile, team members, and security preferences',
  },
};

export function Header() {
  const pathname = usePathname();
  const { brand, user, membership, signOut } = useBrand();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const currentRole = membership?.role as BrandRole | undefined;
  const filteredNavItems = NAV_ITEMS.filter((item) => canAccessRoute(currentRole, item.href));
  const canAddProduct = hasPermission(currentRole, 'canManageProducts');
  const canAccessSettings = hasPermission(currentRole, 'canAccessSettings');
  const roleBadge = currentRole ? ROLE_BADGES[currentRole] : null;

  const pageConfig = React.useMemo(() => {
    if (PAGE_CONFIG[pathname]) return PAGE_CONFIG[pathname];
    for (const [route, cfg] of Object.entries(PAGE_CONFIG)) {
      if (route !== '/dashboard' && pathname.startsWith(route)) {
        return cfg;
      }
    }
    return {
      title: 'Creator Portal',
      subtitle: 'Manage your creator storefront and digital audio catalog',
    };
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-20 h-20 bg-[#121212]/95 backdrop-blur-sm border-b border-[#242424] px-4 sm:px-6 lg:px-8 flex items-center justify-between select-none">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-[#202020] transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
              {pageConfig.title}
            </h1>
            <p className="text-xs text-zinc-400 font-medium hidden sm:block mt-1">
              {brand?.name ? `${brand.name} • ${pageConfig.subtitle}` : pageConfig.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Marketplace Store Link */}
          <a
            href="https://producertoy.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-[#1a1a1a] hover:bg-[#242424] border border-[#2a2a2a] transition-colors"
          >
            <span>Live Store</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>

          {/* New Product CTA (Only for Roles with Product Management Access) */}
          {canAddProduct && (
            <Link
              href="/dashboard/products/new"
              className="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm whitespace-nowrap ml-0.5 sm:ml-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">New</span>
            </Link>
          )}

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#1f1f1f] border border-transparent hover:border-[#2a2a2a] transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-[#34363d] border border-zinc-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                {brand?.name ? brand.name[0] : 'C'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-[#181818] border border-[#2a2a2a] rounded-xl shadow-2xl p-2 z-50 text-xs text-zinc-300">
                  <div className="px-3 py-2 border-b border-[#262626] mb-1">
                    <p className="font-semibold text-white truncate">{brand?.name || 'Producer Toy'}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
                    {roleBadge && (
                      <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${roleBadge.badgeClass}`}>
                        {roleBadge.label}
                      </span>
                    )}
                  </div>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#242424] text-zinc-200 hover:text-white transition-colors"
                  >
                    Brand Profile
                  </Link>
                  {canAccessSettings && (
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#242424] text-zinc-200 hover:text-white transition-colors"
                    >
                      Portal Settings
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#242424] text-zinc-300 hover:text-white transition-colors mt-1 border-t border-[#262626]"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-[#141414] border-r border-[#242424] flex flex-col z-50 shadow-2xl">
            {/* Header */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-[#242424]">
              <div className="flex items-center gap-2.5">
                <picture>
                  <source srcSet="/logo.webp" type="image/webp" />
                  <img
                    src="/logo.png"
                    alt="Toy Creator Emblem"
                    className="w-8 h-8 object-contain"
                  />
                </picture>
                <div>
                  <p className="font-bold text-xs uppercase tracking-tight text-white leading-tight">Toy Creator</p>
                  <p className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">by ProducerToy</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#202020]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav list */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#222222] text-white font-semibold border border-white/10'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-[#242424] space-y-2 bg-[#121212]">
              <div className="flex items-center gap-2 px-1 py-1">
                <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                  {brand?.name ? brand.name[0] : 'C'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-white truncate">{brand?.name || 'Producer Toy'}</p>
                    {roleBadge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium border shrink-0 ${roleBadge.badgeClass}`}>
                        {roleBadge.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full btn-secondary py-2 text-xs text-zinc-300 hover:text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
