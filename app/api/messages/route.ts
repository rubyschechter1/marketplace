import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { resend, FROM_EMAIL } from "@/lib/email/resend"
import { NewMessageEmail } from "@/emails/new-message"
import { render } from '@react-email/render'
import * as React from 'react'
import { analyzeConversationForExchangeDate, saveExchangeDate } from "@/lib/ai/date-extraction"
import { validateNoCurrency } from "@/lib/currencyFilter"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { offerId, recipientId, content, proposedTradeId } = data

    if (!offerId || !recipientId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate message content for currency references and inappropriate content
    const contentValidation = validateNoCurrency(content, "Message content", "message")
    if (!contentValidation.isValid) {
      return NextResponse.json(
        { error: contentValidation.error },
        { status: 400 }
      )
    }

    // Verify offer exists and user is either owner or messaging the owner
    const offer = await prisma.offers.findUnique({
      where: { id: offerId },
      include: { traveler: true }
    })

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    // Ensure user is not messaging themselves
    if (recipientId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot send message to yourself" },
        { status: 400 }
      )
    }

    // Ensure recipient is involved with the offer
    if (recipientId !== offer.travelerId && session.user.id !== offer.travelerId) {
      return NextResponse.json(
        { error: "Invalid recipient for this offer" },
        { status: 400 }
      )
    }

    const message = await prisma.messages.create({
      data: {
        offerId,
        senderId: session.user.id,
        recipientId,
        content,
        proposedTradeId
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        },
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true
          }
        },
        offer: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Send email notification to recipient
    if (process.env.RESEND_API_KEY && message.recipient?.email) {
      try {
        // Truncate message for preview (max 150 chars)
        const messagePreview = content.length > 150 
          ? content.substring(0, 147) + '...' 
          : content;
        
        const conversationLink = `${process.env.NEXTAUTH_URL}/messages/${offerId}/${proposedTradeId || 'direct'}`;
        
        await resend.emails.send({
          from: FROM_EMAIL,
          to: message.recipient.email,
          subject: `BSH: New message from ${message.sender?.firstName || 'User'}`,
          html: await render(
            React.createElement(NewMessageEmail, {
              recipientName: message.recipient.firstName,
              senderName: message.sender?.firstName || 'User',
              messagePreview,
              offerTitle: message.offer?.title || 'Offer',
              conversationLink,
            })
          ),
        });
      } catch (emailError) {
        console.error('Failed to send message notification email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // If message is for an accepted trade, check if we should re-analyze for exchange date
    if (proposedTradeId) {
      const proposedTrade = await prisma.proposedTrades.findUnique({
        where: { id: proposedTradeId },
        include: { exchangeDate: true }
      })

      if (proposedTrade?.status === 'accepted' && !proposedTrade.exchangeDate) {
        // Re-analyze conversation asynchronously
        analyzeConversationForExchangeDate(proposedTradeId)
          .then(result => saveExchangeDate(proposedTradeId, result))
          .catch(error => console.error('Error re-analyzing exchange date:', error))
      }
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}