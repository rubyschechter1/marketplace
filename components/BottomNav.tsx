"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/contexts/UserContext"
import Image from "next/image"

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useUser()

  const navItems = [
    {
      href: "/search",
      icon: "/images/newsearch.png",
      label: "Search"
    },
    {
      href: "/",
      icon: "/images/new2_home.png",
      label: "Home"
    },
    {
      href: "/messages",
      icon: "/images/new_mail.png",
      label: "Messages"
    },
    {
      href: "/profile",
      icon: "/images/profile.png",
      label: "Me"
    }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-tan border-t border-black z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center h-16 -translate-y-[5px]">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 h-full transition-colors relative"
              >
                {isActive && (
                  <div className="absolute top-[1px] left-0 right-0 h-1 bg-black"></div>
                )}
                <div className="relative">
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={item.href === "/search" ? 28 : item.href === "/profile" ? 48 : 40}
                    height={item.href === "/search" ? 28 : item.href === "/profile" ? 48 : 40}
                    className={`transition-opacity ${item.href === "/search" ? "-rotate-[10deg] -translate-y-[2px]" : "-translate-y-[3px]"} ${item.href === "/messages" ? "translate-y-[1px]" : ""} ${item.href === "/profile" ? "translate-y-[2px]" : ""}`}
                  />
                  {item.href === "/messages" && user && user.unreadMessagesCount !== undefined && user.unreadMessagesCount > 0 ? (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {user.unreadMessagesCount > 99 ? "99+" : user.unreadMessagesCount}
                    </div>
                  ) : null}
                </div>
                <span className="text-xs mt-1 mb-2 absolute bottom-2 translate-y-[15px]">{item.label.toLowerCase()}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}