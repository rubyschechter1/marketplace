import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { validateNoCurrency } from "@/lib/currencyFilter"
import { formatDisplayName } from "@/lib/formatName"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recipientId, itemInstanceId, itemName, itemDescription, itemImageUrl, offerId, tradeId, currentLocation } = body

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
    let catalogItem = null

    if (itemInstanceId) {
      // Transfer existing inventory item
      const itemInstance = await prisma.itemInstances.findUnique({
        where: { id: itemInstanceId },
        include: {
          catalogItem: true
        }
      })

      if (!itemInstance) {
        return NextResponse.json(
          { error: "Item not found" },
          { status: 400 }
        )
      }

      if (itemInstance.currentOwnerId !== session.user.id) {
        return NextResponse.json(
          { error: "You don't own this item" },
          { status: 400 }
        )
      }

      if (!itemInstance.isAvailable) {
        // Check if this item is part of an active offer
        const activeOffer = await prisma.offers.findFirst({
          where: {
            itemInstanceId: itemInstanceId,
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
          console.log(`📦 Making item ${itemInstanceId} available for transfer`)
          await prisma.itemInstances.update({
            where: { id: itemInstanceId },
            data: { isAvailable: true }
          })
        }
      }

      // Check if recipient already has this catalog item
      const existingInstance = await prisma.itemInstances.findFirst({
        where: {
          catalogItemId: itemInstance.catalogItemId,
          currentOwnerId: recipientId
        }
      })

      if (existingInstance) {
        return NextResponse.json(
          { error: "Recipient already has this item in their inventory" },
          { status: 400 }
        )
      }

      // Transfer the item instance
      transferredItem = await prisma.itemInstances.update({
        where: { id: itemInstanceId },
        data: {
          currentOwnerId: recipientId
        },
        include: {
          catalogItem: true
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
          itemInstanceId: itemInstanceId,
          fromOwnerId: session.user.id,
          toOwnerId: recipientId,
          city: locationData.city,
          country: locationData.country,
          transferMethod: "gifted"
        }
      })

      catalogItem = transferredItem.catalogItem
    } else if (itemName) {
      // Validate item name for currency content and inappropriate content
      const nameValidation = validateNoCurrency(itemName, "Item name", "offer")
      if (!nameValidation.isValid) {
        return NextResponse.json(
          { error: nameValidation.error },
          { status: 400 }
        )
      }

      // Validate item description for currency content and inappropriate content
      if (itemDescription) {
        const descValidation = validateNoCurrency(itemDescription, "Item description", "offer")
        if (!descValidation.isValid) {
          return NextResponse.json(
            { error: descValidation.error },
            { status: 400 }
          )
        }
      }

      // Create new item and give it directly to recipient
      // First, check if an item with this name already exists
      let existingCatalogItem = await prisma.items.findFirst({
        where: {
          name: itemName
        }
      })

      if (existingCatalogItem) {
        // Check if recipient already has this catalog item
        const existingInstance = await prisma.itemInstances.findFirst({
          where: {
            catalogItemId: existingCatalogItem.id,
            currentOwnerId: recipientId
          }
        })

        if (existingInstance) {
          return NextResponse.json(
            { error: "Recipient already has this item in their inventory" },
            { status: 400 }
          )
        }

        catalogItem = existingCatalogItem
      } else {
        // Create new catalog item if it doesn't exist
        catalogItem = await prisma.items.create({
          data: {
            name: itemName,
            description: itemDescription || null,
            imageUrl: itemImageUrl || null,
            createdBy: session.user.id
          }
        })
      }

      // Create item instance for recipient
      transferredItem = await prisma.itemInstances.create({
        data: {
          catalogItemId: catalogItem.id,
          currentOwnerId: recipientId,
          originalOwnerId: session.user.id,
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
          itemInstanceId: transferredItem.id,
          fromOwnerId: session.user.id,
          toOwnerId: recipientId,
          city: locationData.city,
          country: locationData.country,
          transferMethod: "gifted"
        }
      })
    } else {
      return NextResponse.json(
        { error: "Either itemInstanceId or itemName is required" },
        { status: 400 }
      )
    }

    // Note: Item transfer system message and review prompts are now handled by the review system
    // when both parties complete their reviews

    return NextResponse.json({
      success: true,
      transferredItem: {
        id: transferredItem.id,
        name: catalogItem.name,
        description: catalogItem.description,
        imageUrl: catalogItem.imageUrl
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