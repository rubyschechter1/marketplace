"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Home, MessageCircle } from "lucide-react"

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/profile",
      icon: User,
      label: "Profile"
    },
    {
      href: "/",
      icon: Home,
      label: "Home"
    },
    {
      href: "/messages",
      icon: MessageCircle,
      label: "Messages"
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive 
                    ? "text-blue-500" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={24} />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}