import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // TODO: Replace with actual database lookup
        // For now, this is a placeholder
        const user = {
          id: "1",
          email: credentials.email,
          name: "Test User"
        }

        return user
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/",
    error: "/"
  }
}