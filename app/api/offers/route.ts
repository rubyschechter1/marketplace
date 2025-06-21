import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const SEARCH_RADIUS_KM = 10

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get("lat") || "0")
    const lng = parseFloat(searchParams.get("lng") || "0")
    const status = searchParams.get("status") || "active"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Calculate bounding box for nearby search
    // Rough approximation: 1 degree latitude = 111km
    const latDelta = SEARCH_RADIUS_KM / 111
    const lngDelta = SEARCH_RADIUS_KM / (111 * Math.cos(lat * Math.PI / 180))

    const offers = await prisma.offer.findMany({
      where: {
        status,
        latitude: {
          gte: lat - latDelta,
          lte: lat + latDelta
        },
        longitude: {
          gte: lng - lngDelta,
          lte: lng + lngDelta
        }
      },
      include: {
        item: true,
        traveler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    return NextResponse.json({ offers })
  } catch (error) {
    console.error("Error fetching offers:", error)
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { itemId, title, description, latitude, longitude, locationName } = data

    if (!itemId || !title || latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify item belongs to user
    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        createdBy: session.user.id
      }
    })

    if (!item) {
      return NextResponse.json(
        { error: "Item not found or unauthorized" },
        { status: 404 }
      )
    }

    const offer = await prisma.offer.create({
      data: {
        travelerId: session.user.id,
        itemId,
        title,
        description,
        latitude,
        longitude,
        locationName
      },
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

    return NextResponse.json({ offer })
  } catch (error) {
    console.error("Error creating offer:", error)
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 }
    )
  }
}