require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDuplicateAcceptedTrades() {
  try {
    // Find offers that have multiple accepted trades
    const duplicateAcceptedTrades = await prisma.offers.findMany({
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

    console.log('Offers with accepted trades:')
    for (const offer of duplicateAcceptedTrades) {
      const acceptedCount = offer.proposedTrades.length
      const offerItemName = offer.item?.name || offer.itemInstance?.catalogItem?.name || offer.title
      
      console.log(`\nOffer ID: ${offer.id}`)
      console.log(`Offer Item: ${offerItemName}`)
      console.log(`Accepted trades count: ${acceptedCount}`)
      
      if (acceptedCount > 1) {
        console.log('🚨 DUPLICATE ACCEPTED TRADES FOUND!')
        offer.proposedTrades.forEach((trade, index) => {
          const tradeItemName = trade.offeredItem?.name || trade.offeredItemInstance?.catalogItem?.name || 'Unknown'
          console.log(`  ${index + 1}. ${trade.proposer.firstName} ${trade.proposer.lastName} - ${tradeItemName} (${trade.status})`)
        })
      } else {
        const trade = offer.proposedTrades[0]
        const tradeItemName = trade.offeredItem?.name || trade.offeredItemInstance?.catalogItem?.name || 'Unknown'
        console.log(`  ✅ ${trade.proposer.firstName} ${trade.proposer.lastName} - ${tradeItemName} (${trade.status})`)
      }
    }

  } catch (error) {
    console.error('Error checking duplicate trades:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDuplicateAcceptedTrades()