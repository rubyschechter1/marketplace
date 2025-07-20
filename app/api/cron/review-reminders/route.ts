import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verify this is being called by Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Find all trades that need review reminders
    const tradesNeedingReviews = await prisma.tradeExchangeDates.findMany({
      where: {
        extractedDate: {
          lte: new Date() // Exchange date has passed
        },
        isReviewRequestSent: false,
        proposedTrade: {
          status: 'accepted'
        }
      },
      include: {
        proposedTrade: {
          include: {
            offer: {
              include: {
                traveler: true
              }
            },
            proposer: true
          }
        }
      }
    })

    // Send review request messages
    const results = []
    for (const tradeDate of tradesNeedingReviews) {
      const trade = tradeDate.proposedTrade
      
      // Create review request messages for both parties
      const messages = []
      
      // Message to proposer
      messages.push({
        offerId: trade.offerId,
        proposedTradeId: trade.id,
        senderId: null, // System message
        recipientId: trade.proposerId,
        content: `How did your exchange with ${trade.offer.traveler?.firstName} go? Please rate your experience.`
      })
      
      // Message to offer owner
      messages.push({
        offerId: trade.offerId,
        proposedTradeId: trade.id,
        senderId: null, // System message
        recipientId: trade.offer.travelerId,
        content: `How did your exchange with ${trade.proposer.firstName} go? Please rate your experience.`
      })

      // Create messages in database
      await prisma.messages.createMany({ data: messages })

      // Update trade exchange date to mark review request as sent
      await prisma.tradeExchangeDates.update({
        where: { id: tradeDate.id },
        data: {
          isReviewRequestSent: true,
          reviewRequestSentAt: new Date()
        }
      })

      results.push({
        tradeId: trade.id,
        messagesCreated: messages.length
      })
    }

    // Check for follow-up reminders (48 hours after first request)
    const followUpCutoff = new Date()
    followUpCutoff.setHours(followUpCutoff.getHours() - 48)

    const tradesNeedingFollowUp = await prisma.tradeExchangeDates.findMany({
      where: {
        isReviewRequestSent: true,
        reviewRequestSentAt: {
          lte: followUpCutoff
        },
        proposedTrade: {
          status: 'accepted',
          reviews: {
            none: {} // No reviews exist yet
          }
        }
      },
      include: {
        proposedTrade: {
          include: {
            offer: {
              include: {
                traveler: true
              }
            },
            proposer: true,
            reviews: true
          }
        }
      }
    })

    // Send follow-up reminders
    for (const tradeDate of tradesNeedingFollowUp) {
      const trade = tradeDate.proposedTrade
      
      // Check which party hasn't reviewed yet
      const proposerReviewed = trade.reviews.some(r => r.reviewerId === trade.proposerId)
      const offerOwnerReviewed = trade.reviews.some(r => r.reviewerId === trade.offer.travelerId)
      
      const messages = []
      
      if (!proposerReviewed) {
        messages.push({
          offerId: trade.offerId,
          proposedTradeId: trade.id,
          senderId: null,
          recipientId: trade.proposerId,
          content: `Reminder: Please rate your exchange with ${trade.offer.traveler?.firstName}. Your feedback helps build trust in our community.`
        })
      }
      
      if (!offerOwnerReviewed) {
        messages.push({
          offerId: trade.offerId,
          proposedTradeId: trade.id,
          senderId: null,
          recipientId: trade.offer.travelerId,
          content: `Reminder: Please rate your exchange with ${trade.proposer.firstName}. Your feedback helps build trust in our community.`
        })
      }

      if (messages.length > 0) {
        await prisma.messages.createMany({ data: messages })
        results.push({
          tradeId: trade.id,
          followUpMessagesCreated: messages.length
        })
      }
    }

    return NextResponse.json({
      success: true,
      initialReminders: tradesNeedingReviews.length,
      followUpReminders: tradesNeedingFollowUp.length,
      results
    })
  } catch (error) {
    console.error("Error in review reminders cron job:", error)
    return NextResponse.json(
      { error: "Failed to process review reminders" },
      { status: 500 }
    )
  }
}