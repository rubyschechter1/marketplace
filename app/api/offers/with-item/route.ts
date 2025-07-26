import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { geocodeCoordinates } from "@/lib/location-utils"
import { validateMultipleFields } from "@/lib/contentValidation"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { 
      itemName, 
      itemDescription, 
      itemImageUrl,
      offerTitle, 
      offerDescription, 
      lookingFor, 
      latitude, 
      longitude, 
      locationName 
    } = data

    // Validate ALL content fields before creating anything
    const fieldsToValidate = []
    
    // Item fields
    if (itemName) {
      fieldsToValidate.push({ text: itemName, fieldName: "Item name", context: "offer" as const })
    }
    
    if (itemDescription) {
      fieldsToValidate.push({ text: itemDescription, fieldName: "Item description", context: "offer" as const })
    }
    
    // Offer fields
    if (offerTitle) {
      fieldsToValidate.push({ text: offerTitle, fieldName: "Offer title", context: "offer" as const })
    }
    
    if (offerDescription) {
      fieldsToValidate.push({ text: offerDescription, fieldName: "Offer description", context: "offer" as const })
    }
    
    // Looking for items
    if (lookingFor && Array.isArray(lookingFor)) {
      lookingFor.forEach((item, index) => {
        if (item && typeof item === 'string') {
          fieldsToValidate.push({ text: item, fieldName: `Looking for item ${index + 1}`, context: "offer" as const })
        }
      })
    }
    
    // Validate all fields at once
    if (fieldsToValidate.length > 0) {
      const validation = await validateMultipleFields(fieldsToValidate)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }
    }

    // Additional validation
    if (!itemName || !offerTitle || latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Geocode the coordinates
    const geocodeResult = await geocodeCoordinates(latitude, longitude)

    // Use a transaction to ensure both item and offer are created together
    const result = await prisma.$transaction(async (tx) => {
      // Create the item
      const item = await tx.items.create({
        data: {
          name: itemName,
          description: itemDescription || "",
          imageUrl: itemImageUrl || null,
          currentOwnerId: session.user.id,
          acquisitionMethod: "created",
          isAvailable: false // Since it's being offered
        }
      })

      // Create the offer
      const offer = await tx.offers.create({
        data: {
          traveler: {
            connect: { id: session.user.id }
          },
          item: {
            connect: { id: item.id }
          },
          type: "offer",
          title: offerTitle,
          description: offerDescription || "",
          lookingFor: lookingFor || [],
          latitude,
          longitude,
          locationName,
          city: geocodeResult.city,
          country: geocodeResult.country,
          displayLocation: geocodeResult.displayLocation
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
        }
      })

      return { item, offer }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating offer with item:", error)
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 }
    )
  }
}