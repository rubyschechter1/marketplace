"use client"

import { useRouter, usePathname } from "next/navigation"
import { useCallback } from "react"

export interface SmartNavigationOptions {
  fallbackUrl?: string
  onNavigate?: () => void
}

export function useSmartNavigation(options: SmartNavigationOptions = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const { fallbackUrl, onNavigate } = options
  
  const goBack = useCallback(() => {
    if (onNavigate) {
      onNavigate()
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      const defaultFallback = getDefaultFallback(pathname)
      router.push(fallbackUrl || defaultFallback)
    }
  }, [router, pathname, fallbackUrl, onNavigate])

  return { goBack }
}

function getDefaultFallback(pathname: string): string {
  if (pathname.startsWith('/messages/')) {
    return '/messages'
  }
  
  if (pathname.startsWith('/offers/')) {
    return '/'
  }
  
  if (pathname.startsWith('/profile')) {
    return '/'
  }
  
  if (pathname.startsWith('/history/')) {
    return '/'
  }
  
  return '/'
}