"use client"

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type SVGProps,
} from "react"
import { AnimatePresence, motion } from "motion/react"

export interface BrandLogo {
  id: string | number
  name: string
  logoUrl?: string
  img?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

// Real brand logos from Supabase `brands` table
export const REAL_SUPABASE_BRANDS: BrandLogo[] = [
  {
    id: 1,
    name: "Native Instruments",
    logoUrl: "https://banners.pluginboutique.com/dlnxddgufwflvgyey74gy89zkxmj",
  },
  {
    id: 2,
    name: "Output",
    logoUrl: "https://banners.pluginboutique.com/7kai7opoehzjfrau2jmbbz2x9rpg",
  },
  {
    id: 3,
    name: "ValhallaDSP",
    logoUrl: "https://imagizer.imageshack.com/img922/5715/NmPmxD.png",
  },
  {
    id: 4,
    name: "Slate Digital",
    logoUrl: "https://banners.pluginboutique.com/c2cz3nzpj1gg67fqbvnv6tpkacn5",
  },
  {
    id: 5,
    name: "Cableguys",
    logoUrl: "https://banners.pluginboutique.com/6mebhwg5rrp4az1a7h5r01wea7wm",
  },
  {
    id: 6,
    name: "Arturia",
    logoUrl: "https://banners.pluginboutique.com/us5sx40oadzbyjmush3zfkkwdcqx",
  },
  {
    id: 7,
    name: "Baby Audio",
    logoUrl: "https://banners.pluginboutique.com/xz1gi5q9c2nqg6c8vmv7xsnts18b",
  },
  {
    id: 8,
    name: "Celemony",
    logoUrl: "https://banners.pluginboutique.com/nduf5wsacfpumuo9se4o7g2p69pd",
  },
  {
    id: 9,
    name: "Heavyocity",
    logoUrl: "https://banners.pluginboutique.com/nbob7cq3vc9s7myqdvmbp1jptmge",
  },
  {
    id: 10,
    name: "IK Multimedia",
    logoUrl: "https://banners.pluginboutique.com/wajxu6wxwikn48kxarh6p1knnnjc",
  },
  {
    id: 11,
    name: "Image Line",
    logoUrl: "https://imagizer.imageshack.com/img924/9134/4FZbIT.jpg",
  },
  {
    id: 12,
    name: "Brainworx",
    logoUrl: "https://banners.pluginboutique.com/3jc22dbhmo673mb87l2swlebc5jj",
  },
  {
    id: 13,
    name: "Cherry Audio",
    logoUrl: "https://banners.pluginboutique.com/pda9906c7cterlpl5f83qi0vvsnm",
  },
  {
    id: 14,
    name: "Black Salt Audio",
    logoUrl: "https://banners.pluginboutique.com/fhsfljcl13pckz6vo4zhicec2h8t",
  },
  {
    id: 15,
    name: "Reveal Sound",
    logoUrl: "https://banners.pluginboutique.com/lxbhq484351mu9ysv4xgfac0lmbg",
  },
  {
    id: 16,
    name: "Rob Papen",
    logoUrl: "https://banners.pluginboutique.com/ngmqjk5dprhui2esgix7rsqkwmdt",
  },
  {
    id: 17,
    name: "Cinesamples",
    logoUrl: "https://banners.pluginboutique.com/wcj4xfkiytdh2ygh5ea7eqi8jpbu",
  },
  {
    id: 18,
    name: "Producer Toy",
    logoUrl: "https://imagizer.imageshack.com/img922/171/nu2UgR.png",
  },
  {
    id: 19,
    name: "Samples Wala",
    logoUrl: "https://imagizer.imageshack.com/img923/1404/IgcF2q.png",
  },
]

// Utility function to randomly shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Utility function to distribute logos across multiple columns
const distributeLogos = (allLogos: BrandLogo[], columnCount: number): BrandLogo[][] => {
  const shuffled = shuffleArray(allLogos)
  const columns: BrandLogo[][] = Array.from({ length: columnCount }, () => [])

  shuffled.forEach((logo, index) => {
    columns[index % columnCount].push(logo)
  })

  const maxLength = Math.max(...columns.map((col) => col.length))
  columns.forEach((col) => {
    while (col.length < maxLength) {
      col.push(shuffled[Math.floor(Math.random() * shuffled.length)])
    }
  })

  return columns
}

interface LogoColumnProps {
  logos: BrandLogo[]
  index: number
  currentTime: number
}

// LogoColumn component: Displays a single column of animated brand logos
const LogoColumn: React.FC<LogoColumnProps> = React.memo(
  ({ logos, index, currentTime }) => {
    const cycleInterval = 2500
    const columnDelay = index * 300
    const adjustedTime =
      (currentTime + columnDelay) % (cycleInterval * logos.length)
    const currentIndex = Math.floor(adjustedTime / cycleInterval)
    const currentBrand = logos[currentIndex]
    const [imgFailed, setImgFailed] = useState(false)

    useEffect(() => {
      setImgFailed(false)
    }, [currentBrand?.id])

    return (
      <motion.div
        className="relative h-18 w-32 sm:h-22 sm:w-40 md:h-26 md:w-48 overflow-hidden rounded-2xl bg-[#141414] border border-[#242424] p-3 flex items-center justify-center shadow-lg hover:border-zinc-500/40 transition-colors group"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: index * 0.1,
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentBrand.id}-${currentIndex}`}
            className="absolute inset-0 flex flex-col items-center justify-center p-3"
            initial={{ y: "15%", opacity: 0, filter: "blur(6px)" }}
            animate={{
              y: "0%",
              opacity: 1,
              filter: "blur(0px)",
              transition: {
                type: "spring",
                stiffness: 320,
                damping: 24,
                mass: 1,
                bounce: 0.2,
                duration: 0.5,
              },
            }}
            exit={{
              y: "-15%",
              opacity: 0,
              filter: "blur(4px)",
              transition: {
                type: "tween",
                ease: "easeIn",
                duration: 0.25,
              },
            }}
          >
            {currentBrand.logoUrl && !imgFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentBrand.logoUrl}
                alt={currentBrand.name}
                onError={() => setImgFailed(true)}
                draggable={false}
                className="h-8 max-h-[65%] w-auto max-w-[85%] object-contain filter grayscale contrast-125 brightness-125 transition-all group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-105"
              />
            ) : currentBrand.img ? (
              <currentBrand.img className="h-7 w-auto max-w-[80%] max-h-[60%] object-contain text-white transition-transform group-hover:scale-105" />
            ) : (
              <span className="text-sm font-bold text-white tracking-wider">
                {currentBrand.name}
              </span>
            )}
            <span className="text-[10px] font-mono text-zinc-400 mt-1 uppercase tracking-wider font-semibold truncate max-w-[90%]">
              {currentBrand.name}
            </span>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    )
  }
)

LogoColumn.displayName = "LogoColumn"

export interface LogoCarouselProps {
  columnCount?: number
  customLogos?: BrandLogo[]
}

export function LogoCarousel({ columnCount = 3, customLogos }: LogoCarouselProps) {
  const [logoSets, setLogoSets] = useState<BrandLogo[][]>([])
  const [currentTime, setCurrentTime] = useState(0)

  const allLogos: BrandLogo[] = useMemo(
    () => (customLogos && customLogos.length > 0 ? customLogos : REAL_SUPABASE_BRANDS),
    [customLogos]
  )

  useEffect(() => {
    const distributedLogos = distributeLogos(allLogos, columnCount)
    setLogoSets(distributedLogos)
  }, [allLogos, columnCount])

  const updateTime = useCallback(() => {
    setCurrentTime((prevTime) => prevTime + 100)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(updateTime, 100)
    return () => clearInterval(intervalId)
  }, [updateTime])

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5">
      {logoSets.map((logos, index) => (
        <LogoColumn
          key={index}
          logos={logos}
          index={index}
          currentTime={currentTime}
        />
      ))}
    </div>
  )
}

export default LogoCarousel
