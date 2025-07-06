"use client"

import BottomNav from "./BottomNav"
import LocationGuard from "./LocationGuard"

interface AuthLayoutProps {
  children: React.ReactNode
  variant?: "default" | "fullHeight"
}

export default function AuthLayout({ 
  children, 
  variant = "default" 
}: AuthLayoutProps) {
  return (
    <LocationGuard>
      <div className={`min-h-screen ${variant === "default" ? "pb-16" : ""}`}>
        {children}
        <BottomNav />
      </div>
    </LocationGuard>
  )
}