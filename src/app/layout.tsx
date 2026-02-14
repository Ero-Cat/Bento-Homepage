import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import { siteConfig } from "@/config/site";
import { BackgroundLayer } from "@/components/background-layer";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: siteConfig.seo.title,
  description: siteConfig.seo.description,
  keywords: siteConfig.seo.keywords,
  openGraph: {
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    url: siteConfig.seo.siteUrl,
    siteName: siteConfig.profile.name,
    images: siteConfig.seo.ogImage
      ? [{ url: siteConfig.seo.ogImage, width: 1200, height: 630 }]
      : [],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    images: siteConfig.seo.ogImage ? [siteConfig.seo.ogImage] : [],
  },
};

/**
 * Inject siteConfig.theme values as CSS custom properties on <html>,
 * so the design tokens in globals.css can be overridden from config.
 */
const themeVars: React.CSSProperties = {
  "--tint-color": siteConfig.theme.tintColor,
  "--tint-rgb": siteConfig.theme.tintColorRGB,
  "--bg-gradient-from": siteConfig.theme.gradientFrom,
  "--bg-gradient-via": siteConfig.theme.gradientVia,
  "--bg-gradient-to": siteConfig.theme.gradientTo,
} as React.CSSProperties;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={themeVars}>
      <body className={`${quicksand.variable} antialiased`}>
        <BackgroundLayer />
        {children}
      </body>
    </html>
  );
}
