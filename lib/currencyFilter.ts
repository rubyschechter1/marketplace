// Currency and money-related filtering for barter-only platform
import { validateContent as validateContentModeration } from './contentModeration'

const CURRENCY_PATTERNS = [
  // Currency symbols
  /\$/g, // Dollar sign
  /€/g, // Euro
  /£/g, // Pound
  /¥/g, // Yen
  /₹/g, // Rupee
  /₽/g, // Ruble
  /₩/g, // Won
  /¢/g, // Cent
  /₦/g, // Naira
  /₨/g, // Rupee variants
  /₪/g, // Shekel
  /₫/g, // Dong
  /₴/g, // Hryvnia
  /₸/g, // Tenge
  /₵/g, // Cedi
  /₶/g, // Livre
  /₷/g, // Spesmilo
  /₹/g, // Indian Rupee
  /₺/g, // Turkish Lira
  /₻/g, // Nordic Mark
  /₼/g, // Manat
  /₽/g, // Russian Ruble
  /₾/g, // Lari
  /₿/g, // Bitcoin
  
  // Money-related words (case insensitive)
  /\bmoney\b/gi,
  /\bcash\b/gi,
  /\bpay\b/gi,
  /\bpaid\b/gi,
  /\bpaying\b/gi,
  /\bpayment\b/gi,
  /\bpurchase\b/gi,
  /\bbuy\b/gi,
  /\bbuying\b/gi,
  /\bbought\b/gi,
  /\bsell\b/gi,
  /\bselling\b/gi,
  /\bsold\b/gi,
  /\bsale\b/gi,
  /\bprice\b/gi,
  /\bpriced\b/gi,
  /\bpricing\b/gi,
  /\bcost\b/gi,
  /\bcosting\b/gi,
  /\bexpensive\b/gi,
  /\bcheap\b/gi,
  /\bafford\b/gi,
  /\brent\b/gi,
  /\brental\b/gi,
  /\bloan\b/gi,
  /\bdebt\b/gi,
  /\bcredit\b/gi,
  /\bbank\b/gi,
  /\batm\b/gi,
  /\bwallet\b/gi,
  /\bincome\b/gi,
  /\bsalary\b/gi,
  /\bwage\b/gi,
  /\bwages\b/gi,
  /\btip\b/gi,
  /\btips\b/gi,
  /\bcommission\b/gi,
  /\bfee\b/gi,
  /\bfees\b/gi,
  /\bcharge\b/gi,
  /\bcharging\b/gi,
  /\bbill\b/gi,
  /\bbilling\b/gi,
  /\binvoice\b/gi,
  /\breceipt\b/gi,
  /\brefund\b/gi,
  /\bdiscount\b/gi,
  /\btax\b/gi,
  /\btaxes\b/gi,
  
  // Currency codes (ISO 4217)
  /\bUSD\b/gi,
  /\bEUR\b/gi,
  /\bGBP\b/gi,
  /\bJPY\b/gi,
  /\bCHF\b/gi,
  /\bCAD\b/gi,
  /\bAUD\b/gi,
  /\bCNY\b/gi,
  /\bINR\b/gi,
  /\bKRW\b/gi,
  /\bBRL\b/gi,
  /\bRUB\b/gi,
  /\bMXN\b/gi,
  /\bZAR\b/gi,
  /\bSGD\b/gi,
  /\bHKD\b/gi,
  /\bNOK\b/gi,
  /\bSEK\b/gi,
  /\bDKK\b/gi,
  /\bPLN\b/gi,
  /\bCZK\b/gi,
  /\bHUF\b/gi,
  /\bTRY\b/gi,
  /\bILS\b/gi,
  /\bAED\b/gi,
  /\bSAR\b/gi,
  /\bTHB\b/gi,
  /\bMYR\b/gi,
  /\bIDR\b/gi,
  /\bPHP\b/gi,
  /\bVND\b/gi,
  /\bBTC\b/gi,
  /\bETH\b/gi,
  
  // Common currency words in other languages
  /\bdinero\b/gi, // Spanish
  /\bargent\b/gi, // French
  /\bgeld\b/gi, // German/Dutch
  /\bsoldi\b/gi, // Italian
  /\bdinheiro\b/gi, // Portuguese
  /\bденьги\b/gi, // Russian
  /\b钱\b/gi, // Chinese
  /\bお金\b/gi, // Japanese
  /\b돈\b/gi, // Korean
  
  // Number + currency patterns
  /\b\d+\s*(?:dollars?|euros?|pounds?|yen|cents?)\b/gi,
  /\b(?:dollars?|euros?|pounds?|yen|cents?)\s*\d+\b/gi,
  
  // Common money expressions
  /\bworth\s+\$?\d+/gi,
  /\bvalued?\s+at\s+\$?\d+/gi,
  /\bcosts?\s+\$?\d+/gi,
  /\bpriced?\s+at\s+\$?\d+/gi,
]

export function containsCurrency(text: string): boolean {
  if (!text) return false
  
  return CURRENCY_PATTERNS.some(pattern => pattern.test(text))
}

export function filterCurrency(text: string): string {
  if (!text) return text
  
  let filtered = text
  
  // Replace currency patterns with [CURRENCY_NOT_ALLOWED]
  CURRENCY_PATTERNS.forEach(pattern => {
    filtered = filtered.replace(pattern, '[CURRENCY_NOT_ALLOWED]')
  })
  
  return filtered
}

export function getCurrencyError(fieldName: string = 'This field'): string {
  return `${fieldName} cannot contain currency symbols or money-related terms. This is a bartering platform - no money involved! 🤝`
}

export function validateNoCurrency(text: string, fieldName: string = 'This field', context: 'offer' | 'message' | 'profile' | 'review' = 'offer'): { isValid: boolean; error?: string } {
  // First check for inappropriate content
  const contentCheck = validateContentModeration(text, fieldName, context)
  if (!contentCheck.isValid) {
    return contentCheck
  }

  // Then check for currency content
  if (containsCurrency(text)) {
    return {
      isValid: false,
      error: getCurrencyError(fieldName)
    }
  }
  
  return { isValid: true }
}