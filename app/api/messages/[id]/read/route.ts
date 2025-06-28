import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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

    // Verify message exists and user is recipient
    const message = await prisma.messages.findFirst({
      where: {
        id,
        recipientId: session.user.id
      }
    })

    if (!message) {
      return NextResponse.json(
        { error: "Message not found or unauthorized" },
        { status: 404 }
      )
    }

    const updatedMessage = await prisma.messages.update({
      where: { id },
      data: { isRead: true }
    })

    return NextResponse.json({ message: updatedMessage })
  } catch (error) {
    console.error("Error marking message as read:", error)
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    )
  }
}