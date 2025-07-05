import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { geocodeCoordinates } from "@/lib/location-utils"
import { transformOffersWithLocation } from "@/lib/prisma-transforms"

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
    const type = searchParams.get("type") // 'offer', 'ask', or null for all
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Calculate bounding box for nearby search
    // Rough approximation: 1 degree latitude = 111km
    const latDelta = SEARCH_RADIUS_KM / 111
    const lngDelta = SEARCH_RADIUS_KM / (111 * Math.cos(lat * Math.PI / 180))

    // If lat and lng are both 0, skip distance filtering
    const whereClause: any = { 
      status,
      NOT: {
        travelerId: session.user.id
      }
    }
    
    // Add type filter if specified
    if (type) {
      whereClause.type = type
    }
    
    if (lat !== 0 || lng !== 0) {
      whereClause.latitude = {
        gte: lat - latDelta,
        lte: lat + latDelta
      }
      whereClause.longitude = {
        gte: lng - lngDelta,
        lte: lng + lngDelta
      }
    }

    const offers = await prisma.offers.findMany({
      where: whereClause,
      include: {
        item: true,
        traveler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        },
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

    // Transform offers with location privacy and distance calculation
    const transformedOffers = transformOffersWithLocation(
      offers,
      lat !== 0 ? lat : undefined,
      lng !== 0 ? lng : undefined,
      session.user.id
    )

    return NextResponse.json({ offers: transformedOffers })
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
    const { type = "offer", itemId, title, description, askDescription, lookingFor, latitude, longitude, locationName } = data

    // Validation based on type
    if (type === "offer") {
      if (!itemId || !title || latitude == null || longitude == null) {
        return NextResponse.json(
          { error: "Missing required fields for offer" },
          { status: 400 }
        )
      }

      // Verify item belongs to user
      const item = await prisma.items.findFirst({
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
    } else if (type === "ask") {
      if (!title || !askDescription || latitude == null || longitude == null) {
        return NextResponse.json(
          { error: "Missing required fields for ask" },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "Invalid type. Must be 'offer' or 'ask'" },
        { status: 400 }
      )
    }

    // Geocode the coordinates to get city and country
    const geocodeResult = await geocodeCoordinates(latitude, longitude)

    // Build create data based on type
    const createData: any = {
      traveler: {
        connect: { id: session.user.id }
      },
      type,
      title,
      description,
      lookingFor: lookingFor || [],
      latitude,
      longitude,
      locationName,
      city: geocodeResult.city,
      country: geocodeResult.country,
      displayLocation: geocodeResult.displayLocation
    }

    // Add type-specific fields
    if (type === "offer") {
      createData.item = {
        connect: { id: itemId }
      }
    } else if (type === "ask") {
      createData.askDescription = askDescription
    }

    const offer = await prisma.offers.create({
      data: createData,
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