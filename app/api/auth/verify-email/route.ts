import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/?error=missing-token', req.url))
    }

    // Find user with this verification token
    const user = await prisma.travelers.findUnique({
      where: {
        emailVerificationToken: token
      }
    })

    if (!user) {
      return NextResponse.redirect(new URL('/?error=invalid-token', req.url))
    }

    // Check if token has expired
    if (user.emailVerificationTokenExpiry && new Date() > user.emailVerificationTokenExpiry) {
      return NextResponse.redirect(new URL('/?error=token-expired', req.url))
    }

    // Verify the user's email
    await prisma.travelers.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null
      }
    })

    // Redirect to login page with success message
    return NextResponse.redirect(new URL('/?verified=true', req.url))
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.redirect(new URL('/?error=verification-failed', req.url))
  }
}