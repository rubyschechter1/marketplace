import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { proposedTradeId, rating, content } = body

    // Validate input
    if (!proposedTradeId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    // Get the proposed trade with all relations
    const proposedTrade = await prisma.proposedTrades.findUnique({
      where: { id: proposedTradeId },
      include: {
        offer: {
          include: {
            traveler: true
          }
        },
        proposer: true
      }
    })

    if (!proposedTrade) {
      return NextResponse.json(
        { error: "Proposed trade not found" },
        { status: 404 }
      )
    }

    // Check if trade is accepted
    if (proposedTrade.offer.acceptedTradeId !== proposedTrade.id) {
      return NextResponse.json(
        { error: "Can only review accepted trades" },
        { status: 400 }
      )
    }

    // Determine reviewer and reviewee
    const isOfferOwner = proposedTrade.offer.travelerId === session.user.id
    const isProposer = proposedTrade.proposerId === session.user.id

    if (!isOfferOwner && !isProposer) {
      return NextResponse.json(
        { error: "You are not part of this trade" },
        { status: 403 }
      )
    }

    const reviewerId = session.user.id
    const revieweeId = isOfferOwner ? proposedTrade.proposerId : proposedTrade.offer.travelerId
    
    if (!revieweeId) {
      return NextResponse.json(
        { error: "Unable to determine reviewee" },
        { status: 400 }
      )
    }

    // Check if review already exists
    const existingReview = await prisma.reviews.findUnique({
      where: {
        proposedTradeId_reviewerId: {
          proposedTradeId,
          reviewerId
        }
      }
    })

    let review
    if (existingReview) {
      // Update existing review
      review = await prisma.reviews.update({
        where: { id: existingReview.id },
        data: {
          rating,
          content: content || null,
          isEdited: true,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new review
      review = await prisma.reviews.create({
        data: {
          proposedTradeId,
          reviewerId,
          revieweeId,
          rating,
          content: content || null
        }
      })
    }

    // Update user reputation score
    await updateUserReputationScore(revieweeId)

    // Get reviewer's name for the system message
    const reviewer = await prisma.travelers.findUnique({
      where: { id: reviewerId },
      select: { firstName: true }
    })

    // Check if both parties have now reviewed - if so, complete the trade
    const allReviews = await prisma.reviews.findMany({
      where: { proposedTradeId },
      include: {
        reviewer: { select: { firstName: true, lastName: true } }
      }
    })

    // Need exactly 2 reviews (one from each party)
    if (allReviews.length === 2) {
      // Both parties have reviewed - now reveal reviews and complete the trade
      
      // Create system message showing both reviews are now visible (Airbnb-style)
      await prisma.messages.create({
        data: {
          content: `Both parties have reviewed each other! Reviews are now visible.`,
          offerId: proposedTrade.offerId,
          proposedTradeId: proposedTradeId,
          // No senderId for system messages
          // No recipientId for system messages
        }
      })
      
      // Complete the trade by transferring items
      await completeTradeWithItemTransfer(proposedTrade, proposedTradeId)
    } else {
      // Only one party has reviewed so far - create messages for both parties
      const reviewerName = reviewer?.firstName || 'Someone'
      
      // Check if this is a gift mode trade
      const isGiftMode = proposedTrade.isGiftMode
      
      // Message for the reviewer
      const reviewerMessage = existingReview
        ? `You updated your review. It will be visible once both parties have reviewed.`
        : `You submitted your review. It will be visible once both parties have reviewed.`
      
      await prisma.messages.create({
        data: {
          content: reviewerMessage,
          offerId: proposedTrade.offerId,
          proposedTradeId: proposedTradeId,
          senderId: null, // System message
          recipientId: reviewerId, // Only visible to the reviewer
        }
      })
      
      // Message for the other party
      const otherPartyId = isOfferOwner ? proposedTrade.proposerId : proposedTrade.offer.travelerId
      const otherPartyMessage = isGiftMode
        ? `${reviewerName} has submitted their review on the gift. It will be visible once both parties have reviewed. In order to send a review, click the "Send item" button.`
        : `${reviewerName} has submitted their review on the trade. It will be visible once both parties have reviewed. In order to send a review, click the "Send item" button.`
      
      await prisma.messages.create({
        data: {
          content: otherPartyMessage,
          offerId: proposedTrade.offerId,
          proposedTradeId: proposedTradeId,
          senderId: null, // System message
          recipientId: otherPartyId, // Only visible to the other party
        }
      })
    }

    return NextResponse.json(review)
  } catch (error) {
    console.error("Error creating/updating review:", error)
    return NextResponse.json(
      { error: "Failed to save review" },
      { status: 500 }
    )
  }
}

async function completeTradeWithItemTransfer(proposedTrade: any, proposedTradeId: string) {
  try {
    console.log('🎉 Both parties have reviewed - completing trade:', proposedTradeId)
    
    // Get the full trade details with items
    const tradeDetails = await prisma.proposedTrades.findUnique({
      where: { id: proposedTradeId },
      include: {
        proposer: true,
        offeredItem: true,
        offer: {
          include: {
            traveler: true,
            item: true,
          }
        }
      }
    })

    if (!tradeDetails) return

    const offerOwner = tradeDetails.offer.traveler
    const proposer = tradeDetails.proposer

    if (!offerOwner || !proposer) {
      console.error('❌ Missing offer owner or proposer in trade details')
      return
    }

    // Check if this is a gift mode trade
    const isGift = tradeDetails.isGiftMode

    // Handle offered item transfer (from proposer to offer owner) - always happens
    if (tradeDetails.offeredItem) {
      // Check if item is still owned by proposer (hasn't been transferred yet)
      const currentOfferedItem = await prisma.items.findUnique({
        where: { id: tradeDetails.offeredItem.id },
        select: { currentOwnerId: true }
      })
      
      if (currentOfferedItem && currentOfferedItem.currentOwnerId === proposer.id) {
        // Update item ownership
        await prisma.items.update({
          where: { id: tradeDetails.offeredItem.id },
          data: {
            currentOwnerId: offerOwner.id,
            isAvailable: true
          }
        })

        // Create history entry with receiver's avatar
        await prisma.itemHistory.create({
          data: {
            itemId: tradeDetails.offeredItem.id,
            fromOwnerId: proposer.id,
            toOwnerId: offerOwner.id,
            tradeId: proposedTradeId,
            city: offerOwner.lastCity,
            country: offerOwner.lastCountry,
            transferMethod: isGift ? "gifted" : "traded",
            receiverAvatarUrl: offerOwner.avatarUrl
          }
        })
      }
    }

    // Handle requested item transfer (from offer owner to proposer) - only in bilateral trades
    if (tradeDetails.offer.item && !isGift) {
      // Check if item is still owned by offer owner (hasn't been transferred yet)
      const currentRequestedItem = await prisma.items.findUnique({
        where: { id: tradeDetails.offer.item.id },
        select: { currentOwnerId: true }
      })
      
      if (currentRequestedItem && currentRequestedItem.currentOwnerId === offerOwner.id) {
        // Update item ownership
        await prisma.items.update({
          where: { id: tradeDetails.offer.item.id },
          data: {
            currentOwnerId: proposer.id,
            isAvailable: true
          }
        })

        // Create history entry with receiver's avatar
        await prisma.itemHistory.create({
          data: {
            itemId: tradeDetails.offer.item.id,
            fromOwnerId: offerOwner.id,
            toOwnerId: proposer.id,
            tradeId: proposedTradeId,
            city: proposer.lastCity,
            country: proposer.lastCountry,
            transferMethod: "traded",
            receiverAvatarUrl: proposer.avatarUrl
          }
        })
      }
    }

    // Mark the offer as completed
    await prisma.offers.update({
      where: { id: tradeDetails.offerId },
      data: { status: 'completed' }
    })

    // Create a system message announcing the completed trade
    const completionMessage = isGift 
      ? `Gift completed! Both parties have reviewed each other. The gift has been transferred to the recipient's inventory.`
      : `Trade completed! Both parties have reviewed each other. Items have been transferred to your inventories.`
    
    await prisma.messages.create({
      data: {
        content: completionMessage,
        offerId: tradeDetails.offerId,
        proposedTradeId: proposedTradeId,
        // No senderId for system messages
        // No recipientId for system messages
      }
    })

    console.log('✅ Trade completed successfully:', proposedTradeId)
  } catch (error) {
    console.error('❌ Error completing trade:', error)
    // Create error message
    await prisma.messages.create({
      data: {
        content: `Error completing trade automatically. Please contact support.`,
        offerId: proposedTrade.offerId,
        proposedTradeId: proposedTradeId,
      }
    })
  }
}

async function updateUserReputationScore(userId: string) {
  try {
    // Get all reviews for this user
    const reviews = await prisma.reviews.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: {
          include: {
            reputationScore: true
          }
        }
      }
    })

    if (reviews.length === 0) return

    // Calculate weighted average rating
    let totalWeightedRating = 0
    let totalWeight = 0

    for (const review of reviews) {
      // Get reviewer's credibility score (default to 1 if not set)
      const credibility = review.reviewer.reputationScore?.credibilityScore 
        ? Number(review.reviewer.reputationScore.credibilityScore) 
        : 1

      totalWeightedRating += review.rating * credibility
      totalWeight += credibility
    }

    const averageRating = totalWeight > 0 ? totalWeightedRating / totalWeight : 0

    // Update or create reputation score
    await prisma.userReputationScores.upsert({
      where: { userId },
      create: {
        userId,
        totalReviews: reviews.length,
        averageRating,
        credibilityScore: 1 // Default credibility
      },
      update: {
        totalReviews: reviews.length,
        averageRating,
        lastCalculated: new Date()
      }
    })
  } catch (error) {
    console.error("Error updating reputation score:", error)
    // Don't fail the review if reputation update fails
  }
}