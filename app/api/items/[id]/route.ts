import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const item = await prisma.items.findUnique({
      where: { id },
      include: {
        currentOwner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        originalOwner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: { offers: true }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Error fetching item:", error)
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { imageUrl } = body

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    // Check if the item exists and user owns it
    const item = await prisma.items.findUnique({
      where: { id },
      select: {
        currentOwnerId: true
      }
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Only allow updating if the user owns this item
    if (item.currentOwnerId !== session.user.id) {
      return NextResponse.json({ error: "You don't own this item" }, { status: 403 })
    }

    // Update the item with the new image
    const updatedItem = await prisma.items.update({
      where: { id },
      data: { imageUrl }
    })

    return NextResponse.json({ item: updatedItem })
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    )
  }
}