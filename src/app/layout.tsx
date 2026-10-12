import type { Metadata, Viewport } from "next";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { SITE, getSiteUrl } from "@/lib/site";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { listCategories } from "@/lib/catalog";

const sourceSans = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f7fb",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE.brand} | Premium furniture from China at factory prices`,
    template: `%s | ${SITE.brand}`,
  },
  description: SITE.tagline,
  openGraph: {
    type: "website",
    siteName: SITE.brand,
    title: `${SITE.brand} | Premium imported furniture`,
    description: SITE.tagline,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const categories = await listCategories();
  return (
    <html lang="en" className={`${sourceSans.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <StorefrontShell categories={categories}>{children}</StorefrontShell>
      </body>
    </html>
  );
}
