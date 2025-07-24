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

    // Show all reviews to anyone viewing the profile
    const visibleReviews = reviews

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