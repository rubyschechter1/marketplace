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

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const after = searchParams.get('after') // ISO timestamp to get messages after

    // Build where clause - now proposedTradeId is mandatory
    const whereClause: any = {
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

    // Add timestamp filter if provided
    if (after) {
      whereClause.createdAt = {
        gt: new Date(after)
      }
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ offerId: string; proposedTradeId: string }> }
) {
  const { offerId, proposedTradeId } = await params;
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { messageId } = body

    if (!messageId) {
      return NextResponse.json({ error: "Message ID required" }, { status: 400 })
    }

    // Find the message and verify ownership
    const message = await prisma.messages.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Verify the message belongs to the correct conversation
    if (message.offerId !== offerId || message.proposedTradeId !== proposedTradeId) {
      return NextResponse.json({ error: "Message not found in this conversation" }, { status: 404 })
    }

    // Only allow users to delete their own messages
    if (message.senderId !== session.user.id) {
      return NextResponse.json({ error: "Can only delete your own messages" }, { status: 403 })
    }

    // Delete the message
    await prisma.messages.delete({
      where: { id: messageId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting message:", error)
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    )
  }
}