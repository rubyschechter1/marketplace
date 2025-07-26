import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { resend, FROM_EMAIL } from "@/lib/email/resend"
import { VerificationEmail } from "@/emails/verification"
import { render } from '@react-email/render'
import * as React from 'react'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { email, firstName, lastName, password, acceptedTerms } = await req.json()

    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!acceptedTerms) {
      return NextResponse.json(
        { error: "Terms of Service must be accepted to create an account" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.travelers.findFirst({
      where: {
        email
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date()
    tokenExpiry.setHours(tokenExpiry.getHours() + 24) // Token expires in 24 hours

    // Create user with verification token
    const user = await prisma.travelers.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiry: tokenExpiry
      }
    })

    // Send verification email
    if (process.env.RESEND_API_KEY) {
      try {
        const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`
        
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: 'BSH: Verify your email address',
          html: await render(
            React.createElement(VerificationEmail, {
              firstName,
              verificationUrl,
            })
          ),
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the signup if email fails, but log it
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      message: "Please check your email to verify your account before logging in."
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}