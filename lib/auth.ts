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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.traveler.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName.charAt(0)}.`
        }
      }
    })
  ],
  callbacks: {
    session: ({ session, token }) => {
      if (session?.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    jwt: ({ user, token }) => {
      if (user) {
        token.uid = user.id
      }
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