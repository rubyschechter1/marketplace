import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  req: Request,
  { params }: { params: Promise<{ offerId: string; proposedTradeId: string }> }
) {
  const { offerId, proposedTradeId } = await params;
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Build where clause - now proposedTradeId is mandatory
    const whereClause = {
      offerId,
      proposedTradeId,
      OR: [
        { senderId: session.user.id },
        { recipientId: session.user.id },
        { AND: [
          { senderId: null },
          { recipientId: null }
        ]}
      ]
    }

    // Verify user has access to these messages
    const messages = await prisma.messages.findMany({
      where: whereClause,
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
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Mark messages as read if user is recipient - now includes proposedTradeId
    await prisma.messages.updateMany({
      where: {
        offerId,
        proposedTradeId,
        recipientId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    // Get offer details
    const offer = await prisma.offers.findUnique({
      where: { id: offerId },
      include: {
        item: true,
        traveler: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({ messages, offer })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}