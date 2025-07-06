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
- [x] Read/unread status for messages (partially implemented in conversation API)
- [x] Notification on homepage for when someone makes an offer to your items (proposed trades shown)

### Location
- [x] Location permissions stuff (commit: 003670d - comprehensive location functionality)

## 🔴 High Priority (Core Features)

### Notifications System
- [ ] Notifications (emails, mobile) for messages and proposed trades
- [ ] Add notification (send emails)
- [ ] Notification for messages

### User Experience
- [ ] When making a new account, should bring you to the profile page to fill out profile
- [ ] Handle error when we can't get location from browsers, instruct people to allow location
- [ ] Forgot password flow

### Messaging
- [ ] Switch search & chatbox locations

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