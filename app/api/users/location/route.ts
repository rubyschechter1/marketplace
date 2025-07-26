import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { latitude, longitude, city, country } = body

    if (!latitude || !longitude || !city || !country) {
      return NextResponse.json(
        { error: "Latitude, longitude, city, and country are required" },
        { status: 400 }
      )
    }

    // Update user's location data
    const updatedUser = await prisma.travelers.update({
      where: { id: session.user.id },
      data: {
        lastLatitude: parseFloat(latitude),
        lastLongitude: parseFloat(longitude),
        lastCity: city,
        lastCountry: country
      }
    })

    return NextResponse.json({
      success: true,
      location: {
        latitude: updatedUser.lastLatitude,
        longitude: updatedUser.lastLongitude,
        city: updatedUser.lastCity,
        country: updatedUser.lastCountry
      }
    })

  } catch (error) {
    console.error("❌ Error updating user location:", error)
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    )
  }
}