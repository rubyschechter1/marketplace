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
      
      
      // Complete the trade by transferring items
      await completeTradeWithItemTransfer(proposedTrade, proposedTradeId)
    } else {
      // Only one party has reviewed so far - create messages for both parties
      const reviewerName = reviewer?.firstName || 'Someone'
      
      // Check if this is a gift mode trade
      const isGiftMode = proposedTrade.isGiftMode ?? false
      
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

    if (!tradeDetails) {
      console.error('❌ No trade details found for:', proposedTradeId)
      return
    }

    const offerOwner = tradeDetails.offer.traveler
    const proposer = tradeDetails.proposer

    if (!offerOwner || !proposer) {
      console.error('❌ Missing offer owner or proposer in trade details')
      return
    }

    // Check if this is a gift mode trade
    const isGift = tradeDetails.isGiftMode ?? false
    
    console.log('📋 Trade Summary:', {
      tradeId: proposedTradeId,
      isGift,
      offerType: tradeDetails.offer.type,
      proposer: `${proposer.firstName} (${proposer.id})`,
      offerOwner: `${offerOwner.firstName} (${offerOwner.id})`,
      offeredItem: tradeDetails.offeredItem ? `${tradeDetails.offeredItem.name} (${tradeDetails.offeredItem.id})` : 'None',
      requestedItem: tradeDetails.offer.item ? `${tradeDetails.offer.item.name} (${tradeDetails.offer.item.id})` : 'None'
    })

    let offeredItemTransferred = false
    let requestedItemTransferred = false

    // Handle offered item transfer (from proposer to offer owner) - always happens
    if (tradeDetails.offeredItem) {
      try {
        console.log('📦 Processing offered item transfer:', tradeDetails.offeredItem.name)
        
        // Check if item is still owned by proposer (hasn't been transferred yet)
        const currentOfferedItem = await prisma.items.findUnique({
          where: { id: tradeDetails.offeredItem.id },
          select: { currentOwnerId: true, name: true, isAvailable: true }
        })
        
        console.log('👤 Offered item current state:', {
          itemId: tradeDetails.offeredItem.id,
          currentOwner: currentOfferedItem?.currentOwnerId,
          expectedOwner: proposer.id,
          isAvailable: currentOfferedItem?.isAvailable,
          ownershipMatches: currentOfferedItem?.currentOwnerId === proposer.id
        })
        
        if (currentOfferedItem && currentOfferedItem.currentOwnerId === proposer.id) {
          console.log('✅ Transferring offered item from', proposer.firstName, 'to', offerOwner.firstName)
          
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
              city: offerOwner.lastCity || "Unknown City",
              country: offerOwner.lastCountry || "Unknown Country", 
              transferMethod: isGift ? "gifted" : "traded",
              receiverAvatarUrl: offerOwner.avatarUrl
            }
          })
          
          offeredItemTransferred = true
          console.log('✅ Offered item transfer completed successfully!')
        } else if (!currentOfferedItem) {
          console.log('❌ Offered item not found in database')
        } else {
          console.log('⚠️ Offered item not transferred - current owner:', currentOfferedItem.currentOwnerId, 'expected:', proposer.id)
        }
      } catch (error) {
        console.error('❌ Error transferring offered item:', error)
      }
    } else {
      console.log('ℹ️ No offered item to transfer')
    }

    // Handle requested item transfer (from offer owner to proposer) - only in bilateral trades
    if (tradeDetails.offer.item && !isGift) {
      try {
        console.log('📦 Processing requested item transfer:', tradeDetails.offer.item.name)
        
        // Check if item is still owned by offer owner (hasn't been transferred yet)
        const currentRequestedItem = await prisma.items.findUnique({
          where: { id: tradeDetails.offer.item.id },
          select: { currentOwnerId: true, name: true, isAvailable: true }
        })
        
        console.log('👤 Requested item current state:', {
          itemId: tradeDetails.offer.item.id,
          currentOwner: currentRequestedItem?.currentOwnerId,
          expectedOwner: offerOwner.id,
          isAvailable: currentRequestedItem?.isAvailable,
          ownershipMatches: currentRequestedItem?.currentOwnerId === offerOwner.id
        })
        
        if (currentRequestedItem && currentRequestedItem.currentOwnerId === offerOwner.id) {
          console.log('✅ Transferring requested item from', offerOwner.firstName, 'to', proposer.firstName)
          
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
              city: proposer.lastCity || "Unknown City",
              country: proposer.lastCountry || "Unknown Country",
              transferMethod: "traded",
              receiverAvatarUrl: proposer.avatarUrl
            }
          })
          
          requestedItemTransferred = true
          console.log('✅ Requested item transfer completed successfully!')
        } else if (!currentRequestedItem) {
          console.log('❌ Requested item not found in database')
        } else {
          console.log('⚠️ Requested item not transferred - current owner:', currentRequestedItem.currentOwnerId, 'expected:', offerOwner.id)
        }
      } catch (error) {
        console.error('❌ Error transferring requested item:', error)
      }
    } else if (isGift) {
      console.log('ℹ️ Gift mode - no requested item to transfer')
    } else {
      console.log('ℹ️ No requested item to transfer')
    }

    // Mark the offer as completed
    await prisma.offers.update({
      where: { id: tradeDetails.offerId },
      data: { status: 'completed' }
    })

    // Create personalized system messages announcing the completed trade
    if (isGift) {
      // For gifts, create separate messages for giver and receiver
      // Gift receiver message (offer owner for asks)
      await prisma.messages.create({
        data: {
          content: `Gift completed! Both parties have reviewed each other. The gift has been transferred to your inventory.`,
          offerId: tradeDetails.offerId,
          proposedTradeId: proposedTradeId,
          senderId: null, // System message
          recipientId: offerOwner.id, // Only visible to gift receiver
        }
      })
      
      // Gift giver message (proposer for asks)
      await prisma.messages.create({
        data: {
          content: `Gift completed! Both parties have reviewed each other. The gift has been transferred to ${offerOwner.firstName}'s inventory.`,
          offerId: tradeDetails.offerId,
          proposedTradeId: proposedTradeId,
          senderId: null, // System message
          recipientId: proposer.id, // Only visible to gift giver
        }
      })
    } else {
      // For regular trades, keep the existing single message
      await prisma.messages.create({
        data: {
          content: `Trade completed! Both parties have reviewed each other. Items have been transferred to your inventories.`,
          offerId: tradeDetails.offerId,
          proposedTradeId: proposedTradeId,
          // No senderId for system messages
          // No recipientId for system messages
        }
      })
    }

    console.log('🎯 Trade completion summary:', {
      tradeId: proposedTradeId,
      offeredItemTransferred,
      requestedItemTransferred,
      isGift,
      totalItemsExpected: isGift ? 1 : (tradeDetails.offeredItem && tradeDetails.offer.item ? 2 : 1)
    })

    // Create error message if transfers failed
    if (tradeDetails.offeredItem && !offeredItemTransferred) {
      console.error('❌ Offered item transfer failed')
      await prisma.messages.create({
        data: {
          content: `Error: Offered item transfer failed. Please contact support.`,
          offerId: tradeDetails.offerId,
          proposedTradeId: proposedTradeId,
        }
      })
    }

    if (tradeDetails.offer.item && !isGift && !requestedItemTransferred) {
      console.error('❌ Requested item transfer failed')
      await prisma.messages.create({
        data: {
          content: `Error: Requested item transfer failed. Please contact support.`,
          offerId: tradeDetails.offerId,
          proposedTradeId: proposedTradeId,
        }
      })
    }

    console.log('✅ Trade completed successfully:', proposedTradeId)
  } catch (error) {
    console.error('❌ Error completing trade:', error)
    // Create error message
    await prisma.messages.create({
      data: {
        content: `Error completing trade automatically. Please contact support. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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