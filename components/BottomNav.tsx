"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Home, MessageCircle } from "lucide-react"
import { useUser } from "@/contexts/UserContext"

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useUser()

  const navItems = [
    {
      href: "/search",
      icon: Search,
      label: "Search"
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
                <div className="relative">
                  <Icon size={24} strokeWidth={1.5} />
                  {item.href === "/messages" && user && user.unreadConversations > 0 ? (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {user.unreadConversations > 99 ? "99+" : user.unreadConversations}
                    </div>
                  ) : null}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}