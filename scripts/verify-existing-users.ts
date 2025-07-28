import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function verifyExistingUsers() {
  try {
    // Update all users who don't have emailVerified set to true
    const result = await prisma.travelers.updateMany({
      where: {
        emailVerified: false
      },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null
      }
    })

    console.log(`✅ Updated ${result.count} users to verified status`)
  } catch (error) {
    console.error('Error updating users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyExistingUsers()