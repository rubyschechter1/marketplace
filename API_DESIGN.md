# Marketplace API Design

## Core Endpoints

### Offers
- `GET /api/offers` - List nearby offers (with location query params)
- `GET /api/offers/[id]` - Get specific offer details
- `POST /api/offers` - Create new offer
- `PUT /api/offers/[id]` - Update offer
- `DELETE /api/offers/[id]` - Delete offer
- `GET /api/offers/mine` - Get user's own offers

### Items
- `GET /api/items/[id]` - Get specific item
- `POST /api/items` - Create new item
- `GET /api/items/mine` - Get user's created items

### Messages
- `GET /api/messages/conversations` - List all conversations
- `GET /api/messages/[offerId]/[proposedTradeId]` - Get messages for specific trade
- `POST /api/messages` - Send a message
- `PUT /api/messages/read/[id]` - Mark message as read

### User Profile
- `GET /api/users/[id]` - Get public user profile
- `PUT /api/users/profile` - Update own profile
- `GET /api/users/me` - Get current user full profile

## Query Parameters

### Offers listing
- `lat` & `lng` - User's current location
- `status` - Filter by status (active, completed, cancelled)
- `page` & `limit` - Pagination

Note: Search radius is hard-coded to 10km

## Request/Response Examples

### Create Offer
```json
POST /api/offers
{
  "itemId": "uuid",
  "title": "Camping gear for trade",
  "description": "Looking to trade my tent for...",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "locationName": "San Francisco, CA"
}
```

### Send Message
```json
POST /api/messages
{
  "offerId": "uuid",
  "recipientId": "uuid",
  "content": "Is this still available?"
}
```