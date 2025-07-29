import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { resend, FROM_EMAIL } from "@/lib/email/resend"
import { TradeProposalEmail } from "@/emails/trade-proposal"
import { render } from '@react-email/render'
import * as React from 'react'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const offerId = searchParams.get('offerId')
    const userId = searchParams.get('userId')

    if (!offerId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Find the proposed trade for this offer and user
    const proposedTrade = await prisma.proposedTrades.findFirst({
      where: {
        offerId: offerId,
        proposerId: userId
      }
    })

    return NextResponse.json({ proposedTrade })
  } catch (error) {
    console.error("Error fetching proposed trade:", error)
    return NextResponse.json(
      { error: "Failed to fetch proposed trade" },
      { status: 500 }
    )
  }
}

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
    const { offerId, offeredItemId, isRequest } = body

    if (!offerId) {
      return NextResponse.json(
        { error: "Missing required field: offerId" },
        { status: 400 }
      )
    }

    // For regular trades, offeredItemId is required. For requests, it's null
    if (!isRequest && !offeredItemId) {
      return NextResponse.json(
        { error: "Missing required field: offeredItemId for trade proposals" },
        { status: 400 }
      )
    }

    // Verify the offer exists and get its details
    const offer = await prisma.offers.findUnique({
      where: { id: offerId },
      include: {
        traveler: true
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404 }
      )
    }

    // Prevent users from proposing trades on their own offers
    if (offer.travelerId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot propose trade on your own offer" },
        { status: 400 }
      )
    }

    // For regular trades, verify the offered item exists and belongs to the current user
    let offeredItem = null
    if (!isRequest && offeredItemId) {
      offeredItem = await prisma.items.findUnique({
        where: { id: offeredItemId }
      })

      if (!offeredItem) {
        return NextResponse.json(
          { error: "Item not found" },
          { status: 404 }
        )
      }

      if (offeredItem.currentOwnerId !== session.user.id) {
        return NextResponse.json(
          { error: "You don't own this item" },
          { status: 403 }
        )
      }

      if (!offeredItem.isAvailable) {
        // Check if item is already being offered
        const existingOffer = await prisma.offers.findFirst({
          where: {
            itemId: offeredItemId,
            status: 'active'
          }
        })

        if (existingOffer) {
          return NextResponse.json(
            { error: "This item is already being offered in another listing. You can only offer each item once at a time." },
            { status: 400 }
          )
        } else {
          // Item is marked unavailable but no active offer exists - this is a data inconsistency
          console.log(`🔧 Fixing availability for orphaned item during trade proposal: ${offeredItemId}`)
          await prisma.items.update({
            where: { id: offeredItemId },
            data: { isAvailable: true }
          })
          
          // Continue with the trade proposal since we fixed the issue
        }
      }

      // Mark the item as not available during the trade proposal
      await prisma.items.update({
        where: { id: offeredItemId },
        data: { isAvailable: false }
      })
    }

    // Check if the user has already proposed a trade for this offer
    const existingTrade = await prisma.proposedTrades.findFirst({
      where: {
        offerId: offerId,
        proposerId: session.user.id
      }
    })

    if (existingTrade) {
      return NextResponse.json(
        { error: "You have already proposed a trade for this offer" },
        { status: 400 }
      )
    }

    // Create the proposed trade
    const createData: any = {
      offer: {
        connect: { id: offerId }
      },
      proposer: {
        connect: { id: session.user.id }
      },
      // Set gift mode for requests
      isGiftMode: isRequest || false
    }

    // Only connect offered item if this is not a request
    if (!isRequest && offeredItemId) {
      createData.offeredItem = {
        connect: { id: offeredItemId }
      }
    }

    const proposedTrade = await prisma.proposedTrades.create({
      data: createData,
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

    // Create an initial message for this trade proposal or request
    try {
      if (proposedTrade.offer.traveler) {
        const requestedItemName = proposedTrade.offer.item?.name || proposedTrade.offer.title
        let messageContent: string

        if (isRequest) {
          messageContent = `Hi! I'd love to have your ${requestedItemName}. Would you be willing to gift it to me?`
        } else {
          const offeredItemName = proposedTrade.offeredItem?.name || "item"
          messageContent = `Hi! I'd like to trade my ${offeredItemName} for your ${requestedItemName}.`
        }

        await prisma.messages.create({
          data: {
            offerId: offerId,
            senderId: session.user.id,
            recipientId: proposedTrade.offer.traveler.id,
            proposedTradeId: proposedTrade.id,
            content: messageContent
          }
        })
      }
    } catch (messageError) {
      console.error('Failed to create initial message:', messageError);
      // Don't fail the request if message creation fails
    }

    // Send email notification to offer owner
    if (process.env.RESEND_API_KEY && proposedTrade.offer.traveler?.email) {
      try {
        const proposalLink = `${process.env.NEXTAUTH_URL}/offers/${offerId}`;
        const subject = isRequest 
          ? `BSH: ${proposedTrade.proposer.firstName} would like your ${proposedTrade.offer.title}!`
          : `BSH: ${proposedTrade.proposer.firstName} wants to trade with you!`
        
        const offeredItemName = proposedTrade.offeredItem?.name || (isRequest ? "gift request" : "item")
        
        await resend.emails.send({
          from: FROM_EMAIL,
          to: proposedTrade.offer.traveler.email,
          subject: subject,
          html: await render(
            React.createElement(TradeProposalEmail, {
              recipientName: proposedTrade.offer.traveler.firstName,
              proposerName: proposedTrade.proposer.firstName,
              offerTitle: proposedTrade.offer.title,
              offeredItemName: offeredItemName,
              proposalLink,
            })
          ),
        });
      } catch (emailError) {
        console.error('Failed to send trade proposal email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ proposedTrade })
  } catch (error) {
    console.error("Error creating proposed trade:", error)
    return NextResponse.json(
      { error: "Failed to create proposed trade" },
      { status: 500 }
    )
  }
}