'use client';

import React from 'react';
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
} from 'lucide-react';

export const NAV_ITEMS = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Products', href: '/dashboard/products', icon: Package },
  { name: 'Orders & Sales', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Earnings', href: '/dashboard/earnings', icon: Coins },
  { name: 'Payouts', href: '/dashboard/payouts', icon: CreditCard },
  { name: 'Licensing & Delivery', href: '/dashboard/licensing', icon: KeyRound },
  { name: 'Agreements & Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Support', href: '/dashboard/support', icon: LifeBuoy },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { brand, user, membership, signOut } = useBrand();

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-[#141414] border-r border-[#242424] z-30 select-none">
      {/* Brand Header */}
      <div className="h-18 px-5 flex items-center justify-between border-b border-[#242424]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <picture className="flex-shrink-0">
            <source srcSet="/Charcoal Headphone Bear Mascot.webp" type="image/webp" />
            <img
              src="/Charcoal Headphone Bear Mascot.png"
              alt="Toy Creator Emblem"
              className="w-9 h-9 object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform"
            />
          </picture>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white uppercase">
                Toy Creator
              </span>
            </div>
            <span className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">
              by ProducerToy
            </span>
          </div>
        </Link>
      </div>

      {/* Active Brand Card Badge */}
      <div className="px-4 py-3.5 border-b border-[#202020] bg-[#161616]/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Building className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {brand?.name || 'Producer Toy'}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>Verified Brand</span>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/products/new"
            title="Create New Product"
            className="w-6 h-6 rounded-md bg-[#262626] hover:bg-indigo-600 hover:text-white text-zinc-300 flex items-center justify-center transition-colors border border-white/5"
          >
            <Plus className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-[#222222] text-white font-semibold border border-white/10 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1a1a]'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'
                }`}
              />
              <span className="flex-1">{item.name}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile & Actions */}
      <div className="p-3 border-t border-[#242424] space-y-2 bg-[#121212]">
        <Link
          href="https://producertoy.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
            Marketplace Store
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">producertoy.com</span>
        </Link>

        <div className="flex items-center justify-between pt-2 border-t border-[#202020] px-1">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 min-w-0 group"
          >
            <div className="w-7 h-7 rounded-full bg-[#2a2a2a] border border-white/10 flex items-center justify-center text-xs font-bold text-white uppercase flex-shrink-0">
              {brand?.name ? brand.name[0] : user?.email ? user.email[0] : 'C'}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-medium text-white truncate group-hover:text-indigo-400 transition-colors">
                {user?.email?.split('@')[0] || 'Creator'}
              </p>
              <p className="text-[10px] text-zinc-400 truncate capitalize">
                {membership?.role || 'Brand Owner'}
              </p>
            </div>
          </Link>

          <button
            onClick={() => signOut()}
            title="Sign Out"
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
