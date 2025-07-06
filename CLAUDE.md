# Marketplace Project Notes

## Architecture Decision: Next.js → React Native

### Current Approach
- Starting with Next.js for a mobile-first website
- Prioritizing rapid development and validation over native app features

### Future Migration Considerations
To ease potential migration to React Native:

1. **Keep business logic separate from UI components**
   - Use custom hooks for logic
   - Separate data fetching/processing from presentation

2. **Use cross-platform state management**
   - Redux, Zustand, or similar solutions that work in both environments

3. **Abstract API calls**
   - Create a services layer that can be reused

4. **Consider shared component libraries**
   - React Native Web
   - Tamagui
   - Other universal component systems

### Key Differences to Remember
- **Components**: HTML elements → Native components (View, Text, etc.)
- **Styling**: CSS → StyleSheet objects
- **Navigation**: Next.js routing → React Navigation
- **APIs**: Web APIs → Native device APIs

### Migration Strategy
The core React patterns (hooks, state, props) remain consistent across platforms, so migration primarily involves rewriting the presentation layer while preserving business logic.

## Tech Stack Decisions

### Hosting & Database
- **Hosting**: Vercel
- **Database**: Neon Postgres
- **Design**: Mobile-first responsive web

### Application Concept
A barter marketplace for travelers with:
- User profiles
- Offer posts (items to give/want)
- Location-based browsing
- Basic messaging between users
- No monetary transactions

### Authentication Options
1. **Clerk**
   - Requires account at clerk.com (proprietary service)
   - Pre-built UI components
   - Quick setup (~5 minutes)
   - Free tier: 10,000 MAU
   - External user management dashboard

2. **NextAuth.js (Auth.js)** ✓ Recommended
   - Open source, no external accounts
   - Runs entirely in your Next.js app
   - Users stored in your Neon database
   - Well-supported by Vercel
   - No vendor lock-in
   - More initial setup but full control

## Database Schema

### Core Tables
1. **travelers** - User profiles with auth info
2. **items** - Reusable item catalog with metadata
3. **offers** - Barter posts with location (one item per offer)
4. **messages** - Conversations between travelers

### Key Features
- Simple lat/lng for location (upgradeable to PostGIS)
- One item per offer (simplified design)
- Messages tied to specific offers for context
- Status tracking (active/completed/cancelled)
- Performance indexes for location queries

### Database Management
- **Prisma ORM** is the single source of truth for schema
- Schema defined in `prisma/schema.prisma`
- Migrations managed through `npx prisma migrate dev`
- Database introspection with `npx prisma db pull`

## API Endpoints

### Offers
- `GET /api/offers` - List nearby offers (lat, lng, status, page, limit)
- `POST /api/offers` - Create new offer
- `GET /api/offers/[id]` - Get specific offer
- `PUT /api/offers/[id]` - Update offer
- `DELETE /api/offers/[id]` - Delete offer
- `GET /api/offers/mine` - Get user's own offers

### Items
- `POST /api/items` - Create new item
- `GET /api/items/[id]` - Get specific item
- `GET /api/items/mine` - Get user's created items

### Messages
- `POST /api/messages` - Send a message
- `GET /api/messages/conversations` - List all conversations
- `GET /api/messages/[offerId]/[proposedTradeId]` - Get messages for specific trade
- `PUT /api/messages/read/[id]` - Mark message as read

### Users
- `GET /api/users/[id]` - Get public user profile
- `GET /api/users/me` - Get current user full profile
- `PUT /api/users/profile` - Update own profile

Note: Search radius is hard-coded to 10km

## Layout Guidelines

### Bottom Navigation
- The `BottomNav` component is fixed at the bottom with height of 64px (h-16 / 4rem)
- All pages need bottom padding to prevent content from being hidden behind the navigation

### AuthLayout Usage
The `AuthLayout` component wraps authenticated pages and supports two variants:

1. **Default variant** (most pages):
   ```tsx
   <AuthLayout>
     {/* Automatically adds pb-16 to account for bottom nav */}
   </AuthLayout>
   ```

2. **fullHeight variant** (special layouts like conversation view):
   ```tsx
   <AuthLayout variant="fullHeight">
     {/* No automatic bottom padding - manage it yourself */}
   </AuthLayout>
   ```

### When to use each variant:
- **Default**: Standard pages with scrollable content (home, messages list, offer details)
- **fullHeight**: Pages with custom layouts that manage their own spacing (conversation view with fixed header/footer)

### Important: 
- If using `fullHeight` variant, remember to add `pb-16` where needed to prevent content hiding
- The conversation view uses a flex layout with its own `pb-16` to handle the special message input area