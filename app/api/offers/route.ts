import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { geocodeCoordinates } from "@/lib/location-utils"
import { transformOffersWithLocation } from "@/lib/prisma-transforms"
import { validateNoCurrency } from "@/lib/currencyFilter"

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
        itemInstance: {
          include: {
            catalogItem: true
          }
        },
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
    const { type = "offer", itemId, itemInstanceId, title, description, askDescription, lookingFor, latitude, longitude, locationName } = data

    // Validate content for currency references
    if (title) {
      const titleValidation = validateNoCurrency(title, "Title")
      if (!titleValidation.isValid) {
        return NextResponse.json(
          { error: titleValidation.error },
          { status: 400 }
        )
      }
    }

    if (description) {
      const descValidation = validateNoCurrency(description, "Description")
      if (!descValidation.isValid) {
        return NextResponse.json(
          { error: descValidation.error },
          { status: 400 }
        )
      }
    }

    if (askDescription) {
      const askDescValidation = validateNoCurrency(askDescription, "Ask description")
      if (!askDescValidation.isValid) {
        return NextResponse.json(
          { error: askDescValidation.error },
          { status: 400 }
        )
      }
    }

    // Validate lookingFor items
    if (lookingFor && Array.isArray(lookingFor)) {
      for (let i = 0; i < lookingFor.length; i++) {
        const item = lookingFor[i]
        if (item && typeof item === 'string') {
          const itemValidation = validateNoCurrency(item, `Looking for item ${i + 1}`)
          if (!itemValidation.isValid) {
            return NextResponse.json(
              { error: itemValidation.error },
              { status: 400 }
            )
          }
        }
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

      // Must have either itemId (new item) or itemInstanceId (inventory item)
      if (!itemId && !itemInstanceId) {
        return NextResponse.json(
          { error: "Must provide either itemId or itemInstanceId" },
          { status: 400 }
        )
      }

      if (itemId && itemInstanceId) {
        return NextResponse.json(
          { error: "Cannot provide both itemId and itemInstanceId" },
          { status: 400 }
        )
      }

      // Verify item belongs to user (for new items)
      if (itemId) {
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
      }

      // Verify item instance belongs to user and is available (for inventory items)
      if (itemInstanceId) {
        const itemInstance = await prisma.itemInstances.findFirst({
          where: {
            id: itemInstanceId,
            currentOwnerId: session.user.id,
            isAvailable: true
          }
        })

        if (!itemInstance) {
          return NextResponse.json(
            { error: "Item instance not found, unauthorized, or not available" },
            { status: 404 }
          )
        }

        // Mark item instance as not available (being offered)
        await prisma.itemInstances.update({
          where: { id: itemInstanceId },
          data: { isAvailable: false }
        })
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
      if (itemId) {
        createData.item = {
          connect: { id: itemId }
        }
      }
      if (itemInstanceId) {
        createData.itemInstance = {
          connect: { id: itemInstanceId }
        }
      }
    } else if (type === "ask") {
      createData.askDescription = askDescription
    }

    const offer = await prisma.offers.create({
      data: createData,
      include: {
        item: true,
        itemInstance: {
          include: {
            catalogItem: true
          }
        },
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