import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get all accepted trades where the user is involved
    const acceptedTrades = await prisma.proposedTrades.findMany({
      where: {
        status: 'accepted',
        OR: [
          { proposerId: session.user.id },
          {
            offer: {
              travelerId: session.user.id
            }
          }
        ]
      },
      include: {
        offer: {
          include: {
            traveler: true,
            item: true
          }
        },
        proposer: true,
        offeredItem: true,
        reviews: {
          where: {
            reviewerId: session.user.id
          }
        },
        exchangeDate: true
      }
    })

    // Filter trades that:
    // 1. Don't have a review from this user yet
    // 2. Have an exchange date that has passed
    const pendingReviews = acceptedTrades.filter(trade => {
      // Check if user already reviewed
      if (trade.reviews.length > 0) return false
      
      // Check if exchange date has passed
      if (trade.exchangeDate && new Date(trade.exchangeDate.extractedDate) > new Date()) {
        return false
      }
      
      // If no exchange date, include it (will be handled by batch job later)
      return true
    })

    // Format the response to include who to review
    const formattedPendingReviews = pendingReviews.map(trade => {
      const isOfferOwner = trade.offer.travelerId === session.user.id
      const reviewee = isOfferOwner ? trade.proposer : trade.offer.traveler
      
      return {
        proposedTradeId: trade.id,
        reviewee: reviewee ? {
          id: reviewee.id,
          firstName: reviewee.firstName,
          lastName: reviewee.lastName
        } : null,
        tradeDetails: {
          offerId: trade.offer.id,
          offerTitle: trade.offer.title,
          offerType: trade.offer.type,
          offeredItemName: trade.offer.type === 'ask' ? trade.offeredItem.name : trade.offer.item?.name,
          yourItemName: trade.offer.type === 'ask' ? trade.offer.item?.name : trade.offeredItem.name
        },
        exchangeDate: trade.exchangeDate?.extractedDate || null
      }
    })

    return NextResponse.json({ pendingReviews: formattedPendingReviews })
  } catch (error) {
    console.error("Error fetching pending reviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch pending reviews" },
      { status: 500 }
    )
  }
}