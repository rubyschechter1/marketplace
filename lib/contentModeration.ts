// Comprehensive content moderation system for text and images

// Profanity and inappropriate content patterns
const INAPPROPRIATE_PATTERNS = [
  // Strong profanity
  /\bf\*ck\b/gi, /\bsh\*t\b/gi, /\bass\b/gi, /\bbitch\b/gi, /\bdamn\b/gi,
  /\bfuck\b/gi, /\bshit\b/gi, /\bcunt\b/gi, /\bcock\b/gi, /\bdick\b/gi,
  /\bpussy\b/gi, /\btits\b/gi, /\bnigger\b/gi, /\bfaggot\b/gi, /\bretard\b/gi,
  
  // Sexual content
  /\bsex\b/gi, /\bporn\b/gi, /\bmasturbat\w*\b/gi, /\borgasm\b/gi, /\bviagra\b/gi,
  /\berotic\b/gi, /\badult\s+toy\b/gi, /\bsexy\b/gi, /\bnude\b/gi, /\bnaked\b/gi,
  /\bhorny\b/gi, /\bkinky\b/gi, /\bfetish\b/gi, /\bbdsm\b/gi, /\bxxx\b/gi,
  /\bpenis\b/gi, /\bagina\b/gi, /\bboobs\b/gi, /\btitties\b/gi,
  
  // Hate speech and discrimination
  /\bhate\b/gi, /\bkill\s+yourself\b/gi, /\bradical\b/gi, /\bterrorist\b/gi,
  /\bnazi\b/gi, /\bhitler\b/gi, /\bsupremacist\b/gi, /\bgenocide\b/gi,
  /\bislam\w*\s+terror\b/gi, /\bmuslim\s+terror\b/gi,
  
  // Violence and threats
  /\bkill\b/gi, /\bmurder\b/gi, /\bassassinat\w*\b/gi, /\bbomb\b/gi,
  /\bexplosive\b/gi, /\bweapon\b/gi, /\bgun\b/gi, /\bknife\b/gi,
  /\bthreat\w*\b/gi, /\bharm\b/gi, /\bviolent\b/gi, /\battack\b/gi,
  
  // Drugs and illegal substances
  /\bcocaine\b/gi, /\bheroin\b/gi, /\bmarijuana\b/gi, /\bweed\b/gi, /\bpot\b/gi,
  /\blsd\b/gi, /\becstasy\b/gi, /\bmeth\b/gi, /\bcrack\b/gi, /\bopium\b/gi,
  /\bdrug\s+deal\w*\b/gi, /\bnarcotics\b/gi, /\bsteroid\b/gi,
  
  // Scams and fraud
  /\bscam\b/gi, /\bfraud\b/gi, /\bpyramid\s+scheme\b/gi, /\bponzi\b/gi,
  /\bmoney\s+laundering\b/gi, /\bidentity\s+theft\b/gi, /\bfake\s+id\b/gi,
  
  // Personal information (basic protection)
  /\bssn\b/gi, /\bsocial\s+security\b/gi, /\bcredit\s+card\b/gi,
  /\bpassword\b/gi, /\bank\s+account\b/gi,
  
  // Spam indicators
  /\bclick\s+here\b/gi, /\bfree\s+money\b/gi, /\bget\s+rich\b/gi,
  /\bmake\s+money\s+fast\b/gi, /\bwork\s+from\s+home\b/gi,
  
  // Common substitutions and leetspeak
  /\bf\*\*k\b/gi, /\bs\*\*t\b/gi, /\bf\/ck\b/gi, /\bsh1t\b/gi,
  /\bf4gg0t\b/gi, /\bn1gg3r\b/gi, /\b5h1t\b/gi, /\bf0ck\b/gi,
  
  // URL patterns for external links (potential scams)
  /https?:\/\/(?!.*\b(?:imgur|cloudinary|vercel|netlify|github)\b)[\w\-\.]+/gi,
  
  // Excessive repetition (spam)
  /(.)\1{10,}/gi, // Same character repeated 10+ times
  /(\w+\s+)\1{5,}/gi, // Same word repeated 5+ times
]

// Additional contextual inappropriate content
const CONTEXTUAL_INAPPROPRIATE = [
  // Dating/hookup related
  /\bhookup\b/gi, /\bone\s+night\s+stand\b/gi, /\bcasual\s+sex\b/gi,
  /\bfwb\b/gi, /\bfriends\s+with\s+benefits\b/gi, /\bsugar\s+daddy\b/gi,
  /\bsugar\s+baby\b/gi, /\bescort\b/gi, /\bprostitut\w*\b/gi,
  
  // Inappropriate trade requests
  /\bused\s+underwear\b/gi, /\bused\s+panties\b/gi, /\bused\s+bra\b/gi,
  /\bbody\s+fluids\b/gi, /\bhair\s+samples\b/gi, /\bnail\s+clippings\b/gi,
  
  // Age-inappropriate content
  /\b\d+\s*y\.?o\.?\s+girl\b/gi, /\b\d+\s*year\s+old\s+girl\b/gi,
  /\bminor\b/gi, /\bunderage\b/gi, /\bchild\b/gi, /\bkid\b/gi,
  
  // Alcohol and tobacco (depending on platform policy)
  /\bbeer\b/gi, /\bwine\b/gi, /\bvodka\b/gi, /\bwhiskey\b/gi,
  /\bcigarette\b/gi, /\btobacco\b/gi, /\bvape\b/gi, /\be-cigarette\b/gi,
]

// Severity levels for different types of content
enum ContentSeverity {
  LOW = 'low',           // Minor profanity, might be acceptable
  MEDIUM = 'medium',     // Inappropriate but not dangerous
  HIGH = 'high',         // Harmful, hate speech, explicit sexual content
  CRITICAL = 'critical'  // Illegal, threats, extremely harmful
}

interface ModerationResult {
  isAppropriate: boolean
  severity: ContentSeverity
  flaggedContent: string[]
  reason: string
  suggestion?: string
}

// High severity patterns that should always be blocked
const HIGH_SEVERITY_PATTERNS = [
  /\bnigger\b/gi, /\bfaggot\b/gi, /\bretard\b/gi, /\bcunt\b/gi,
  /\bkill\s+yourself\b/gi, /\bsuicide\b/gi, /\bnazi\b/gi, /\bhitler\b/gi,
  /\bterrorist\b/gi, /\bbomb\b/gi, /\bexplosive\b/gi, /\bweapon\b/gi,
  /\bcocaine\b/gi, /\bheroin\b/gi, /\bmeth\b/gi, /\bcrack\b/gi,
  /\bchild\s+porn\b/gi, /\bunderage\s+sex\b/gi,
]

// Medium severity patterns
const MEDIUM_SEVERITY_PATTERNS = [
  /\bfuck\b/gi, /\bshit\b/gi, /\bbitch\b/gi, /\bass\b/gi,
  /\bsex\b/gi, /\bporn\b/gi, /\bnude\b/gi, /\bnaked\b/gi,
  /\bweed\b/gi, /\bmarijuana\b/gi, /\bpot\b/gi,
  /\bscam\b/gi, /\bfraud\b/gi,
]

// Low severity patterns (might be contextually appropriate)
const LOW_SEVERITY_PATTERNS = [
  /\bdamn\b/gi, /\bhell\b/gi, /\bcrap\b/gi,
  /\bstupid\b/gi, /\bidiot\b/gi,
]

export function moderateTextContent(text: string, context: 'offer' | 'message' | 'profile' | 'review' = 'offer'): ModerationResult {
  if (!text || text.trim().length === 0) {
    return {
      isAppropriate: true,
      severity: ContentSeverity.LOW,
      flaggedContent: [],
      reason: 'Empty content'
    }
  }

  const flaggedContent: string[] = []
  let highestSeverity = ContentSeverity.LOW

  // Check for high severity content first
  for (const pattern of HIGH_SEVERITY_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      flaggedContent.push(...matches)
      highestSeverity = ContentSeverity.CRITICAL
    }
  }

  // Check for medium severity content
  if (highestSeverity !== ContentSeverity.CRITICAL) {
    for (const pattern of MEDIUM_SEVERITY_PATTERNS) {
      const matches = text.match(pattern)
      if (matches) {
        flaggedContent.push(...matches)
        if (highestSeverity !== ContentSeverity.HIGH) {
          highestSeverity = ContentSeverity.HIGH
        }
      }
    }
  }

  // Check for contextual inappropriate content
  if (highestSeverity !== ContentSeverity.CRITICAL && highestSeverity !== ContentSeverity.HIGH) {
    for (const pattern of CONTEXTUAL_INAPPROPRIATE) {
      const matches = text.match(pattern)
      if (matches) {
        flaggedContent.push(...matches)
        highestSeverity = ContentSeverity.MEDIUM
      }
    }
  }

  // Check for low severity content only if nothing worse found
  if (highestSeverity === ContentSeverity.LOW) {
    for (const pattern of LOW_SEVERITY_PATTERNS) {
      const matches = text.match(pattern)
      if (matches) {
        flaggedContent.push(...matches)
        highestSeverity = ContentSeverity.LOW
      }
    }
  }

  // Check for spam patterns
  const excessiveRepetition = text.match(/(.)\1{10,}/g)
  const wordRepetition = text.match(/(\w+\s+)\1{5,}/g)
  if (excessiveRepetition || wordRepetition) {
    flaggedContent.push('excessive repetition')
    if (highestSeverity === ContentSeverity.LOW) {
      highestSeverity = ContentSeverity.MEDIUM
    }
  }

  // Determine if content is appropriate based on severity and context
  const isAppropriate = highestSeverity === ContentSeverity.LOW || 
    (highestSeverity === ContentSeverity.MEDIUM && context === 'message' && flaggedContent.length <= 2)

  // Generate helpful reason and suggestion
  let reason = 'Content appears appropriate'
  let suggestion: string | undefined

  if (!isAppropriate) {
    switch (highestSeverity) {
      case ContentSeverity.CRITICAL:
        reason = 'Content contains illegal, threatening, or extremely harmful material'
        suggestion = 'Please remove all offensive language and inappropriate content. This type of content is not allowed on our platform.'
        break
      case ContentSeverity.HIGH:
        reason = 'Content contains explicit sexual content, hate speech, or strong profanity'
        suggestion = 'Please use appropriate language. Consider rephrasing your content to be more family-friendly.'
        break
      case ContentSeverity.MEDIUM:
        reason = 'Content contains inappropriate language or potentially harmful material'
        suggestion = 'Please review your content and remove any inappropriate language or references.'
        break
    }
  }

  return {
    isAppropriate,
    severity: highestSeverity,
    flaggedContent: [...new Set(flaggedContent)], // Remove duplicates
    reason,
    suggestion
  }
}

// Image content moderation (for future integration with AI services)
export async function moderateImageContent(imageUrl: string): Promise<ModerationResult> {
  // Placeholder for image moderation - would integrate with services like:
  // - AWS Rekognition
  // - Google Cloud Vision API
  // - Microsoft Azure Content Moderator
  // - Cloudinary AI moderation
  
  try {
    // Basic checks for file extension and size could go here
    const suspiciousExtensions = ['.exe', '.bat', '.sh', '.cmd']
    const extension = imageUrl.split('.').pop()?.toLowerCase()
    
    if (extension && suspiciousExtensions.includes(`.${extension}`)) {
      return {
        isAppropriate: false,
        severity: ContentSeverity.HIGH,
        flaggedContent: ['suspicious file type'],
        reason: 'File type not allowed for images',
        suggestion: 'Please upload only image files (JPG, PNG, GIF, WebP)'
      }
    }

    // For now, assume images are appropriate pending AI service integration
    return {
      isAppropriate: true,
      severity: ContentSeverity.LOW,
      flaggedContent: [],
      reason: 'Image appears appropriate (basic check)'
    }
  } catch (error) {
    console.error('Image moderation error:', error)
    return {
      isAppropriate: false,
      severity: ContentSeverity.MEDIUM,
      flaggedContent: ['moderation error'],
      reason: 'Unable to verify image content',
      suggestion: 'Please try uploading a different image'
    }
  }
}

// Helper function to get user-friendly error message
export function getModerationError(result: ModerationResult, fieldName: string = 'This content'): string {
  if (result.isAppropriate) return ''
  
  const baseMessage = `${fieldName} contains inappropriate content and cannot be posted`
  
  if (result.suggestion) {
    return `${baseMessage}. ${result.suggestion}`
  }
  
  return `${baseMessage}. Please review and remove any offensive or inappropriate language.`
}

// Comprehensive validation function that combines currency and content moderation
export function validateContent(text: string, fieldName: string, context: 'offer' | 'message' | 'profile' | 'review' = 'offer'): { isValid: boolean; error?: string } {
  // First check content moderation
  const moderationResult = moderateTextContent(text, context)
  if (!moderationResult.isAppropriate) {
    return {
      isValid: false,
      error: getModerationError(moderationResult, fieldName)
    }
  }

  return { isValid: true }
}

export { ContentSeverity, type ModerationResult }