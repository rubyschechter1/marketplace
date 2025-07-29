import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🎒 Fetching inventory for user:", session.user.id)

    // Fetch user's items where they are the current owner
    // Order by the most recent transfer date to show newest acquisitions first
    const items = await prisma.items.findMany({
      where: {
        currentOwnerId: session.user.id
      },
      include: {
        history: {
          select: {
            id: true,
            transferDate: true,
            city: true,
            country: true,
            transferMethod: true,
            toOwnerId: true
          },
          orderBy: {
            transferDate: 'desc'
          }
        }
      }
    })

    // Sort items by their most recent acquisition date (when current user got them)
    const sortedItems = items.sort((a, b) => {
      // Find the most recent transfer to the current user for each item
      const aLatestTransfer = a.history.find(h => h.toOwnerId === session.user.id)
      const bLatestTransfer = b.history.find(h => h.toOwnerId === session.user.id)
      
      const aDate = aLatestTransfer ? new Date(aLatestTransfer.transferDate) : new Date(a.instanceCreatedAt)
      const bDate = bLatestTransfer ? new Date(bLatestTransfer.transferDate) : new Date(b.instanceCreatedAt)
      
      console.log(`🔍 Sorting ${a.name} (${aDate.toISOString()}) vs ${b.name} (${bDate.toISOString()})`)
      
      return bDate.getTime() - aDate.getTime() // Most recent first (newer items have higher timestamps)
    })

    console.log(`📦 Found ${sortedItems.length} items in inventory`)
    console.log(`📋 Final order: ${sortedItems.map((item, index) => `${index + 1}. ${item.name}`).join(', ')}`)

    return NextResponse.json({
      items: sortedItems,
      count: sortedItems.length
    })

  } catch (error) {
    console.error("❌ Error fetching inventory:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    )
  }
}