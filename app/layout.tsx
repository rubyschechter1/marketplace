import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";
import AuthProvider from "./providers/SessionProvider";
import { LocationProvider } from "@/contexts/LocationContext";
import { UserProvider } from "@/contexts/UserContext";
import { Analytics } from "@vercel/analytics/next";

const instrumentSerif = Instrument_Serif({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-instrument-serif'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://brownstrawhat.com'),
  title: "Brown Straw Hat - Barter for Travelers",
  description: "Trade items with fellow travelers - no money needed",
  keywords: "barter, trade, travelers, exchange, marketplace, no money",
  authors: [{ name: "Brown Straw Hat" }],
  creator: "Brown Straw Hat",
  publisher: "Brown Straw Hat",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://brownstrawhat.com",
    siteName: "Brown Straw Hat",
    title: "Brown Straw Hat - Barter for Travelers",
    description: "Trade items with fellow travelers - no money needed. Join our community of travelers who share and exchange items through bartering.",
    images: [
      {
        url: "/og-image.png?v=2",
        width: 1200,
        height: 630,
        alt: "Brown Straw Hat - Barter Marketplace for Travelers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brown Straw Hat - Barter for Travelers",
    description: "Trade items with fellow travelers - no money needed",
    images: ["/og-image.png?v=2"],
    creator: "@brownstrawhat",
    site: "@brownstrawhat",
  },
  other: {
    'theme-color': '#ffebb5',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={instrumentSerif.variable}>
      <body className={`${instrumentSerif.className} min-h-screen bg-tan`}>
        <div className="min-h-screen max-w-md mx-auto bg-tan">
          <AuthProvider>
            <UserProvider>
              <LocationProvider>
                {children}
              </LocationProvider>
            </UserProvider>
          </AuthProvider>
        </div>
        <Analytics />
      </body>
    </html>
  );
}