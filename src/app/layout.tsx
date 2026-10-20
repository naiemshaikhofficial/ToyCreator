import type { Metadata } from "next";
import "./globals.css";
import { BrandProvider } from "@/context/BrandContext";

export const metadata: Metadata = {
  title: "Toy Creator — Audio Developer & Publisher Portal",
  description: "Dedicated creator portal for music plugin developers, VST creators, sample pack producers, and audio publishers. Create. Publish. Earn.",
  icons: {
    icon: "/favicon.ico",
    apple: "/Icon.png",
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
