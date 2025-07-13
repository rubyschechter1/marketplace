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
    const { offerId, offeredItemId } = body

    if (!offerId || !offeredItemId) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Verify the offered item exists and belongs to the current user
    const offeredItem = await prisma.items.findUnique({
      where: { id: offeredItemId }
    })

    if (!offeredItem || offeredItem.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: "Invalid offered item" },
        { status: 400 }
      )
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
    const proposedTrade = await prisma.proposedTrades.create({
      data: {
        offer: {
          connect: { id: offerId }
        },
        proposer: {
          connect: { id: session.user.id }
        },
        offeredItem: {
          connect: { id: offeredItemId }
        }
      },
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

    // Send email notification to offer owner
    if (process.env.RESEND_API_KEY && proposedTrade.offer.traveler?.email) {
      try {
        const proposalLink = `${process.env.NEXTAUTH_URL}/offers/${offerId}`;
        
        await resend.emails.send({
          from: FROM_EMAIL,
          to: proposedTrade.offer.traveler.email,
          subject: `${proposedTrade.proposer.firstName} wants to trade with you!`,
          html: await render(
            React.createElement(TradeProposalEmail, {
              recipientName: proposedTrade.offer.traveler.firstName,
              proposerName: proposedTrade.proposer.firstName,
              offerTitle: proposedTrade.offer.title,
              offeredItemName: proposedTrade.offeredItem.name,
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