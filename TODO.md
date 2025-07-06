# Marketplace TODO List

## ✅ Completed Features

### UI/UX
- [x] When hovering, or filling out, always have the tan color as the background, not white (commit: 0403bd7)
- [x] When making a new account should say "Welcome!" Not "welcome back" (commit: 56cc248)
- [x] Accept trade button (commit: 78c6ffa)
- [x] Add description on offer component & offer view page (multiple commits)
- [x] Add other button to offer option in product page (commit: a1fdf77)
- [x] Search components should look like homepage (spacing, sizing) (commit: f07b231)
- [x] Asks (home page, search, everywhere) (commits: 0ad9ce4, 9013003, etc.)
- [x] Add "Ruby S. Is offering" - standardize offer component (ProfileThumbnail component created)

### Messaging
- [x] Read/unread status for messages (visual indicators implemented, mark-as-read API exists)
- [x] Notification on homepage for when someone makes an offer to your items (proposed trades shown)

### Location
- [x] Location permissions stuff (commit: 003670d - comprehensive location functionality)

## 🔴 High Priority (Core Features)

### Notifications System
- [ ] Email notifications for new messages and proposed trades
- [ ] Mobile push notifications (future enhancement)
- [ ] In-app notification badges/counts

### User Experience
- [ ] Location permission error handling - show helpful message when denied, offer manual location entry
- [ ] When making a new account, should bring you to the profile page to fill out profile
- [ ] Forgot password flow
- [ ] Loading states and skeleton screens for better UX
- [ ] Error handling for API failures with user-friendly messages

### Navigation
- [ ] Swap positions of search and messages icons in bottom nav (clarification of original request)

## 🟡 Medium Priority (Important Enhancements)

### Safety & Security
- [ ] AI picture safety filter
- [ ] AI text safety filter
- [ ] Photo downscaling (for performance and storage)
- [ ] Blob store photo deletion (cleanup orphaned images)

### Features
- [ ] Make ability to add items to your personal inventory when you make an offer (track items history)
- [ ] Reviews system
- [ ] Fuzzy search

### Technical
- [ ] Thumbnail generation (for better performance)
- [ ] Storage and server log alerts
- [ ] Database indexes for performance
- [ ] Pagination for offers/messages lists

## 🟢 Low Priority (Nice to Have)

### User Experience
- [ ] Confirm your name (verification step)
- [ ] i18n (internationalization)

### AI Features
- [ ] AI generate pictures of Asks

## 📝 Notes

- The messaging system is largely implemented but needs email notifications
- Location functionality is complete but error handling for denied permissions needs work
- Many UI/UX improvements from the list have been completed
- The asks feature is fully implemented across the platform
- Read/unread message status has visual indicators but may need refinement

## 🔧 Technical Debt

- [ ] Add comprehensive test coverage
- [ ] Enable TypeScript strict mode
- [ ] Performance audit and optimizations
- [ ] Code cleanup and refactoring of large components
- [ ] Implement proper logging and monitoring