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

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || undefined
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const offers = await prisma.offers.findMany({
      where: {
        travelerId: session.user.id,
        ...(status && { status })
      },
      include: {
        item: true,
        _count: {
          select: { 
            messages: true,
            proposedTrades: true 
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Transform to match expected format
    const transformedOffers = offers.map((offer: any) => ({
      ...offer,
      latitude: offer.latitude?.toNumber(),
      longitude: offer.longitude?.toNumber(),
    }))

    return NextResponse.json({ offers: transformedOffers })
  } catch (error) {
    console.error("Error fetching user offers:", error)
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    )
  }
}