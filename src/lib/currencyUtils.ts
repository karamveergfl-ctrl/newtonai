// Multi-currency support utilities

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'PLN' | 'AUD' | 'CAD' | 'SGD';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  PLN: 'zł',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
};

export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  INR: 'Indian Rupee',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  PLN: 'Polish Zloty',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  SGD: 'Singapore Dollar',
};

export const CURRENCY_FLAGS: Record<CurrencyCode, string> = {
  INR: '🇮🇳',
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  PLN: '🇵🇱',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  SGD: '🇸🇬',
};

export const CURRENCY_SHORT_NAMES: Record<CurrencyCode, string> = {
  INR: 'India',
  USD: 'United States',
  EUR: 'Europe',
  GBP: 'United Kingdom',
  PLN: 'Poland',
  AUD: 'Australia',
  CAD: 'Canada',
  SGD: 'Singapore',
};

// Pricing in smallest currency units (paise for INR, cents for USD, etc.)
// Razorpay requires amounts in smallest currency unit
export const PRICING = {
  pro: {
    monthly: {
      INR: 69900,    // ₹699
      USD: 849,      // $8.49
      EUR: 799,      // €7.99
      GBP: 699,      // £6.99
      PLN: 3500,     // zł35
      AUD: 1299,     // A$12.99
      CAD: 1149,     // C$11.49
      SGD: 1149,     // S$11.49
    },
    yearly: {
      INR: 649900,   // ₹6,499
      USD: 7800,     // $78
      EUR: 7400,     // €74
      GBP: 6400,     // £64
      PLN: 32000,    // zł320
      AUD: 11900,    // A$119
      CAD: 10500,    // C$105
      SGD: 10500,    // S$105
    },
  },
  ultra: {
    monthly: {
      INR: 129900,   // ₹1,299
      USD: 1599,     // $15.99
      EUR: 1499,     // €14.99
      GBP: 1299,     // £12.99
      PLN: 6500,     // zł65
      AUD: 2399,     // A$23.99
      CAD: 2149,     // C$21.49
      SGD: 2149,     // S$21.49
    },
    yearly: {
      INR: 1199900,  // ₹11,999
      USD: 14500,    // $145
      EUR: 13500,    // €135
      GBP: 11800,    // £118
      PLN: 59000,    // zł590
      AUD: 21900,    // A$219
      CAD: 19500,    // C$195
      SGD: 19500,    // S$195
    },
  },
};

// Display prices (already formatted)
export const DISPLAY_PRICING = {
  pro: {
    weeklyMonthly: {
      INR: '₹175',
      USD: '$2.12',
      EUR: '€2',
      GBP: '£1.75',
      PLN: 'zł8.75',
      AUD: 'A$3.25',
      CAD: 'C$2.87',
      SGD: 'S$2.87',
    },
    weeklyYearly: {
      INR: '₹125',
      USD: '$1.50',
      EUR: '€1.42',
      GBP: '£1.23',
      PLN: 'zł6.15',
      AUD: 'A$2.29',
      CAD: 'C$2.02',
      SGD: 'S$2.02',
    },
    monthly: {
      INR: '₹699',
      USD: '$8.49',
      EUR: '€7.99',
      GBP: '£6.99',
      PLN: 'zł35',
      AUD: 'A$12.99',
      CAD: 'C$11.49',
      SGD: 'S$11.49',
    },
    yearly: {
      INR: '₹6,499',
      USD: '$78',
      EUR: '€74',
      GBP: '£64',
      PLN: 'zł320',
      AUD: 'A$119',
      CAD: 'C$105',
      SGD: 'S$105',
    },
    yearlySavings: {
      INR: 'Save ₹1,889',
      USD: 'Save $24',
      EUR: 'Save €22',
      GBP: 'Save £20',
      PLN: 'Save zł100',
      AUD: 'Save A$37',
      CAD: 'Save C$33',
      SGD: 'Save S$33',
    },
  },
  ultra: {
    weeklyMonthly: {
      INR: '₹325',
      USD: '$4',
      EUR: '€3.75',
      GBP: '£3.25',
      PLN: 'zł16.25',
      AUD: 'A$6',
      CAD: 'C$5.37',
      SGD: 'S$5.37',
    },
    weeklyYearly: {
      INR: '₹231',
      USD: '$2.79',
      EUR: '€2.60',
      GBP: '£2.27',
      PLN: 'zł11.35',
      AUD: 'A$4.21',
      CAD: 'C$3.75',
      SGD: 'S$3.75',
    },
    monthly: {
      INR: '₹1,299',
      USD: '$15.99',
      EUR: '€14.99',
      GBP: '£12.99',
      PLN: 'zł65',
      AUD: 'A$23.99',
      CAD: 'C$21.49',
      SGD: 'S$21.49',
    },
    yearly: {
      INR: '₹11,999',
      USD: '$145',
      EUR: '€135',
      GBP: '£118',
      PLN: 'zł590',
      AUD: 'A$219',
      CAD: 'C$195',
      SGD: 'S$195',
    },
    yearlySavings: {
      INR: 'Save ₹3,589',
      USD: 'Save $47',
      EUR: 'Save €45',
      GBP: 'Save £38',
      PLN: 'Save zł190',
      AUD: 'Save A$69',
      CAD: 'C$62',
      SGD: 'S$62',
    },
  },
};

// Map email domain TLDs to currency
const TLD_TO_CURRENCY: Record<string, CurrencyCode> = {
  'in': 'INR',
  'pl': 'PLN',
  'de': 'EUR',
  'fr': 'EUR',
  'it': 'EUR',
  'es': 'EUR',
  'nl': 'EUR',
  'be': 'EUR',
  'at': 'EUR',
  'ie': 'EUR',
  'pt': 'EUR',
  'fi': 'EUR',
  'uk': 'GBP',
  'gb': 'GBP',
  'au': 'AUD',
  'ca': 'CAD',
  'sg': 'SGD',
  'us': 'USD',
};

// Map browser locale to currency
const LOCALE_TO_CURRENCY: Record<string, CurrencyCode> = {
  'en-IN': 'INR',
  'hi-IN': 'INR',
  'pl-PL': 'PLN',
  'pl': 'PLN',
  'de-DE': 'EUR',
  'de-AT': 'EUR',
  'fr-FR': 'EUR',
  'fr-BE': 'EUR',
  'it-IT': 'EUR',
  'es-ES': 'EUR',
  'nl-NL': 'EUR',
  'nl-BE': 'EUR',
  'pt-PT': 'EUR',
  'fi-FI': 'EUR',
  'en-GB': 'GBP',
  'en-AU': 'AUD',
  'en-CA': 'CAD',
  'en-SG': 'SGD',
  'en-US': 'USD',
  'en': 'USD', // Default English to USD
};

/**
 * Detect currency from email domain TLD
 */
export function getCurrencyFromEmail(email: string | undefined | null): CurrencyCode | null {
  if (!email) return null;
  
  // Extract TLD from email domain
  const domain = email.split('@')[1];
  if (!domain) return null;
  
  const tld = domain.split('.').pop()?.toLowerCase();
  if (!tld) return null;
  
  return TLD_TO_CURRENCY[tld] || null;
}

/**
 * Detect currency from browser locale
 */
export function getCurrencyFromLocale(): CurrencyCode {
  const locale = navigator.language || navigator.languages?.[0] || 'en-US';
  
  // Try exact match first
  if (LOCALE_TO_CURRENCY[locale]) {
    return LOCALE_TO_CURRENCY[locale];
  }
  
  // Try language code only
  const langCode = locale.split('-')[0];
  if (LOCALE_TO_CURRENCY[langCode]) {
    return LOCALE_TO_CURRENCY[langCode];
  }
  
  // Default to USD for international users
  return 'USD';
}

/**
 * Detect currency based on email (if available) or browser locale
 */
export function detectCurrency(email?: string | null): CurrencyCode {
  // First try email-based detection
  const emailCurrency = getCurrencyFromEmail(email);
  if (emailCurrency) {
    return emailCurrency;
  }
  
  // Fall back to browser locale
  return getCurrencyFromLocale();
}

/**
 * Format amount for display (converts from smallest unit to display format)
 */
export function formatAmount(amountInSmallestUnit: number, currency: CurrencyCode): string {
  const divisor = currency === 'INR' ? 100 : 100; // All currencies use 100 as divisor
  const amount = amountInSmallestUnit / divisor;
  
  const symbol = CURRENCY_SYMBOLS[currency];
  
  // Format with appropriate decimal places
  if (currency === 'INR' || currency === 'PLN') {
    return `${symbol}${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }
  
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Get price for a plan in a specific currency
 */
export function getPrice(
  plan: 'pro' | 'ultra',
  billingCycle: 'monthly' | 'yearly',
  currency: CurrencyCode
): number {
  return PRICING[plan][billingCycle][currency];
}

/**
 * Check if a currency is supported by Razorpay
 */
export function isSupportedCurrency(currency: string): currency is CurrencyCode {
  return currency in CURRENCY_SYMBOLS;
}
