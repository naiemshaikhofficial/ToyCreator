'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { GradientHeading } from '@/components/ui/gradient-heading'
import LogoCarousel, { BrandLogo, REAL_SUPABASE_BRANDS } from '@/components/ui/logo-carousel'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function CreatorBrandsSection() {
  const [brands, setBrands] = useState<BrandLogo[]>(REAL_SUPABASE_BRANDS)

  useEffect(() => {
    async function fetchLiveBrands() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from('brands')
          .select('id, name, logo_url')
          .not('logo_url', 'is', null)
          .neq('logo_url', '')
          .limit(40)

        if (!error && data && data.length > 0) {
          const liveList: BrandLogo[] = data.map((b) => ({
            id: b.id,
            name: b.name,
            logoUrl: b.logo_url,
          }))
          setBrands(liveList)
        }
      } catch (err) {
        // Fallback gracefully to REAL_SUPABASE_BRANDS
      }
    }

    fetchLiveBrands()
  }, [])

  return (
    <section className="w-full py-16 sm:py-20 space-y-8 flex flex-col items-center">
      <div className="mx-auto flex w-full max-w-screen-lg flex-col items-center space-y-8">
        <div className="text-center space-y-2">
          <GradientHeading variant="secondary" size="md">
            The best are already here
          </GradientHeading>
          <div>
            <GradientHeading size="xxl">
              Brands on ProducerToy
            </GradientHeading>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mt-2 leading-relaxed font-normal">
            Leading plugin manufacturers, DSP engineers, and sound designers distribute their software and sample libraries through the ProducerToy ecosystem.
          </p>
        </div>

        {/* Animated Brand Logo Carousel with Real Supabase Logos */}
        <div className="w-full flex justify-center py-2">
          <LogoCarousel columnCount={3} customLogos={brands} />
        </div>

        {/* Apply as a Creator Button (Only this button as requested) */}
        <div className="flex items-center justify-center pt-2">
          <Link
            href="/signup"
            className="btn-primary px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <span>Apply as a Creator</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CreatorBrandsSection
