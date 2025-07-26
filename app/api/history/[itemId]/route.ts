import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { itemId } = await context.params

    console.log("🔍 Fetching history for item:", itemId)

    // Fetch the item with full history
    const item = await prisma.items.findUnique({
      where: { id: itemId },
      include: {
        currentOwner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        history: {
          orderBy: {
            transferDate: 'desc'
          }
        }
      }
    })

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    console.log(`📜 Found item with ${item.history.length} history entries`)

    return NextResponse.json({
      item: {
        id: item.id,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        category: item.category,
        condition: item.condition,
        serialNumber: item.serialNumber,
        acquisitionMethod: item.acquisitionMethod,
        createdAt: item.createdAt,
        instanceCreatedAt: item.instanceCreatedAt,
        currentOwnerId: item.currentOwnerId,
        currentOwner: item.currentOwner,
        history: item.history
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