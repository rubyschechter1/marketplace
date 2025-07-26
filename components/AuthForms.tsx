"use client"

import { useState, useEffect } from "react"
import LoginForm from "./LoginForm"
import SignupForm from "./SignupForm"

interface AuthFormsProps {
  verified?: string
  error?: string
}

export default function AuthForms({ verified, error }: AuthFormsProps) {
  const [mode, setMode] = useState<'buttons' | 'login' | 'signup'>('buttons')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (verified === 'true') {
      setMessage({ type: 'success', text: 'Email verified successfully! You can now log in.' })
      setMode('login')
    } else if (error === 'invalid-token') {
      setMessage({ type: 'error', text: 'Invalid verification link. Please try signing up again.' })
    } else if (error === 'token-expired') {
      setMessage({ type: 'error', text: 'Verification link has expired. Please sign up again.' })
    } else if (error === 'missing-token') {
      setMessage({ type: 'error', text: 'Invalid verification link.' })
    } else if (error === 'verification-failed') {
      setMessage({ type: 'error', text: 'Email verification failed. Please try again.' })
    }
  }, [verified, error])

  if (mode === 'buttons') {
    return (
      <div className="w-full max-w-sm mx-auto space-y-4">
        {message && (
          <div className={`px-4 py-3 rounded-sm text-body ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-300 text-green-800' 
              : 'bg-red-50 border border-red-300 text-red-800'
          }`}>
            {message.text}
          </div>
        )}
        <button
          onClick={() => setMode('login')}
          className="w-full py-3 px-6 text-button rounded-sm transition-all font-normal bg-tan text-black border border-black shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          Log In
        </button>
        <button
          onClick={() => setMode('signup')}
          className="w-full py-3 px-6 text-button rounded-sm transition-all font-normal bg-tan text-black border border-black shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          Sign Up
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {message && (
        <div className={`px-4 py-3 rounded-sm text-body mb-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-300 text-green-800' 
            : 'bg-red-50 border border-red-300 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      {mode === 'login' ? (
        <LoginForm onSwitch={() => setMode('signup')} onBack={() => setMode('buttons')} />
      ) : (
        <SignupForm onSwitch={() => setMode('login')} onBack={() => setMode('buttons')} />
      )}
    </div>
  )
}