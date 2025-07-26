import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id: tradeId } = await params

    // Get the current trade details
    const currentTrade = await prisma.proposedTrades.findUnique({
      where: { id: tradeId },
      include: {
        offeredItem: true,
        offer: {
          include: {
            traveler: true
          }
        }
      }
    })

    if (!currentTrade) {
      return NextResponse.json(
        { error: "Trade not found" },
        { status: 404 }
      )
    }

    // Only the offer owner should be able to check availability
    if (!currentTrade.offer.traveler || currentTrade.offer.traveler.id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Get the item name
    const itemName = currentTrade.offeredItem?.name || "Unknown item"

    // Check if the offered item is already accepted in another trade
    const acceptedTrades = await prisma.proposedTrades.findMany({
      where: {
        offeredItemId: currentTrade.offeredItemId,
        id: {
          not: tradeId // Exclude the current trade
        }
      },
      include: {
        offer: {
          include: {
            item: true,
            acceptedTrade: true
          }
        }
      }
    })
    
    // Filter to only trades that are accepted
    const actuallyAcceptedTrades = acceptedTrades.filter(trade => 
      trade.offer.acceptedTradeId === trade.id
    )

    const isItemAvailable = actuallyAcceptedTrades.length === 0

    return NextResponse.json({
      isAvailable: isItemAvailable,
      itemName: itemName,
      acceptedInTrades: actuallyAcceptedTrades.map(trade => ({
        offerId: trade.offerId,
        offerTitle: trade.offer.title,
        offerItem: trade.offer.item?.name
      }))
    })
    
  } catch (error) {
    console.error("Error checking item availability:", error)
    return NextResponse.json(
      { error: "Failed to check item availability" },
      { status: 500 }
    )
  }
}