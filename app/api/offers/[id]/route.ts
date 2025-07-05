import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { transformOfferWithLocation } from "@/lib/prisma-transforms"

const prisma = new PrismaClient()

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get session to check if user owns the offer
    const session = await getServerSession(authOptions)
    
    // Extract location parameters from URL
    const { searchParams } = new URL(req.url)
    const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined
    const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined
    
    const offer = await prisma.offers.findUnique({
      where: { id },
      include: {
        item: true,
        traveler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            bio: true
          }
        },
        proposedTrades: {
          include: {
            proposer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            offeredItem: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      }
    })

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    // Check if offer is deleted and user is not the owner
    if (offer.status === 'deleted' && session?.user?.id !== offer.travelerId) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    // Check if user owns the offer
    const isOwnOffer = session?.user?.id === offer.travelerId
    
    // Transform offer with location and distance calculation
    const transformedOffer = transformOfferWithLocation(
      offer,
      lat,
      lng,
      isOwnOffer
    )
    
    return NextResponse.json(transformedOffer)
  } catch (error) {
    console.error("Error fetching offer:", error)
    return NextResponse.json(
      { error: "Failed to fetch offer" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { title, description, status, locationName } = data

    // Verify offer belongs to user
    const existingOffer = await prisma.offers.findFirst({
      where: {
        id,
        travelerId: session.user.id
      }
    })

    if (!existingOffer) {
      return NextResponse.json(
        { error: "Offer not found or unauthorized" },
        { status: 404 }
      )
    }

    const offer = await prisma.offers.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(locationName !== undefined && { locationName })
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
    console.error("Error updating offer:", error)
    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify offer belongs to user
    const offer = await prisma.offers.findFirst({
      where: {
        id,
        travelerId: session.user.id
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: "Offer not found or unauthorized" },
        { status: 404 }
      )
    }

    // Soft delete by updating status
    await prisma.offers.update({
      where: { id },
      data: { status: 'deleted' }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting offer:", error)
    return NextResponse.json(
      { error: "Failed to delete offer" },
      { status: 500 }
    )
  }
}