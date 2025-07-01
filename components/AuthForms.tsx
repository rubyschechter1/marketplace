"use client"

import { useState } from "react"
import LoginForm from "./LoginForm"
import SignupForm from "./SignupForm"

export default function AuthForms() {
  const [mode, setMode] = useState<'buttons' | 'login' | 'signup'>('buttons')

  if (mode === 'buttons') {
    return (
      <div className="w-full max-w-sm mx-auto space-y-4">
        <button
          onClick={() => setMode('login')}
          className="w-full py-3 px-6 text-button rounded-sm transition-colors font-normal bg-tan text-black border border-black hover:bg-white"
        >
          Log In
        </button>
        <button
          onClick={() => setMode('signup')}
          className="w-full py-3 px-6 text-button rounded-sm transition-colors font-normal bg-tan text-black border border-black hover:bg-white"
        >
          Sign Up
        </button>
      </div>
    )
  }

  return (
    <div>
      {mode === 'login' ? (
        <LoginForm onSwitch={() => setMode('signup')} />
      ) : (
        <SignupForm onSwitch={() => setMode('login')} />
      )}
    </div>
  )
}