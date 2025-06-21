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
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        item: true,
        traveler: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true
          }
        }
      }
    })

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    return NextResponse.json({ offer })
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
    const existingOffer = await prisma.offer.findFirst({
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

    const offer = await prisma.offer.update({
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
            username: true,
            displayName: true
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
    const offer = await prisma.offer.findFirst({
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

    await prisma.offer.delete({
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