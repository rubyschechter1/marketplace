import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { geocodeCoordinates } from "@/lib/location-utils"
import { transformOffersWithLocation } from "@/lib/prisma-transforms"
import { validateContent, validateMultipleFields } from "@/lib/contentValidation"

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

    // Validate all content fields at once
    const fieldsToValidate = []
    
    if (title) {
      fieldsToValidate.push({ text: title, fieldName: "Title", context: "offer" as const })
    }
    
    if (description) {
      fieldsToValidate.push({ text: description, fieldName: "Description", context: "offer" as const })
    }
    
    if (askDescription) {
      fieldsToValidate.push({ text: askDescription, fieldName: "Ask description", context: "offer" as const })
    }
    
    // Add lookingFor items to validation
    if (lookingFor && Array.isArray(lookingFor)) {
      lookingFor.forEach((item, index) => {
        if (item && typeof item === 'string') {
          fieldsToValidate.push({ text: item, fieldName: `Looking for item ${index + 1}`, context: "offer" as const })
        }
      })
    }
    
    // Validate all fields
    if (fieldsToValidate.length > 0) {
      const validation = await validateMultipleFields(fieldsToValidate)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }
    }

    // Validation based on type
    if (type === "offer") {
      if (!title || latitude == null || longitude == null) {
        return NextResponse.json(
          { error: "Missing required fields for offer" },
          { status: 400 }
        )
      }

      // Must have itemId
      if (!itemId) {
        return NextResponse.json(
          { error: "Must provide itemId" },
          { status: 400 }
        )
      }

      // Verify item belongs to user and is available
      const item = await prisma.items.findFirst({
        where: {
          id: itemId,
          currentOwnerId: session.user.id,
          isAvailable: true
        }
      })

      if (!item) {
        return NextResponse.json(
          { error: "Item not found, unauthorized, or not available" },
          { status: 404 }
        )
      }

      // Mark item as not available (being offered)
      await prisma.items.update({
        where: { id: itemId },
        data: { isAvailable: false }
      })
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