import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Debug endpoint to check current user location data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.travelers.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastLatitude: true,
        lastLongitude: true,
        lastCity: true,
        lastCountry: true
      }
    })

    return NextResponse.json({
      user: user,
      hasLocationData: !!(user?.lastCity && user?.lastCountry)
    })

  } catch (error) {
    console.error("❌ Error fetching user location data:", error)
    return NextResponse.json(
      { error: "Failed to fetch user location data" },
      { status: 500 }
    )
  }
}

// Test endpoint to manually set location (for debugging)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Set a test location
    const updatedUser = await prisma.travelers.update({
      where: { id: session.user.id },
      data: {
        lastLatitude: 40.7128,
        lastLongitude: -74.0060,
        lastCity: "New York",
        lastCountry: "United States"
      }
    })

    return NextResponse.json({
      success: true,
      message: "Test location set",
      location: {
        city: updatedUser.lastCity,
        country: updatedUser.lastCountry
      }
    })

  } catch (error) {
    console.error("❌ Error setting test location:", error)
    return NextResponse.json(
      { error: "Failed to set test location" },
      { status: 500 }
    )
  }
}