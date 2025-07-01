"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Button from "./ui/Button"

export default function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastInitial: "",
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastInitial + ".",
          password: formData.password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      // Auto sign in after signup
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Failed to sign in after signup")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message)
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
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan"
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-body text-gray mb-2">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan"
              placeholder="First"
              required
            />
          </div>

          <div>
            <label htmlFor="lastInitial" className="block text-body text-gray mb-2">
              Last Initial
            </label>
            <input
              id="lastInitial"
              type="text"
              value={formData.lastInitial}
              onChange={(e) => {
                const value = e.target.value.toUpperCase()
                if (value.length <= 1 && /^[A-Z]?$/.test(value)) {
                  setFormData({...formData, lastInitial: value})
                }
              }}
              className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan"
              placeholder="L"
              required
              maxLength={1}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-body text-gray mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan"
            placeholder="Create a password"
            required
            minLength={6}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-body text-gray mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan"
            placeholder="Confirm your password"
            required
            minLength={6}
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
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>

      </form>
    </div>
  )
}