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
  title: "Brown Straw Hat - Barter for Travelers",
  description: "Trade items with fellow travelers - no money needed",
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