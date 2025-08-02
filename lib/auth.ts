import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare, hash } from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("🔑 NextAuth authorize called for email:", credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials")
          return null
        }

        console.log("🔍 Looking up user in database...")
        const user = await prisma.travelers.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          console.log("❌ User not found or no password set")
          return null
        }

        console.log("✅ User found, checking email verification...")
        
        if (!user.emailVerified) {
          console.log("❌ Email not verified")
          throw new Error("Please verify your email before logging in")
        }
        
        console.log("✅ Email verified, checking password...")
        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          console.log("❌ Invalid password")
          return null
        }

        console.log("✅ Password valid, returning user object")
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`
        }
      }
    })
  ],
  callbacks: {
    session: ({ session, token }) => {
      console.log("📋 Session callback - token.sub:", token.sub, "token.uid:", token.uid, "session.user:", session?.user?.email)
      if (session?.user) {
        // Try token.sub first (standard JWT field), then token.uid (custom field)
        session.user.id = token.sub || token.uid || undefined
        
        // If still no ID, this is an invalid session
        if (!session.user.id) {
          console.error("❌ Session has no user ID - invalid token structure")
          return null  // This will force re-authentication
        }
      }
      console.log("📋 Session callback result:", session)
      return session
    },
    jwt: ({ user, token }) => {
      console.log("🎫 JWT callback - user:", user?.id, "token.uid:", token.uid)
      if (user) {
        token.uid = user.id
      }
      console.log("🎫 JWT callback result:", token)
      return token
    }
  },
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/",
    error: "/"
  }
}