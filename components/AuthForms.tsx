"use client"

import { useState } from "react"
import LoginForm from "./LoginForm"
import SignupForm from "./SignupForm"

export default function AuthForms() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div>
      <h2 className="text-2xl font-semibold text-center mb-6">
        {isLogin ? "Sign In" : "Create Account"}
      </h2>
      
      {isLogin ? (
        <LoginForm onSwitch={() => setIsLogin(false)} />
      ) : (
        <SignupForm onSwitch={() => setIsLogin(true)} />
      )}
    </div>
  )
}