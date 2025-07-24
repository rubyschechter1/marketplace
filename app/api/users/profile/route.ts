import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { validateNoCurrency } from "@/lib/currencyFilter"

const prisma = new PrismaClient()

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { firstName, lastName, bio, avatarUrl, languages, countriesVisited } = data

    // Validate content for currency references and inappropriate content
    if (firstName) {
      const firstNameValidation = validateNoCurrency(firstName, "First name", "profile")
      if (!firstNameValidation.isValid) {
        return NextResponse.json(
          { error: firstNameValidation.error },
          { status: 400 }
        )
      }
    }

    if (lastName) {
      const lastNameValidation = validateNoCurrency(lastName, "Last name", "profile")
      if (!lastNameValidation.isValid) {
        return NextResponse.json(
          { error: lastNameValidation.error },
          { status: 400 }
        )
      }
    }

    if (bio) {
      const bioValidation = validateNoCurrency(bio, "Bio", "profile")
      if (!bioValidation.isValid) {
        return NextResponse.json(
          { error: bioValidation.error },
          { status: 400 }
        )
      }
    }

    // Validate input length
    if (firstName && firstName.length > 50) {
      return NextResponse.json(
        { error: "First name too long (max 50 characters)" },
        { status: 400 }
      )
    }

    if (lastName && lastName.length > 50) {
      return NextResponse.json(
        { error: "Last name too long (max 50 characters)" },
        { status: 400 }
      )
    }

    if (bio && bio.length > 500) {
      return NextResponse.json(
        { error: "Bio too long (max 500 characters)" },
        { status: 400 }
      )
    }

    if (languages && !Array.isArray(languages)) {
      return NextResponse.json(
        { error: "Languages must be an array" },
        { status: 400 }
      )
    }

    if (countriesVisited && !Array.isArray(countriesVisited)) {
      return NextResponse.json(
        { error: "Countries visited must be an array" },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.travelers.update({
      where: { id: session.user.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(languages !== undefined && { languages }),
        ...(countriesVisited !== undefined && { countriesVisited })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        languages: true,
        countriesVisited: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}