import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";
import AuthProvider from "./providers/SessionProvider";
import { LocationProvider } from "@/contexts/LocationContext";
import { UserProvider } from "@/contexts/UserContext";

const instrumentSerif = Instrument_Serif({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-instrument-serif'
});

export const metadata: Metadata = {
  title: "Marketplace - Barter for Travelers",
  description: "Trade items with fellow travelers - no money needed",
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
      </body>
    </html>
  );
}