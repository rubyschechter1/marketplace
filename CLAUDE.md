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

See `schema.sql` for full implementation