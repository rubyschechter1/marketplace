const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectOffer() {
  const offerId = 'f59d67f4-0f11-4001-9883-7018a89ffa7f';
  
  try {
    const offer = await prisma.offers.findUnique({
      where: { id: offerId },
      include: {
        item: true,
        traveler: true
      }
    });
    
    if (offer) {
      console.log('Offer found:');
      console.log('ID:', offer.id);
      console.log('Title:', offer.title);
      console.log('Latitude:', offer.latitude?.toString());
      console.log('Longitude:', offer.longitude?.toString());
      console.log('City:', offer.city);
      console.log('Country:', offer.country);
      console.log('Display Location:', offer.displayLocation);
      console.log('Location Name:', offer.locationName);
      
      // Calculate distance from user's location
      const userLat = 40.70113531443594;
      const userLng = -73.92366463039347;
      
      if (offer.latitude && offer.longitude) {
        const offerLat = offer.latitude.toNumber();
        const offerLng = offer.longitude.toNumber();
        
        // Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = (offerLat - userLat) * Math.PI / 180;
        const dLon = (offerLng - userLng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(userLat * Math.PI / 180) * Math.cos(offerLat * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        console.log('\nDistance Calculation:');
        console.log('User coords:', userLat, userLng);
        console.log('Offer coords:', offerLat, offerLng);
        console.log('Calculated distance:', distance.toFixed(1), 'km');
        console.log('Rounded distance:', Math.round(distance), 'km');
      }
    } else {
      console.log('Offer not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectOffer();