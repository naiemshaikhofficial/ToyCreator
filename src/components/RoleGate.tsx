'use client';

import React from 'react';
import Link from 'next/link';
import { useBrand } from '@/context/BrandContext';
import { BrandRole, ROLE_BADGES } from '@/lib/rbac';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { ButtonSpinner } from './ui/ButtonSpinner';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: BrandRole[];
  sectionName?: string;
}

export function RoleGate({
  children,
  allowedRoles,
  sectionName = 'This section',
}: RoleGateProps) {
  const { membership, isLoading } = useBrand();

  if (isLoading) {
    return (
      <div className="min-h-[360px] flex flex-col items-center justify-center space-y-3">
        <ButtonSpinner size={28} variant="light" />
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
          Checking access permissions...
        </p>
      </div>
    );
  }

  const currentRole = membership?.role as BrandRole | undefined;

  // Owners always have full access
  const isAllowed = currentRole === 'owner' || (currentRole && allowedRoles.includes(currentRole));

  if (isAllowed) {
    return <>{children}</>;
  }

  const roleInfo = currentRole ? ROLE_BADGES[currentRole] : null;

  return (
    <div className="w-full max-w-2xl mx-auto my-12 p-8 sm:p-10 rounded-2xl bg-[#161616] border border-[#262626] text-center shadow-2xl space-y-6 animate-in fade-in">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
        <Lock className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[11px] font-semibold text-zinc-300">
          <span>Your Role:</span>
          <span className="text-white font-bold">{roleInfo?.label || 'Team Member'}</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Restricted Access
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
          {sectionName} is only accessible to{' '}
          <strong className="text-white">
            {allowedRoles
              .map((r) => ROLE_BADGES[r]?.label || r)
              .join(', ')}
          </strong>
          . Your role does not have permission to view or manage these files.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Overview</span>
        </Link>
      </div>

      <div className="pt-4 border-t border-[#222222] text-[11px] text-zinc-500">
        Need permission to access this area? Contact your brand owner to adjust your team role.
      </div>
    </div>
  );
}
