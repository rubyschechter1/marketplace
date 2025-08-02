const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkItemStatus(itemId) {
  console.log(`\n🔍 Checking status for item: ${itemId}\n`)
  
  try {
    // Get the item details
    const item = await prisma.items.findUnique({
      where: { id: itemId },
      include: {
        currentOwner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })
    
    if (!item) {
      console.log('❌ Item not found!')
      return
    }
    
    console.log('📦 Item Details:')
    console.log(`  Name: ${item.name}`)
    console.log(`  Current Owner: ${item.currentOwner.firstName} ${item.currentOwner.lastName} (${item.currentOwner.id})`)
    console.log(`  Available: ${item.isAvailable}`)
    console.log(`  Created: ${item.createdAt}`)
    
    // Check active offers
    console.log('\n🏷️  Active Offers:')
    const activeOffers = await prisma.offers.findMany({
      where: {
        itemId: itemId,
        status: 'active'
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      }
    })
    
    if (activeOffers.length === 0) {
      console.log('  No active offers')
    } else {
      activeOffers.forEach(offer => {
        console.log(`  - Offer ${offer.id}: ${offer.title} (${offer.status})`)
      })
    }
    
    // Check all offers (including completed)
    console.log('\n📋 All Offers with this item:')
    const allOffers = await prisma.offers.findMany({
      where: {
        itemId: itemId
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      }
    })
    
    allOffers.forEach(offer => {
      console.log(`  - Offer ${offer.id}: ${offer.title} (${offer.status}) - Created: ${offer.createdAt}`)
    })
    
    // Check proposed trades where this item is offered
    console.log('\n🤝 Proposed Trades (as offered item):')
    const tradesAsOffered = await prisma.proposedTrades.findMany({
      where: {
        offeredItemId: itemId
      },
      include: {
        offer: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })
    
    if (tradesAsOffered.length === 0) {
      console.log('  No trades where this item was offered')
    } else {
      tradesAsOffered.forEach(trade => {
        console.log(`  - Trade ${trade.id}: Status=${trade.status}, Offer=${trade.offer.title} (${trade.offer.status})`)
      })
    }
    
    // Check proposed trades where this item is part of an offer
    console.log('\n💱 Proposed Trades (as part of offer):')
    const tradesAsOfferItem = await prisma.proposedTrades.findMany({
      where: {
        offer: {
          itemId: itemId
        }
      },
      include: {
        offer: {
          select: {
            id: true,
            title: true,
            status: true,
            itemId: true
          }
        },
        offeredItem: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    if (tradesAsOfferItem.length === 0) {
      console.log('  No trades for offers containing this item')
    } else {
      tradesAsOfferItem.forEach(trade => {
        console.log(`  - Trade ${trade.id}: Status=${trade.status}, Offered item=${trade.offeredItem?.name || 'N/A'}`)
        console.log(`    Offer: ${trade.offer.title} (${trade.offer.status})`)
      })
    }
    
    // Check for pending or accepted trades
    console.log('\n⚠️  Pending/Accepted Trades:')
    const problematicTrades = await prisma.proposedTrades.findMany({
      where: {
        OR: [
          { offeredItemId: itemId },
          { 
            offer: {
              itemId: itemId
            }
          }
        ],
        status: {
          in: ['pending', 'accepted']
        }
      },
      include: {
        offer: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })
    
    if (problematicTrades.length === 0) {
      console.log('  ✅ No pending or accepted trades found')
    } else {
      console.log('  ❌ Found trades blocking deletion:')
      problematicTrades.forEach(trade => {
        console.log(`    - Trade ${trade.id}: Status=${trade.status}`)
        console.log(`      Offer: ${trade.offer.title} (${trade.offer.status})`)
        console.log(`      Created: ${trade.createdAt}`)
        console.log(`      Updated: ${trade.updatedAt}`)
      })
    }
    
    // Check item history
    console.log('\n📜 Item History:')
    const history = await prisma.itemHistory.findMany({
      where: { itemId: itemId },
      orderBy: { transferDate: 'desc' },
      include: {
        fromOwner: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        toOwner: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })
    
    history.forEach(entry => {
      const from = entry.fromOwner ? `${entry.fromOwner.firstName} ${entry.fromOwner.lastName}` : 'N/A'
      const to = `${entry.toOwner.firstName} ${entry.toOwner.lastName}`
      console.log(`  - ${entry.transferDate}: ${from} → ${to} (${entry.transferMethod})`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check
checkItemStatus('bd72a73b-8356-452a-8a63-fc8d948be33d')