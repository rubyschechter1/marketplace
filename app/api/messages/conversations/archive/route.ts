import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Archive a conversation
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { offerId, proposedTradeId } = await req.json()
    
    if (!offerId) {
      return NextResponse.json({ error: "Offer ID is required" }, { status: 400 })
    }

    // Create archive entry for this user
    const archive = await prisma.conversationArchives.create({
      data: {
        userId: session.user.id,
        offerId,
        proposedTradeId: proposedTradeId || null
      }
    })

    return NextResponse.json({ 
      success: true, 
      archived: archive 
    })
  } catch (error: any) {
    console.error("Error archiving conversation:", error)
    
    // Handle unique constraint violation (already archived)
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        success: true, 
        message: "Conversation already archived" 
      })
    }
    
    return NextResponse.json(
      { error: "Failed to archive conversation" },
      { status: 500 }
    )
  }
}

// Check archive status for a conversation
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const offerId = searchParams.get('offerId')
    const proposedTradeId = searchParams.get('proposedTradeId')
    
    if (!offerId) {
      return NextResponse.json({ error: "Offer ID is required" }, { status: 400 })
    }

    // Check if either user has archived this conversation
    const archives = await prisma.conversationArchives.findMany({
      where: {
        offerId,
        proposedTradeId: proposedTradeId || null
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    const currentUserArchived = archives.some(a => a.userId === session.user.id)
    const otherUserArchived = archives.some(a => a.userId !== session.user.id)
    const isClosedForMessaging = archives.length > 0 // If anyone archived, it's closed

    return NextResponse.json({
      isArchivedByMe: currentUserArchived,
      isArchivedByOther: otherUserArchived,
      isClosedForMessaging,
      archivedBy: archives.map(a => ({
        userId: a.userId,
        userName: `${a.user.firstName} ${a.user.lastName}`,
        archivedAt: a.archivedAt
      }))
    })
  } catch (error) {
    console.error("Error checking archive status:", error)
    return NextResponse.json(
      { error: "Failed to check archive status" },
      { status: 500 }
    )
  }
}