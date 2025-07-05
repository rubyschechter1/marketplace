import { PrismaClient } from "@prisma/client"
import { geocodeCoordinates } from "../lib/location-utils"
import dotenv from "dotenv"

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function backfillLocations() {
  console.log("Starting location backfill...")
  
  try {
    // Get all offers that have coordinates but no city/country
    const offers = await prisma.offers.findMany({
      where: {
        OR: [
          { city: null },
          { country: null },
          { displayLocation: null }
        ]
      },
      include: {
        item: true
      }
    })
    
    console.log(`Found ${offers.length} offers to backfill`)
    
    for (const offer of offers) {
      console.log(`\nProcessing offer ${offer.id}:`)
      console.log(`  Item: ${offer.item?.name || offer.title}`)
      console.log(`  Current location: ${offer.locationName || "Unknown"}`)
      console.log(`  Coordinates: ${offer.latitude}, ${offer.longitude}`)
      
      try {
        // Convert Decimal to number
        const lat = offer.latitude.toNumber()
        const lng = offer.longitude.toNumber()
        
        // Geocode the coordinates
        const geocoded = await geocodeCoordinates(lat, lng)
        
        console.log(`  Geocoded to: ${geocoded.displayLocation}`)
        
        // Update the offer
        await prisma.offers.update({
          where: { id: offer.id },
          data: {
            city: geocoded.city,
            country: geocoded.country,
            displayLocation: geocoded.displayLocation
          }
        })
        
        console.log(`  ✓ Updated successfully`)
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`  ✗ Error processing offer ${offer.id}:`, error)
      }
    }
    
    console.log("\nBackfill complete!")
    
  } catch (error) {
    console.error("Error during backfill:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the backfill
backfillLocations().catch(console.error)