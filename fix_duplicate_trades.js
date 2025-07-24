require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixDuplicateAcceptedTrades() {
  try {
    console.log('🔍 Looking for offers with multiple accepted trades...')
    
    // Find offers that have multiple accepted trades
    const offers = await prisma.offers.findMany({
      where: {
        proposedTrades: {
          some: {
            status: 'accepted'
          }
        }
      },
      include: {
        proposedTrades: {
          where: {
            status: 'accepted'
          },
          include: {
            proposer: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            offeredItem: {
              select: {
                name: true
              }
            },
            offeredItemInstance: {
              include: {
                catalogItem: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'asc' // Keep the earliest accepted trade
          }
        },
        item: {
          select: {
            name: true
          }
        },
        itemInstance: {
          include: {
            catalogItem: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    let fixedCount = 0

    for (const offer of offers) {
      const acceptedTrades = offer.proposedTrades
      const offerItemName = offer.item?.name || offer.itemInstance?.catalogItem?.name || offer.title

      if (acceptedTrades.length > 1) {
        console.log(`\n🚨 Found ${acceptedTrades.length} accepted trades for offer: ${offerItemName}`)
        
        // Keep the first (earliest) accepted trade
        const keepTrade = acceptedTrades[0]
        const duplicateTrades = acceptedTrades.slice(1)
        
        console.log(`✅ Keeping: ${keepTrade.proposer.firstName} ${keepTrade.proposer.lastName} - ${keepTrade.offeredItem?.name || keepTrade.offeredItemInstance?.catalogItem?.name}`)
        
        // Mark the rest as unavailable
        for (const trade of duplicateTrades) {
          const tradeItemName = trade.offeredItem?.name || trade.offeredItemInstance?.catalogItem?.name
          console.log(`❌ Marking as unavailable: ${trade.proposer.firstName} ${trade.proposer.lastName} - ${tradeItemName}`)
          
          await prisma.proposedTrades.update({
            where: { id: trade.id },
            data: { 
              status: 'unavailable',
              updatedAt: new Date()
            }
          })
          
          // Create system message for the unavailable trade
          await prisma.messages.create({
            data: {
              offerId: offer.id,
              proposedTradeId: trade.id,
              senderId: null, // System message
              recipientId: null,
              content: 'This item is no longer available - another trade was accepted first'
            }
          })
          
          fixedCount++
        }
      }
    }

    if (fixedCount > 0) {
      console.log(`\n✅ Fixed ${fixedCount} duplicate accepted trades.`)
    } else {
      console.log('\n✅ No duplicate accepted trades found.')
    }

  } catch (error) {
    console.error('❌ Error fixing duplicate trades:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDuplicateAcceptedTrades()