# Marketplace TODO List

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