import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ itemInstanceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemInstanceId } = await context.params

    console.log("🔍 Fetching history for item instance:", itemInstanceId)

    // Fetch the item instance with catalog info and full history
    const itemInstance = await prisma.itemInstances.findUnique({
      where: { id: itemInstanceId },
      include: {
        catalogItem: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            category: true,
            condition: true
          }
        },
        currentOwner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        originalOwner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        history: {
          include: {
            fromOwner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            },
            toOwner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            },
            trade: {
              select: {
                id: true,
                status: true
              }
            }
          },
          orderBy: {
            transferDate: 'desc'
          }
        }
      }
    })

    if (!itemInstance) {
      return NextResponse.json(
        { error: "Item instance not found" },
        { status: 404 }
      )
    }

    console.log(`📜 Found item instance with ${itemInstance.history.length} history entries`)

    // Filter out entries where privacy should be maintained
    // Only show location and date information, not user details unless it's current user
    const publicHistory = itemInstance.history.map(entry => ({
      id: entry.id,
      transferDate: entry.transferDate,
      city: entry.city,
      country: entry.country,
      transferMethod: entry.transferMethod,
      // Only show user details if current user is involved
      fromOwner: entry.fromOwner?.id === session.user.id ? entry.fromOwner : null,
      toOwner: entry.toOwner?.id === session.user.id ? entry.toOwner : null,
      trade: entry.trade
    }))

    return NextResponse.json({
      itemInstance: {
        id: itemInstance.id,
        serialNumber: itemInstance.serialNumber,
        acquisitionMethod: itemInstance.acquisitionMethod,
        createdAt: itemInstance.createdAt,
        currentOwnerId: itemInstance.currentOwnerId,
        catalogItem: itemInstance.catalogItem,
        currentOwner: itemInstance.currentOwner?.id === session.user.id ? itemInstance.currentOwner : null,
        originalOwner: itemInstance.originalOwner?.id === session.user.id ? itemInstance.originalOwner : null,
        history: publicHistory
      }
    })

  } catch (error) {
    console.error("❌ Error fetching item history:", error)
    return NextResponse.json(
      { error: "Failed to fetch item history" },
      { status: 500 }
    )
  }
}