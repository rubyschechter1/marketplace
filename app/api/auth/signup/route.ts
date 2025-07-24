import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { resend, FROM_EMAIL } from "@/lib/email/resend"
import { WelcomeEmail } from "@/emails/welcome"
import { render } from '@react-email/render'
import * as React from 'react'

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

    // Create user
    const user = await prisma.travelers.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword
      }
    })

    // Send welcome email
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: 'BSH: Welcome to Brown Straw Hat!',
          html: await render(
            React.createElement(WelcomeEmail, {
              firstName,
              email,
            })
          ),
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the signup if email fails
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}