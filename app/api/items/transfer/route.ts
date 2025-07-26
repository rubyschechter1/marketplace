import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { validateMultipleFields } from "@/lib/contentValidation"
import { formatDisplayName } from "@/lib/formatName"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recipientId, itemId, itemName, itemDescription, itemImageUrl, offerId, tradeId, currentLocation } = body

    if (!recipientId) {
      return NextResponse.json(
        { error: "Recipient ID is required" },
        { status: 400 }
      )
    }

    // Verify the recipient exists and get current user (giver) info
    const [recipient, currentUser] = await Promise.all([
      prisma.travelers.findUnique({
        where: { id: recipientId }
      }),
      prisma.travelers.findUnique({
        where: { id: session.user.id }
      })
    ])

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      )
    }

    if (!currentUser) {
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      )
    }

    let transferredItem = null

    if (itemId) {
      // Transfer existing inventory item
      const item = await prisma.items.findUnique({
        where: { id: itemId }
      })

      if (!item) {
        return NextResponse.json(
          { error: "Item not found" },
          { status: 400 }
        )
      }

      if (item.currentOwnerId !== session.user.id) {
        return NextResponse.json(
          { error: "You don't own this item" },
          { status: 400 }
        )
      }

      if (!item.isAvailable) {
        // Check if this item is part of an active offer
        const activeOffer = await prisma.offers.findFirst({
          where: {
            itemId: itemId,
            status: 'active'
          }
        })

        if (activeOffer) {
          return NextResponse.json(
            { error: "This item is currently being offered and cannot be transferred. Delete the offer first to make it available for transfer." },
            { status: 400 }
          )
        } else {
          // Item is unavailable but not in an active offer - make it available
          console.log(`📦 Making item ${itemId} available for transfer`)
          await prisma.items.update({
            where: { id: itemId },
            data: { isAvailable: true }
          })
        }
      }

      // Check if recipient already has an item with same name
      const existingItem = await prisma.items.findFirst({
        where: {
          name: item.name,
          currentOwnerId: recipientId
        }
      })

      if (existingItem) {
        return NextResponse.json(
          { error: "Recipient already has this item in their inventory" },
          { status: 400 }
        )
      }

      // Transfer the item
      transferredItem = await prisma.items.update({
        where: { id: itemId },
        data: {
          currentOwnerId: recipientId
        }
      })

      // Create history entry using current location if available, fallback to stored location
      const locationData = currentLocation && currentLocation.latitude ? {
        city: currentLocation.city || "Current Location",
        country: currentLocation.country || "Earth"
      } : {
        city: currentUser.lastCity || "Current Location",
        country: currentUser.lastCountry || "Earth"
      }
      
      await prisma.itemHistory.create({
        data: {
          itemId: itemId,
          fromOwnerId: session.user.id,
          toOwnerId: recipientId,
          city: locationData.city,
          country: locationData.country,
          transferMethod: "gifted"
        }
      })
    } else if (itemName) {
      // Validate content fields
      const fieldsToValidate = [
        { text: itemName, fieldName: "Item name", context: "offer" as const }
      ]
      
      if (itemDescription) {
        fieldsToValidate.push({ text: itemDescription, fieldName: "Item description", context: "offer" as const })
      }
      
      const validation = await validateMultipleFields(fieldsToValidate)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }

      // Check if recipient already has an item with this name
      const existingItem = await prisma.items.findFirst({
        where: {
          name: itemName,
          currentOwnerId: recipientId
        }
      })

      if (existingItem) {
        return NextResponse.json(
          { error: "Recipient already has this item in their inventory" },
          { status: 400 }
        )
      }

      // Create new item directly for recipient
      transferredItem = await prisma.items.create({
        data: {
          name: itemName,
          description: itemDescription || null,
          imageUrl: itemImageUrl || null,
          currentOwnerId: recipientId,
          acquisitionMethod: "gifted"
        }
      })

      // Create history entry using current location if available, fallback to stored location
      const locationData = currentLocation && currentLocation.latitude ? {
        city: currentLocation.city || "Current Location",
        country: currentLocation.country || "Earth"
      } : {
        city: currentUser.lastCity || "Current Location",
        country: currentUser.lastCountry || "Earth"
      }
      
      await prisma.itemHistory.create({
        data: {
          itemId: transferredItem.id,
          fromOwnerId: session.user.id,
          toOwnerId: recipientId,
          city: locationData.city,
          country: locationData.country,
          transferMethod: "gifted"
        }
      })
    } else {
      return NextResponse.json(
        { error: "Either itemId or itemName is required" },
        { status: 400 }
      )
    }

    // Note: Item transfer system message and review prompts are now handled by the review system
    // when both parties complete their reviews

    return NextResponse.json({
      success: true,
      transferredItem: {
        id: transferredItem.id,
        name: transferredItem.name,
        description: transferredItem.description,
        imageUrl: transferredItem.imageUrl
      },
      recipient: {
        id: recipient.id,
        firstName: recipient.firstName,
        lastName: recipient.lastName
      }
    })

  } catch (error) {
    console.error("❌ Error transferring item:", error)
    return NextResponse.json(
      { error: "Failed to transfer item" },
      { status: 500 }
    )
  }
}