import type { Metadata } from "next";
import "./globals.css";
import { BrandProvider } from "@/context/BrandContext";

export const metadata: Metadata = {
  title: "Toy Creator — Audio Developer & Publisher Portal",
  description: "Dedicated creator portal for music plugin developers, VST creators, sample pack producers, and audio publishers. Create. Publish. Earn.",
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
      <body className="bg-[#121212] text-white antialiased">
        <BrandProvider>
          {children}
        </BrandProvider>
      </body>
    </html>
  );
}
