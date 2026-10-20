'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { BrandMembership, getCurrentUserBrand } from '@/lib/supabase/actions';
import { User } from '@supabase/supabase-js';

interface BrandContextType {
  user: User | null;
  membership: BrandMembership | null;
  brand: BrandMembership['brands'] | null;
  isRegisteredBrand: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshBrand: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType>({
  user: null,
  membership: null,
  brand: null,
  isRegisteredBrand: false,
  isLoading: true,
  signOut: async () => {},
  refreshBrand: async () => {},
});

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] = useState<BrandMembership | null>(null);
  const [isRegisteredBrand, setIsRegisteredBrand] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBrandState = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCurrentUserBrand();
      setUser(res.user);
      setMembership(res.membership);
      setIsRegisteredBrand(res.isRegisteredBrand);
    } catch (err) {
      console.error('Error fetching brand context:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrandState();

    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        fetchBrandState();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchBrandState]);

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    setMembership(null);
    setIsRegisteredBrand(false);
    window.location.href = '/login';
  };

  return (
    <BrandContext.Provider
      value={{
        user,
        membership,
        brand: membership?.brands || null,
        isRegisteredBrand,
        isLoading,
        signOut,
        refreshBrand: fetchBrandState,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
