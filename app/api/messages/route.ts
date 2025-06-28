import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { offerId, recipientId, content } = data

    if (!offerId || !recipientId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
        content
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}