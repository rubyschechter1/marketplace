import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    // Find the item
    const item = await prisma.items.findUnique({
      where: { id }
    })

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    // Check if the user owns this item
    if (item.currentOwnerId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't own this item" },
        { status: 403 }
      )
    }

    // Check if the item is currently being offered
    const activeOffer = await prisma.offers.findFirst({
      where: {
        itemId: id,
        status: 'active'
      }
    })

    if (activeOffer) {
      return NextResponse.json(
        { error: "Cannot delete item that is currently being offered. Delete the offer first." },
        { status: 400 }
      )
    }

    // Check if the item is part of any pending trades
    const pendingTrades = await prisma.proposedTrades.findMany({
      where: {
        OR: [
          { offeredItemId: id },
          { 
            offer: {
              itemId: id
            }
          }
        ],
        status: {
          in: ['pending', 'accepted']
        }
      }
    })

    if (pendingTrades.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete item that is part of pending or accepted trades." },
        { status: 400 }
      )
    }

    // Delete the item (this will cascade delete related history entries)
    await prisma.items.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true, 
      message: `${item.name} has been deleted from your inventory.` 
    })

  } catch (error) {
    console.error("❌ Error deleting inventory item:", error)
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    )
  }
}