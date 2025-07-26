import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Get all reviews for the user
    const reviews = await prisma.reviews.findMany({
      where: { revieweeId: id },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        },
        proposedTrade: {
          include: {
            offer: {
              select: {
                id: true,
                title: true,
                type: true
              }
            },
            offeredItem: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Only show reviews where both parties have completed their reviews (Airbnb-style)
    const visibleReviews = []
    
    for (const review of reviews) {
      // Count total reviews for this trade
      const tradeReviewCount = await prisma.reviews.count({
        where: { proposedTradeId: review.proposedTradeId }
      })
      
      // Only include review if both parties have reviewed (2 reviews for the trade)
      if (tradeReviewCount === 2) {
        visibleReviews.push(review)
      }
    }

    // Get user's reputation score
    const reputationScore = await prisma.userReputationScores.findUnique({
      where: { userId: id }
    })

    return NextResponse.json({
      reviews: visibleReviews,
      reputationScore: reputationScore || {
        totalReviews: 0,
        averageRating: 0,
        credibilityScore: 1
      }
    })
  } catch (error) {
    console.error("Error fetching user reviews:", error)
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}