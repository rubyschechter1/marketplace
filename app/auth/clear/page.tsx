"use client"

import { useEffect } from "react"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function ClearAuthPage() {
  const router = useRouter()

  useEffect(() => {
    async function clearEverything() {
      console.log("🧹 Starting comprehensive auth cleanup...")
      
      // 1. Clear all localStorage
      try {
        localStorage.clear()
        console.log("✅ Cleared localStorage")
      } catch (e) {
        console.error("Failed to clear localStorage:", e)
      }
      
      // 2. Clear all sessionStorage
      try {
        sessionStorage.clear()
        console.log("✅ Cleared sessionStorage")
      } catch (e) {
        console.error("Failed to clear sessionStorage:", e)
      }
      
      // 3. Clear all cookies we can access from client-side
      try {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })
        console.log("✅ Cleared accessible cookies")
      } catch (e) {
        console.error("Failed to clear cookies:", e)
      }
      
      // 4. Sign out through NextAuth (this will clear server-side session)
      try {
        await signOut({ redirect: false })
        console.log("✅ Signed out via NextAuth")
      } catch (e) {
        console.error("Failed to sign out:", e)
      }
      
      // 5. Force reload to home page to ensure clean state
      setTimeout(() => {
        window.location.href = "/"
      }, 100)
    }
    
    clearEverything()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-tan">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Clearing authentication...</h1>
        <p className="text-gray-600">Please wait while we clear your session data.</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    </div>
  )
}