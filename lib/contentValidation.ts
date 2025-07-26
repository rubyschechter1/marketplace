import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validates content using AI to check for inappropriate content and currency references
 * @param text The text to validate
 * @param fieldName The name of the field being validated (for error messages)
 * @param context The context where this content appears ('offer', 'message', 'profile', 'review')
 * @returns ValidationResult with isValid flag and optional error message
 */
export async function validateContent(
  text: string, 
  fieldName: string = 'This field',
  context: 'offer' | 'message' | 'profile' | 'review' = 'offer'
): Promise<ValidationResult> {
  if (!text || text.trim().length === 0) {
    return { isValid: true }
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      temperature: 0,
      system: `You are a content moderation system for a bartering marketplace where NO MONEY or currency can be exchanged - only items can be traded for other items.

Your job is to check if the text contains:
1. Any references to money, currency, prices, payment, or financial transactions
2. Inappropriate content like profanity, hate speech, sexual content, violence, illegal activities, or spam

Context: The text is from a ${context} on the platform.

Respond with a JSON object:
{
  "valid": true/false,
  "reason": "Brief explanation if invalid"
}

Be reasonable - allow normal conversation and item descriptions. Only flag content that clearly violates the rules.`,
      messages: [{
        role: 'user',
        content: `Please validate this text: "${text}"`
      }]
    })

    // Parse the response
    const content = response.content[0]
    if (content.type === 'text') {
      try {
        const result = JSON.parse(content.text)
        
        if (!result.valid) {
          // Log the AI's reason for debugging (not shown to user)
          console.log(`Content validation failed for "${fieldName}":`, result.reason)
          
          // Use standardized error messages based on violation type
          let errorMessage: string
          
          // Check the AI's reason to determine violation type
          const reason = result.reason?.toLowerCase() || ''
          
          if (reason.includes('currency') || 
              reason.includes('money') ||
              reason.includes('price') ||
              reason.includes('payment') ||
              reason.includes('cash') ||
              reason.includes('dollar') ||
              reason.includes('euro') ||
              reason.includes('sell') ||
              reason.includes('buy')) {
            errorMessage = `${fieldName} cannot contain currency symbols or money-related terms. This is a bartering platform - no money involved! 🤝`
          } else if (reason.includes('profan') ||
                     reason.includes('inappropriate') ||
                     reason.includes('offensive') ||
                     reason.includes('hate') ||
                     reason.includes('sexual') ||
                     reason.includes('violence') ||
                     reason.includes('drug') ||
                     reason.includes('illegal')) {
            errorMessage = `${fieldName} contains inappropriate content. Please keep your language respectful and family-friendly.`
          } else {
            // Generic message for other violations
            errorMessage = `${fieldName} contains content that violates our community guidelines. Please review and revise.`
          }
          
          return {
            isValid: false,
            error: errorMessage
          }
        }
        
        return { isValid: true }
      } catch (parseError) {
        console.error('Failed to parse AI response:', content.text)
        // If we can't parse the response, err on the side of allowing the content
        return { isValid: true }
      }
    }
    
    return { isValid: true }
  } catch (error) {
    console.error('Content validation error:', error)
    // If the AI service fails, allow the content rather than blocking users
    return { isValid: true }
  }
}

/**
 * Validates multiple fields at once
 * @param fields Array of {text, fieldName, context} objects
 * @returns ValidationResult for the first invalid field, or success if all valid
 */
export async function validateMultipleFields(
  fields: Array<{
    text: string
    fieldName: string
    context?: 'offer' | 'message' | 'profile' | 'review'
  }>
): Promise<ValidationResult> {
  for (const field of fields) {
    const result = await validateContent(field.text, field.fieldName, field.context || 'offer')
    if (!result.isValid) {
      return result
    }
  }
  return { isValid: true }
}