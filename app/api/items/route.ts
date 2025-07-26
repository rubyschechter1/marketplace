import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { validateContent, validateMultipleFields } from "@/lib/contentValidation"

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

    // Validate content fields
    const fieldsToValidate = [
      { text: name, fieldName: "Item name", context: "offer" as const }
    ]
    
    if (description) {
      fieldsToValidate.push({ text: description, fieldName: "Item description", context: "offer" as const })
    }
    
    const validation = await validateMultipleFields(fieldsToValidate)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const item = await prisma.items.create({
      data: {
        name,
        description,
        category,
        condition,
        imageUrl,
        originalOwnerId: session.user.id,
        currentOwnerId: session.user.id,
        acquisitionMethod: "created"
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