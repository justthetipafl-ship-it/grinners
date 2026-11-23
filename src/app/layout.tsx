import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AgeGate } from "@/components/AgeGate";
import { SITE_URL, X_HANDLE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Grinners — Winners are Grinners",
    template: "%s · Grinners",
  },
  description:
    "Discover sports betting tipsters and cappers, fantasy creators, tools, podcasts and YouTube channels for every sport, from around the world. 18+ only.",
  openGraph: {
    siteName: "Grinners",
    type: "website",
    locale: "en_AU",
  },
  twitter: { card: "summary_large_image", site: `@${X_HANDLE}` },
  // The name under the icon when the site is saved to a phone's home screen.
  appleWebApp: { title: "Grinners", capable: true, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#0e1012" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <AgeGate />
      </body>
    </html>
  );
}
