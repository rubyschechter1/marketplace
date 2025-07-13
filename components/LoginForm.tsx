"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Button from "./ui/Button"

export default function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log("🔐 Login attempt starting for:", email)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log("🔐 SignIn result:", result)

      if (result?.error) {
        console.log("❌ Login error:", result.error)
        setError("Invalid email or password")
      } else if (result?.ok) {
        console.log("✅ Login successful, refreshing page...")
        // Small delay to ensure session is set, then reload
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } else {
        console.log("⚠️ Unexpected login result:", result)
        setError("Login failed - please try again")
      }
    } catch (error) {
      console.error("❌ Login exception:", error)
      setError("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-body text-gray mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-body text-gray mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan"
            placeholder="Enter your password"
            required
          />
        </div>

        {error && (
          <div className="text-red-600 text-body">{error}</div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          fullWidth
          variant="secondary"
        >
          {isLoading ? "Logging in..." : "Log In"}
        </Button>

      </form>
    </div>
  )
}