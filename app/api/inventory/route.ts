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
            transferMethod: true
          },
          orderBy: {
            transferDate: 'desc'
          }
        }
      },
      orderBy: {
        instanceCreatedAt: 'desc'
      }
    })

    console.log(`📦 Found ${items.length} items in inventory`)

    return NextResponse.json({
      items: items,
      count: items.length
    })

  } catch (error) {
    console.error("❌ Error fetching inventory:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    )
  }
}