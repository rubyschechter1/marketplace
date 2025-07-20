"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

interface BackButtonProps {
  fallbackUrl?: string
  className?: string
  children?: React.ReactNode
  onClick?: () => void
}

export default function BackButton({ 
  fallbackUrl = "/", 
  className = "w-full bg-tan text-black border border-black rounded-lg py-3 text-sm hover:bg-black hover:text-tan transition-colors flex items-center justify-center",
  children = "Back",
  onClick
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackUrl)
    }
  }

  return (
    <button 
      onClick={handleClick}
      className={className}
    >
      <ChevronLeft size={20} className="mr-1" />
      {children}
    </button>
  )
}