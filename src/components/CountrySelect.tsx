'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { COUNTRIES, CountryItem } from '@/lib/countries';

export function CountryFlag({
  code,
  name,
  className = 'w-5 h-3.5',
}: {
  code: string;
  name?: string;
  className?: string;
}) {
  const [src, setSrc] = useState(
    `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code.toUpperCase()}.svg`
  );

  useEffect(() => {
    setSrc(`https://purecatamphetamine.github.io/country-flag-icons/3x2/${code.toUpperCase()}.svg`);
  }, [code]);

  return (
    <img
      src={src}
      alt={name || code}
      loading="lazy"
      className={`${className} object-cover rounded-[2px] shadow-sm shrink-0 bg-zinc-800 border border-white/10`}
      onError={() => {
        setSrc(`https://flagcdn.com/w40/${code.toLowerCase()}.png`);
      }}
    />
  );
}

interface CountrySelectProps {
  value: string;
  onChange: (countryName: string, isoCode?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = 'Select Country / Jurisdiction',
  disabled = false,
  className = '',
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Match current selected country either by name or isoCode
  const selectedCountry = useMemo(() => {
    if (!value || !value.trim()) return null;
    const clean = value.trim().toLowerCase();
    return (
      COUNTRIES.find(
        (c) => c.name.toLowerCase() === clean || c.isoCode.toLowerCase() === clean
      ) || null
    );
  }, [value]);

  // Filter countries by query (matches country name, ISO initial, or prefix)
  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;

    return COUNTRIES.filter((c) => {
      const name = c.name.toLowerCase();
      const code = c.isoCode.toLowerCase();
      // Match startsWith for initials/code first, or contains in name
      return code.startsWith(q) || code === q || name.includes(q);
    });
  }, [query]);

  // Focus search box when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keydown for escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (c: CountryItem) => {
    onChange(c.name, c.isoCode);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${isOpen ? 'z-30' : 'z-auto'} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-[#121212] border text-left rounded-xl px-3.5 py-2.5 text-xs text-white flex items-center justify-between transition-colors shadow-sm select-none ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-[#222]'
            : isOpen
            ? 'border-zinc-400 ring-1 ring-zinc-500/20'
            : 'border-[#2a2a2a] hover:border-[#3a3a3a] cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedCountry ? (
            <>
              <CountryFlag code={selectedCountry.isoCode} name={selectedCountry.name} />
              <span className="truncate font-medium text-white">{selectedCountry.name}</span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider shrink-0">
                ({selectedCountry.isoCode})
              </span>
            </>
          ) : (
            <span className="text-zinc-500 font-normal truncate">{value || placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-[#121212] border border-[#262626] rounded-xl shadow-[0_16px_36px_rgba(0,0,0,0.85)] z-50 overflow-hidden">
          {/* Minimalist Search Box */}
          <div className="p-2 border-b border-[#202020] bg-[#161616]">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country or initial (e.g. IN, US, Germany)..."
                className="w-full h-8 bg-[#1e1e1e] border border-[#2c2c2c] focus:border-zinc-400 rounded-lg pl-8 pr-7 text-xs text-white placeholder:text-zinc-500 outline-none transition-colors font-sans"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 text-zinc-500 hover:text-white p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Country Items List */}
          <div
            ref={listRef}
            className="max-h-56 overflow-y-auto divide-y divide-[#1a1a1a] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
          >
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                No countries match &ldquo;{query}&rdquo;
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = selectedCountry?.isoCode === c.isoCode;
                return (
                  <button
                    key={c.isoCode}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1e1e1e] text-white font-medium'
                        : 'hover:bg-[#181818] text-zinc-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CountryFlag code={c.isoCode} name={c.name} />
                      <span className="text-xs truncate">{c.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        {c.isoCode}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CountrySelect;
