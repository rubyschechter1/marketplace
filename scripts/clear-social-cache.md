# Clear Social Media Link Preview Cache

The OG image has been updated to use linkimage.png with a tan background, but social media platforms cache link previews aggressively. Here's how to force a refresh:

## Manual Cache Clearing

### Facebook/Meta (including Instagram)
1. Visit: https://developers.facebook.com/tools/debug/
2. Enter your URL: `https://brownstrawhat.com`
3. Click "Debug" then "Scrape Again" to force refresh

### Twitter/X
1. Visit: https://cards-dev.twitter.com/validator
2. Enter your URL: `https://brownstrawhat.com`
3. Click "Preview card" to refresh cache

### LinkedIn
1. Visit: https://www.linkedin.com/post-inspector/
2. Enter your URL: `https://brownstrawhat.com`
3. Click "Inspect" to refresh cache

### iMessage (iOS)
- iMessage cache typically clears within 24-48 hours
- You can try sharing a different URL format like `https://brownstrawhat.com/` vs `https://brownstrawhat.com` (with/without trailing slash)

## Technical Changes Made

1. **Updated OG Image**: Now using linkimage.png with tan background (#ffebb5)
2. **Added Cache-busting**: Added `?v=1` parameter to image URLs
3. **Added Theme Color**: Added theme-color meta tag for browser consistency
4. **Changed Image Path**: Updated from og-image.png to images/linkimage.png

## Current Status
- ✅ Using linkimage.png for social media previews
- ✅ Cache-busting parameters added (?v=1)
- ✅ Meta tags updated with new image path
- 🔄 Waiting for social media cache refresh (24-48 hours for automatic refresh)

## Next Steps
1. Use the manual cache clearing tools above
2. Test link sharing after deploying changes
3. If still showing old image, increment version to ?v=2 and repeat process