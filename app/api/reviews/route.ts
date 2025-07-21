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
    if (proposedTrade.status !== 'accepted') {
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

    // Create a system message to show the review was submitted
    const reviewMessage = existingReview
      ? `${reviewer?.firstName || 'User'} updated their review`
      : `${reviewer?.firstName || 'User'} submitted a review`
    
    await prisma.messages.create({
      data: {
        content: reviewMessage,
        offerId: proposedTrade.offerId,
        proposedTradeId: proposedTradeId,
        // No senderId for system messages
        // No recipientId for system messages
      }
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error("Error creating/updating review:", error)
    return NextResponse.json(
      { error: "Failed to save review" },
      { status: 500 }
    )
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