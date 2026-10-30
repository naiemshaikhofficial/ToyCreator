import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BrandProvider } from "@/context/BrandContext";
import { CreatorPortalJsonLd } from "@/components/JsonLd";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
    : "https://creators.producertoy.com";

export const viewport: Viewport = {
  themeColor: "#121212",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  applicationName: "Toy Creator",
  title: {
    default: "Toy Creator | Sell VST Plugins, Sample Packs & Audio Tools",
    template: "%s | Toy Creator",
  },
  description:
    "The creator economy platform for audio developers, VST architects, sound designers, and sample pack publishers. Sell software, manage licenses, track analytics, and get paid with 0% hidden friction.",
  keywords: [
    "Toy Creator",
    "ProducerToy Creators",
    "sell VST plugins",
    "audio software marketplace",
    "sell sample packs",
    "VST developer portal",
    "Gumroad for audio",
    "Gumroad for VST plugins",
    "audio plugin distribution",
    "VST license key generator",
    "sample pack publisher",
    "synth presets marketplace",
    "audio developer monetization",
    "music creator platform",
    "Producer Toy brand portal",
  ],
  authors: [{ name: "Producer Toy", url: "https://producertoy.com" }],
  creator: "Producer Toy",
  publisher: "Producer Toy",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Toy Creator",
    title: "Toy Creator | Sell VST Plugins, Sample Packs & Audio Tools",
    description:
      "The dedicated developer portal for music plugin creators, sound libraries, and presets. Sell digital audio software worldwide with machine licensing and automated payouts.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Toy Creator — Audio Developer & Publisher Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@producertoy",
    creator: "@producertoy",
    title: "Toy Creator — Sell VST Plugins, Sample Packs & Audio Tools",
    description:
      "The dedicated developer portal for music plugin creators, sound libraries, and presets. Machine-locked licensing, real-time analytics, and automated payouts.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Audio Software & Creator Economy",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <CreatorPortalJsonLd />
      </head>
      <body className="bg-[#121212] text-white antialiased">
        <BrandProvider>
          {children}
        </BrandProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
