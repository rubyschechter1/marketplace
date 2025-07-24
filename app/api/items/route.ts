import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { validateNoCurrency } from "@/lib/currencyFilter"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { name, description, category, condition, imageUrl } = data

    if (!name) {
      return NextResponse.json(
        { error: "Item name is required" },
        { status: 400 }
      )
    }

    // Validate item name for currency content and inappropriate content
    const nameValidation = validateNoCurrency(name, "Item name", "offer")
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      )
    }

    // Validate item description for currency content and inappropriate content
    if (description) {
      const descValidation = validateNoCurrency(description, "Item description", "offer")
      if (!descValidation.isValid) {
        return NextResponse.json(
          { error: descValidation.error },
          { status: 400 }
        )
      }
    }

    const item = await prisma.items.create({
      data: {
        name,
        description,
        category,
        condition,
        imageUrl,
        travelers: {
          connect: { id: session.user.id }
        }
      }
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Error creating item:", error)
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    )
  }
}