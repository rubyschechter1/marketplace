import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "./providers/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <div className="min-h-screen max-w-md mx-auto bg-white shadow-sm">
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}