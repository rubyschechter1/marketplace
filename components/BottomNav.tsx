"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Home, MessageCircle } from "lucide-react"

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/messages",
      icon: MessageCircle,
      label: "Messages"
    },
    {
      href: "/",
      icon: Home,
      label: "Home"
    },
    {
      href: "/search",
      icon: Search,
      label: "Search"
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-tan border-t border-black">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center flex-1 h-full transition-colors ${
                  isActive 
                    ? "text-black" 
                    : "text-gray hover:text-black"
                }`}
              >
                <Icon size={24} strokeWidth={1.5} />
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}