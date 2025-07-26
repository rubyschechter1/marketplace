import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { resend, FROM_EMAIL } from "@/lib/email/resend"
import { TradeStatusEmail } from "@/emails/trade-status"
import { render } from '@react-email/render'
import * as React from 'react'
import { analyzeConversationForExchangeDate, saveExchangeDate } from "@/lib/ai/date-extraction"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await context.params

    const proposedTrade = await prisma.proposedTrades.findUnique({
      where: { id },
      include: {
        proposer: true,
        offeredItem: true,
        offer: {
          include: {
            traveler: true,
            item: true
          }
        },
        reviews: {
          select: {
            id: true,
            reviewerId: true,
            revieweeId: true,
            rating: true,
            content: true,
            createdAt: true,
            isEdited: true
          }
        }
      }
    })

    if (!proposedTrade) {
      return NextResponse.json(
        { error: "Proposed trade not found" },
        { status: 404 }
      )
    }

    // Ensure the user is either the proposer or the offer owner
    if (
      proposedTrade.proposerId !== session.user.id &&
      proposedTrade.offer.travelerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Hide reviews until both parties have reviewed (Airbnb-style)
    let visibleReviews = proposedTrade.reviews || []
    if (visibleReviews.length < 2) {
      // Less than 2 reviews means not both parties have reviewed yet
      visibleReviews = []
    }

    return NextResponse.json({
      ...proposedTrade,
      reviews: visibleReviews
    })
  } catch (error) {
    console.error("Error fetching proposed trade:", error)
    return NextResponse.json(
      { error: "Failed to fetch proposed trade" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const { status } = body

    if (!status || !['accepted', 'pending', 'rejected', 'withdrawn', 'unavailable'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    // Fetch the proposed trade with all necessary relations
    const proposedTrade = await prisma.proposedTrades.findUnique({
      where: { id },
      include: {
        proposer: true,
        offeredItem: true,
        offer: {
          include: {
            traveler: true,
            item: true
          }
        }
      }
    })

    if (!proposedTrade) {
      return NextResponse.json(
        { error: "Proposed trade not found" },
        { status: 404 }
      )
    }

    // Check authorization based on action
    const isOfferOwner = proposedTrade.offer.travelerId === session.user.id
    const isProposer = proposedTrade.proposerId === session.user.id

    // Only offer owner can accept/reject
    if ((status === 'accepted' || status === 'rejected') && !isOfferOwner) {
      return NextResponse.json(
        { error: "Only the offer owner can accept or reject trades" },
        { status: 403 }
      )
    }

    // For accepting trades, we'll do the check inside the transaction to prevent race conditions

    // Only proposer can withdraw
    if (status === 'withdrawn' && !isProposer) {
      return NextResponse.json(
        { error: "Only the proposer can withdraw a trade" },
        { status: 403 }
      )
    }

    // Only offer owner can unaccept (change from accepted back to pending)
    if (status === 'pending' && proposedTrade.status === 'accepted' && !isOfferOwner) {
      return NextResponse.json(
        { error: "Only the offer owner can unaccept a trade" },
        { status: 403 }
      )
    }

    // Start a transaction to update the trade and create system messages
    const result = await prisma.$transaction(async (tx) => {
      // If accepting a trade, check for existing accepted trades within the transaction
      if (status === 'accepted') {
        const existingAcceptedTrade = await tx.proposedTrades.findFirst({
          where: {
            offerId: proposedTrade.offerId,
            status: 'accepted',
            id: { not: proposedTrade.id }
          }
        })
        
        if (existingAcceptedTrade) {
          throw new Error("Another trade has already been accepted for this offer")
        }
      }

      // Update the proposed trade status
      const updatedTrade = await tx.proposedTrades.update({
        where: { id },
        data: { 
          status,
          updatedAt: new Date()
        }
      })

      // Create system message for this trade's conversation
      let systemMessageContent = ''
      if (status === 'accepted') {
        systemMessageContent = `TRADE_ACCEPTED:${session.user.id}:${session.user.name || 'Someone'}`
      } else if (status === 'pending' && proposedTrade.status === 'accepted') {
        systemMessageContent = `TRADE_CANCELED:${session.user.id}:${session.user.name || 'Someone'}`
      } else if (status === 'rejected') {
        systemMessageContent = 'Trade rejected'
      } else if (status === 'withdrawn') {
        systemMessageContent = 'Trade withdrawn'
      }

      if (systemMessageContent) {
        await tx.messages.create({
          data: {
            offerId: proposedTrade.offerId,
            proposedTradeId: proposedTrade.id,
            senderId: null, // System message
            recipientId: null,
            content: systemMessageContent
          }
        })
      }

      // If accepting a trade, reject other pending trades (but don't transfer items yet)
      if (status === 'accepted') {
        // Find all other pending trades for this offer
        const otherTrades = await tx.proposedTrades.findMany({
          where: {
            offerId: proposedTrade.offerId,
            id: { not: proposedTrade.id },
            status: 'pending'
          }
        })

        // Update all other pending trades to 'unavailable' status
        await tx.proposedTrades.updateMany({
          where: {
            offerId: proposedTrade.offerId,
            id: { not: proposedTrade.id },
            status: 'pending'
          },
          data: {
            status: 'unavailable',
            updatedAt: new Date()
          }
        })

        // Create system messages for each other trade
        for (const otherTrade of otherTrades) {
          await tx.messages.create({
            data: {
              offerId: proposedTrade.offerId,
              proposedTradeId: otherTrade.id,
              senderId: null, // System message
              recipientId: null,
              content: 'This item is no longer available - another trade was accepted'
            }
          })
        }
        
        // Note: Item transfers now happen when both parties complete their reviews
        // This ensures the "Send item" button workflow is properly followed
      }

      // If unaccepting a trade (changing from accepted back to pending), make other trades available again
      if (status === 'pending' && proposedTrade.status === 'accepted') {
        // Find all unavailable trades for this offer
        const unavailableTrades = await tx.proposedTrades.findMany({
          where: {
            offerId: proposedTrade.offerId,
            id: { not: proposedTrade.id },
            status: 'unavailable'
          }
        })

        // Update all unavailable trades back to 'pending' status
        await tx.proposedTrades.updateMany({
          where: {
            offerId: proposedTrade.offerId,
            id: { not: proposedTrade.id },
            status: 'unavailable'
          },
          data: {
            status: 'pending',
            updatedAt: new Date()
          }
        })

        // Create system messages for each restored trade
        for (const unavailableTrade of unavailableTrades) {
          await tx.messages.create({
            data: {
              offerId: proposedTrade.offerId,
              proposedTradeId: unavailableTrade.id,
              senderId: null, // System message
              recipientId: null,
              content: 'This item is available again - the previous trade was cancelled'
            }
          })
        }
      }

      return updatedTrade
    }, {
      isolationLevel: 'Serializable', // Highest isolation level to prevent race conditions
    })

    // If trade was accepted, analyze conversation for exchange date
    if (status === 'accepted') {
      // Run this asynchronously to not block the response
      analyzeConversationForExchangeDate(proposedTrade.id)
        .then(result => saveExchangeDate(proposedTrade.id, result))
        .catch(error => console.error('Error analyzing exchange date:', error))
    }

    // Fetch the updated trade with all relations
    const updatedProposedTrade = await prisma.proposedTrades.findUnique({
      where: { id },
      include: {
        proposer: true,
        offeredItem: true,
        offer: {
          include: {
            traveler: true,
            item: true
          }
        }
      }
    })

    // Send email notification for accepted/rejected trades
    if (process.env.RESEND_API_KEY && 
        (status === 'accepted' || status === 'rejected') && 
        updatedProposedTrade?.proposer?.email) {
      try {
        const conversationLink = status === 'accepted' 
          ? `${process.env.NEXTAUTH_URL}/messages/${proposedTrade.offerId}/${proposedTrade.id}`
          : undefined;
        
        await resend.emails.send({
          from: FROM_EMAIL,
          to: updatedProposedTrade.proposer.email,
          subject: `BSH: Your trade proposal was ${status}`,
          html: await render(
            React.createElement(TradeStatusEmail, {
              recipientName: updatedProposedTrade.proposer.firstName,
              offerOwnerName: updatedProposedTrade.offer.traveler?.firstName || 'User',
              offerTitle: updatedProposedTrade.offer.title,
              status: status === 'rejected' ? 'declined' : 'accepted',
              conversationLink,
            })
          ),
        });
      } catch (emailError) {
        console.error('Failed to send trade status email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(updatedProposedTrade)
  } catch (error) {
    console.error("Error updating proposed trade:", error)
    
    // Handle specific error for duplicate accepted trades
    if (error instanceof Error && error.message === "Another trade has already been accepted for this offer") {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to update proposed trade" },
      { status: 500 }
    )
  }
}