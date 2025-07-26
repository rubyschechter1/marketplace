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

    // Check if the item is part of any active trades (not rejected/withdrawn)
    const activeTrades = await prisma.proposedTrades.findMany({
      where: {
        OR: [
          { offeredItemId: id },
          { 
            offer: {
              itemId: id
            }
          }
        ],
        isRejected: false,
        isWithdrawn: false
      },
      include: {
        offer: {
          select: {
            acceptedTradeId: true,
            status: true
          }
        }
      }
    })

    // Filter out trades where the offer is completed
    const nonCompletedTrades = activeTrades.filter(trade => 
      trade.offer.status !== 'completed'
    )

    // Check if any of these trades are accepted or potentially active
    const hasAcceptedTrade = nonCompletedTrades.some(trade => 
      trade.offer.acceptedTradeId === trade.id
    )
    
    const hasPendingTrade = nonCompletedTrades.some(trade => 
      !trade.offer.acceptedTradeId || trade.offer.acceptedTradeId === trade.id
    )

    if (hasAcceptedTrade) {
      return NextResponse.json(
        { error: "Cannot delete item that is part of an accepted trade." },
        { status: 400 }
      )
    }

    if (hasPendingTrade) {
      return NextResponse.json(
        { error: "Cannot delete item that is part of pending trades." },
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