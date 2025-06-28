import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
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
          where: { status: 'pending' },
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

    // Transform to match expected format
    return NextResponse.json({
      ...offer,
      latitude: offer.latitude?.toNumber(),
      longitude: offer.longitude?.toNumber(),
    })
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

    await prisma.offers.delete({
      where: { id }
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