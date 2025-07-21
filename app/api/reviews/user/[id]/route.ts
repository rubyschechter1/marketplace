import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)
    const viewerId = session?.user?.id

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

    // Filter reviews based on Airbnb-style mutual review visibility
    let visibleReviews = reviews
    if (viewerId && viewerId !== id) {
      // Only show reviews where the viewer has also reviewed the same trade
      const viewerReviews = await prisma.reviews.findMany({
        where: { reviewerId: viewerId },
        select: { proposedTradeId: true }
      })
      const viewerTradeIds = new Set(viewerReviews.map(r => r.proposedTradeId))
      
      visibleReviews = reviews.filter(review => 
        viewerTradeIds.has(review.proposedTradeId)
      )
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