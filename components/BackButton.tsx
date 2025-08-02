"use client"

import { ChevronLeft } from "lucide-react"
import { useSmartNavigation } from "@/hooks/useSmartNavigation"

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
  const { goBack } = useSmartNavigation({ 
    fallbackUrl,
    onNavigate: onClick 
  })

  return (
    <button 
      onClick={goBack}
      className={className}
    >
      <ChevronLeft size={24} className="mr-1" />
      {children}
    </button>
  )
}