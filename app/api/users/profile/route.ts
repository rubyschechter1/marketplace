import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { firstName, lastName, bio, avatarUrl, languages } = data

    // Validate input
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

    const updatedUser = await prisma.travelers.update({
      where: { id: session.user.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(languages !== undefined && { languages })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        languages: true,
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