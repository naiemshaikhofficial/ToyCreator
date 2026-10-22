'use client';

import React from 'react';
import Image from 'next/image';
import { BrandGate } from '@/components/BrandGate';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandGate>
      <div className="min-h-screen bg-[#121212] text-white flex">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>

          {/* ProducerToy 3D Logo Footer Corner */}
          <footer className="border-t border-[#202020] py-4 px-6 sm:px-8 flex items-center justify-between text-xs text-zinc-500 bg-[#141414]/60">
            <div className="text-[11px] font-mono text-zinc-500">
              © {new Date().getFullYear()} ProducerToy Creator Engine
            </div>
            <a
              href="https://producertoy.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 group opacity-85 hover:opacity-100 transition"
            >
              <div className="relative h-5 w-24">
                <Image
                  src="/Producer Toy Charcoal 3D Logo.webp"
                  alt="ProducerToy"
                  fill
                  className="object-contain object-right"
                />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-400 group-hover:text-white transition">
                PRODUCERTOY
              </span>
            </a>
          </footer>
        </div>
      </div>
    </BrandGate>
  );
}

