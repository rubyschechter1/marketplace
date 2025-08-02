const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrateData() {
  console.log('🚀 Starting data migration for acceptedTradeId...\n')
  
  try {
    // 1. Find all accepted trades and update offers with acceptedTradeId
    console.log('📋 Finding accepted trades...')
    const acceptedTrades = await prisma.proposedTrades.findMany({
      where: { status: 'accepted' },
      include: { offer: true }
    })
    
    console.log(`Found ${acceptedTrades.length} accepted trades`)
    
    for (const trade of acceptedTrades) {
      console.log(`\n🔄 Processing trade ${trade.id}`)
      console.log(`  Offer: ${trade.offer.title} (${trade.offer.id})`)
      
      // Check if offer already has an acceptedTradeId
      if (trade.offer.acceptedTradeId && trade.offer.acceptedTradeId !== trade.id) {
        console.log(`  ⚠️  WARNING: Offer already has different acceptedTradeId: ${trade.offer.acceptedTradeId}`)
        console.log(`  Current trade status: ${trade.status}`)
        continue
      }
      
      // Update the offer with acceptedTradeId
      await prisma.offers.update({
        where: { id: trade.offerId },
        data: { acceptedTradeId: trade.id }
      })
      console.log(`  ✅ Set acceptedTradeId on offer`)
    }
    
    // 2. Update rejected trades
    console.log('\n📋 Finding rejected trades...')
    const rejectedTrades = await prisma.proposedTrades.findMany({
      where: { status: 'rejected' }
    })
    
    console.log(`Found ${rejectedTrades.length} rejected trades`)
    
    await prisma.proposedTrades.updateMany({
      where: { status: 'rejected' },
      data: { isRejected: true }
    })
    console.log('✅ Updated all rejected trades')
    
    // 3. Update withdrawn trades
    console.log('\n📋 Finding withdrawn trades...')
    const withdrawnTrades = await prisma.proposedTrades.findMany({
      where: { status: 'withdrawn' }
    })
    
    console.log(`Found ${withdrawnTrades.length} withdrawn trades`)
    
    await prisma.proposedTrades.updateMany({
      where: { status: 'withdrawn' },
      data: { isWithdrawn: true }
    })
    console.log('✅ Updated all withdrawn trades')
    
    // 4. Summary
    console.log('\n📊 Migration Summary:')
    console.log(`  - Accepted trades migrated: ${acceptedTrades.length}`)
    console.log(`  - Rejected trades migrated: ${rejectedTrades.length}`)
    console.log(`  - Withdrawn trades migrated: ${withdrawnTrades.length}`)
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...')
    const offersWithAcceptedTrades = await prisma.offers.count({
      where: { acceptedTradeId: { not: null } }
    })
    console.log(`  - Offers with acceptedTradeId: ${offersWithAcceptedTrades}`)
    
    const tradesWithRejected = await prisma.proposedTrades.count({
      where: { isRejected: true }
    })
    console.log(`  - Trades marked as rejected: ${tradesWithRejected}`)
    
    const tradesWithWithdrawn = await prisma.proposedTrades.count({
      where: { isWithdrawn: true }
    })
    console.log(`  - Trades marked as withdrawn: ${tradesWithWithdrawn}`)
    
    console.log('\n✅ Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateData()