import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { validateNoCurrency } from "@/lib/currencyFilter"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { recipientId, itemInstanceId, itemName, itemDescription, itemImageUrl, offerId, tradeId } = body

    if (!recipientId) {
      return NextResponse.json(
        { error: "Recipient ID is required" },
        { status: 400 }
      )
    }

    // Verify the recipient exists
    const recipient = await prisma.travelers.findUnique({
      where: { id: recipientId }
    })

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
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

      if (!itemInstance || itemInstance.currentOwnerId !== session.user.id || !itemInstance.isAvailable) {
        return NextResponse.json(
          { error: "Item not found, not owned by you, or not available for transfer" },
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

      // Create history entry
      await prisma.itemHistory.create({
        data: {
          itemInstanceId: itemInstanceId,
          fromOwnerId: session.user.id,
          toOwnerId: recipientId,
          city: recipient.lastCity,
          country: recipient.lastCountry,
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
      // First create the catalog item
      catalogItem = await prisma.items.create({
        data: {
          name: itemName,
          description: itemDescription || null,
          imageUrl: itemImageUrl || null,
          createdBy: session.user.id
        }
      })

      // Create item instance for recipient
      transferredItem = await prisma.itemInstances.create({
        data: {
          catalogItemId: catalogItem.id,
          currentOwnerId: recipientId,
          originalOwnerId: session.user.id,
          acquisitionMethod: "gifted"
        }
      })

      // Create history entry
      await prisma.itemHistory.create({
        data: {
          itemInstanceId: transferredItem.id,
          fromOwnerId: session.user.id,
          toOwnerId: recipientId,
          city: recipient.lastCity,
          country: recipient.lastCountry,
          transferMethod: "gifted"
        }
      })
    } else {
      return NextResponse.json(
        { error: "Either itemInstanceId or itemName is required" },
        { status: 400 }
      )
    }

    // Create a system message in the conversation
    if (offerId && tradeId) {
      await prisma.messages.create({
        data: {
          offerId: offerId,
          proposedTradeId: tradeId,
          senderId: null, // System message
          recipientId: null,
          content: `${session.user.name?.split(' ')[0] || 'Someone'} has given you ${catalogItem.name}! You can now see this item in your inventory.`
        }
      })
    }

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