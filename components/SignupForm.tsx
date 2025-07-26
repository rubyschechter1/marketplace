"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Button from "./ui/Button"

export default function SignupForm({ onSwitch, onBack }: { onSwitch: () => void; onBack: () => void }) {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastInitial: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    if (!formData.acceptedTerms) {
      setError("You must accept the Terms of Service to create an account")
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
          password: formData.password,
          acceptedTerms: formData.acceptedTerms
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      // Show success message about email verification
      setSuccess(data.message || "Please check your email to verify your account before logging in.")
      // Clear form
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastInitial: "",
        acceptedTerms: false
      })
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
            className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan [&:-webkit-autofill]:!bg-tan [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:active]:shadow-[inset_0_0_0px_1000px_#ffebb5]"
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
              className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan [&:-webkit-autofill]:!bg-tan [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:active]:shadow-[inset_0_0_0px_1000px_#ffebb5]"
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
              className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan [&:-webkit-autofill]:!bg-tan [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:active]:shadow-[inset_0_0_0px_1000px_#ffebb5]"
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
            className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan [&:-webkit-autofill]:!bg-tan [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:active]:shadow-[inset_0_0_0px_1000px_#ffebb5]"
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
            className="w-full px-3 py-2 border border-black rounded-sm text-body placeholder-gray focus:outline-none focus:ring-1 focus:ring-black bg-tan [&:-webkit-autofill]:!bg-tan [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_#ffebb5] [&:-webkit-autofill:active]:shadow-[inset_0_0_0px_1000px_#ffebb5]"
            required
            minLength={6}
          />
        </div>

        {/* Terms of Service Acceptance */}
        <div className="flex items-start space-x-3">
          <input
            id="acceptedTerms"
            type="checkbox"
            checked={formData.acceptedTerms}
            onChange={(e) => setFormData({...formData, acceptedTerms: e.target.checked})}
            className="mt-1 w-4 h-4 accent-black"
            required
          />
          <label htmlFor="acceptedTerms" className="text-sm text-gray leading-relaxed">
            I acknowledge that I have read and agree to the{' '}
            <a 
              href="/terms" 
              target="_blank" 
              className="text-black underline hover:text-gray"
            >
              Terms of Service
            </a>
            , including the safety disclaimers for in-person meetings and the limitation of liability.
          </label>
        </div>

        {error && (
          <div className="text-red-600 text-body">{error}</div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-sm text-body">
            {success}
          </div>
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
      
      <button
        onClick={onBack}
        className="mt-4 text-black hover:text-gray transition-colors text-body text-left"
      >
        Back
      </button>
    </div>
  )
}