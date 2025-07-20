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

    return NextResponse.json(proposedTrade)
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

    if (!status || !['accepted', 'pending', 'rejected', 'withdrawn'].includes(status)) {
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
        systemMessageContent = 'Trade accepted'
      } else if (status === 'pending' && proposedTrade.status === 'accepted') {
        systemMessageContent = 'Trade unaccepted'
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

      // If accepting a trade, create system messages for other trades
      if (status === 'accepted') {
        // Find all other pending trades for this offer
        const otherTrades = await tx.proposedTrades.findMany({
          where: {
            offerId: proposedTrade.offerId,
            id: { not: proposedTrade.id },
            status: 'pending'
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
              content: 'Another trade was accepted for this offer'
            }
          })
        }
      }

      return updatedTrade
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
    return NextResponse.json(
      { error: "Failed to update proposed trade" },
      { status: 500 }
    )
  }
}