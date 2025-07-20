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

    // Get the latest message from each conversation (grouped by offer and proposed trade)
    const conversations = await prisma.$queryRaw`
      WITH ranked_messages AS (
        SELECT 
          m.*,
          ROW_NUMBER() OVER (
            PARTITION BY m.offer_id, COALESCE(m.proposed_trade_id::text, 'no_trade')
            ORDER BY m.created_at DESC
          ) as rn
        FROM messages m
        WHERE m.sender_id = ${session.user.id}::uuid 
           OR m.recipient_id = ${session.user.id}::uuid
      )
      SELECT 
        rm.id,
        rm.offer_id as "offerId",
        rm.sender_id as "senderId",
        rm.recipient_id as "recipientId",
        rm.proposed_trade_id as "proposedTradeId",
        rm.content,
        rm.is_read as "isRead",
        rm.created_at as "createdAt"
      FROM ranked_messages rm
      WHERE rm.rn = 1
      ORDER BY rm.created_at DESC
    `

    // Get additional data for each conversation
    const conversationIds = (conversations as any[]).map(c => c.id)
    
    const enrichedConversations = await prisma.messages.findMany({
      where: {
        id: {
          in: conversationIds
        }
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
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        },
        offer: {
          include: {
            item: true
          }
        },
        proposedTrade: {
          include: {
            offeredItem: true
          }
        }
      }
    })

    // Count unread messages for each conversation
    const unreadCounts = await prisma.messages.groupBy({
      by: ['offerId'],
      where: {
        recipientId: session.user.id,
        isRead: false
      },
      _count: true
    })

    const unreadMap = new Map(
      unreadCounts.map((c: any) => [c.offerId, c._count])
    )

    // Create a map to preserve the original chronological ordering
    const conversationOrderMap = new Map(
      (conversations as any[]).map((c, index) => [c.id, index])
    )

    const conversationsWithUnread = enrichedConversations
      .map((conv: any) => ({
        ...conv,
        unreadCount: unreadMap.get(conv.offerId) || 0
      }))
      .sort((a, b) => {
        // Sort by the original chronological order (most recent first)
        const orderA = conversationOrderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER
        const orderB = conversationOrderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER
        return orderA - orderB
      })

    return NextResponse.json({ conversations: conversationsWithUnread })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    )
  }
}