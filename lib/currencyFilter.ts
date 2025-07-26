// Currency and money-related filtering for barter-only platform
import { validateContent as validateContentModeration } from './contentModeration'

// Exceptions for words that can have non-financial meanings
const CHARGE_EXCEPTIONS = [
  /\bcharging\s+(?:cable|cord|wire|block|adapter|station|port|dock|pad|mat|stand|base)\b/gi,
  /\b(?:phone|device|battery|electric|electrical|power|usb|wireless|fast|quick|rapid|solar)\s+charg(?:e|er|ing)\b/gi,
  /\bcharg(?:e|er|ing)\s+(?:port|cable|cord|wire|block|adapter|station|dock|pad|mat|stand|base|device|battery)\b/gi,
  /\b(?:car|wall|portable|wireless|fast|quick|rapid|solar|phone|laptop|tablet)\s+charger\b/gi,
  /\bcharger\s+(?:cable|cord|wire|block|adapter|port|for)\b/gi,
]

const BILL_EXCEPTIONS = [
  /\bbill\s+(?:of\s+)?(?:materials|lading|sale|rights|health)\b/gi,
  /\b(?:dollar|five|ten|twenty|hundred)\s+(?:dollar\s+)?bill\b/gi,
  /\bbill\s+(?:gates|clinton|murray|nye)\b/gi, // Common names
]

const BANK_EXCEPTIONS = [
  /\b(?:river|blood|memory|data|food|seed|gene|sperm|eye|snow)\s+bank\b/gi,
  /\bbank\s+(?:statement|holiday|robber|robbery|shot|run)\b/gi,
]

const TIP_EXCEPTIONS = [
  /\btip\s+(?:of|over|jar|off|toe|calculator)\b/gi,
  /\b(?:pro|helpful|useful|quick|safety|travel|cooking|cleaning)\s+tips?\b/gi,
  /\btips?\s+(?:and|for|on|to)\b/gi,
]

const RENT_EXCEPTIONS = [
  /\brent\s+(?:a|an|control|stabilized|free|out|apart|asunder)\b/gi,
  /\b(?:for|to)\s+rent(?:al)?\b/gi,
]

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
  /\bloan\b/gi,
  /\bdebt\b/gi,
  /\bcredit\b/gi,
  /\batm\b/gi,
  /\bwallet\b/gi,
  /\bincome\b/gi,
  /\bsalary\b/gi,
  /\bwage\b/gi,
  /\bwages\b/gi,
  /\bcommission\b/gi,
  /\bfee\b/gi,
  /\bfees\b/gi,
  /\bcharge\b/gi,
  /\bcharging\b/gi,
  /\bbill\b/gi,
  /\bbilling\b/gi,
  /\bbank\b/gi,
  /\btip\b/gi,
  /\btips\b/gi,
  /\brent\b/gi,
  /\brental\b/gi,
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
  
  // Check if text matches any exception patterns first
  const hasChargeException = CHARGE_EXCEPTIONS.some(pattern => pattern.test(text))
  const hasBillException = BILL_EXCEPTIONS.some(pattern => pattern.test(text))
  const hasBankException = BANK_EXCEPTIONS.some(pattern => pattern.test(text))
  const hasTipException = TIP_EXCEPTIONS.some(pattern => pattern.test(text))
  const hasRentException = RENT_EXCEPTIONS.some(pattern => pattern.test(text))
  
  if (hasChargeException || hasBillException || hasBankException || hasTipException || hasRentException) {
    return false
  }
  
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