import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get unique conversations with unread messages
    const unreadConversations = await prisma.messages.findMany({
      where: {
        recipientId: session.user.id,
        isRead: false
      },
      select: {
        proposedTradeId: true,
        offerId: true
      },
      distinct: ['proposedTradeId', 'offerId']
    })

    const unreadCount = unreadConversations.length

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error("Error fetching unread conversations:", error)
    return NextResponse.json(
      { error: "Failed to fetch unread conversations" },
      { status: 500 }
    )
  }
}