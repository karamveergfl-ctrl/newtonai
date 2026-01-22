// Multi-currency support utilities

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'PLN' | 'AUD' | 'CAD' | 'SGD';

// Competitor pricing in multiple currencies (approximate conversions based on current rates)
export const COMPETITOR_PRICING: Record<string, Record<CurrencyCode, { monthly: string; yearly: string; monthlyValue: number }>> = {
  chegg: {
    INR: { monthly: '₹1,330', yearly: '₹7,980', monthlyValue: 1330 },
    USD: { monthly: '$15.95', yearly: '$95.40', monthlyValue: 15.95 },
    EUR: { monthly: '€14.99', yearly: '€89.94', monthlyValue: 14.99 },
    GBP: { monthly: '£12.99', yearly: '£77.94', monthlyValue: 12.99 },
    PLN: { monthly: 'zł65', yearly: 'zł390', monthlyValue: 65 },
    AUD: { monthly: 'A$24.99', yearly: 'A$149.94', monthlyValue: 24.99 },
    CAD: { monthly: 'C$21.99', yearly: 'C$131.94', monthlyValue: 21.99 },
    SGD: { monthly: 'S$21.99', yearly: 'S$131.94', monthlyValue: 21.99 },
  },
  quizlet: {
    INR: { monthly: '₹665', yearly: '₹2,999', monthlyValue: 665 },
    USD: { monthly: '$7.99', yearly: '$35.99', monthlyValue: 7.99 },
    EUR: { monthly: '€7.49', yearly: '€33.99', monthlyValue: 7.49 },
    GBP: { monthly: '£6.49', yearly: '£28.99', monthlyValue: 6.49 },
    PLN: { monthly: 'zł33', yearly: 'zł149', monthlyValue: 33 },
    AUD: { monthly: 'A$12.49', yearly: 'A$54.99', monthlyValue: 12.49 },
    CAD: { monthly: 'C$10.99', yearly: 'C$48.99', monthlyValue: 10.99 },
    SGD: { monthly: 'S$10.99', yearly: 'S$48.99', monthlyValue: 10.99 },
  },
  studocu: {
    INR: { monthly: '₹830', yearly: '₹3,990', monthlyValue: 830 },
    USD: { monthly: '$9.99', yearly: '$47.88', monthlyValue: 9.99 },
    EUR: { monthly: '€9.49', yearly: '€45.99', monthlyValue: 9.49 },
    GBP: { monthly: '£7.99', yearly: '£38.99', monthlyValue: 7.99 },
    PLN: { monthly: 'zł40', yearly: 'zł195', monthlyValue: 40 },
    AUD: { monthly: 'A$15.49', yearly: 'A$74.99', monthlyValue: 15.49 },
    CAD: { monthly: 'C$13.49', yearly: 'C$64.99', monthlyValue: 13.49 },
    SGD: { monthly: 'S$13.49', yearly: 'S$64.99', monthlyValue: 13.49 },
  },
  'course-hero': {
    INR: { monthly: '₹1,245', yearly: '₹7,470', monthlyValue: 1245 },
    USD: { monthly: '$14.95', yearly: '$89.70', monthlyValue: 14.95 },
    EUR: { monthly: '€13.99', yearly: '€83.94', monthlyValue: 13.99 },
    GBP: { monthly: '£11.99', yearly: '£71.94', monthlyValue: 11.99 },
    PLN: { monthly: 'zł60', yearly: 'zł360', monthlyValue: 60 },
    AUD: { monthly: 'A$22.99', yearly: 'A$137.94', monthlyValue: 22.99 },
    CAD: { monthly: 'C$19.99', yearly: 'C$119.94', monthlyValue: 19.99 },
    SGD: { monthly: 'S$19.99', yearly: 'S$119.94', monthlyValue: 19.99 },
  },
  chatgpt: {
    INR: { monthly: '₹1,660', yearly: '₹19,920', monthlyValue: 1660 },
    USD: { monthly: '$20', yearly: '$240', monthlyValue: 20 },
    EUR: { monthly: '€18.99', yearly: '€227.88', monthlyValue: 18.99 },
    GBP: { monthly: '£16.99', yearly: '£203.88', monthlyValue: 16.99 },
    PLN: { monthly: 'zł85', yearly: 'zł1,020', monthlyValue: 85 },
    AUD: { monthly: 'A$30.99', yearly: 'A$371.88', monthlyValue: 30.99 },
    CAD: { monthly: 'C$26.99', yearly: 'C$323.88', monthlyValue: 26.99 },
    SGD: { monthly: 'S$26.99', yearly: 'S$323.88', monthlyValue: 26.99 },
  },
  studyx: {
    INR: { monthly: '₹665', yearly: '₹7,990', monthlyValue: 665 },
    USD: { monthly: '$7.99', yearly: '$95.99', monthlyValue: 7.99 },
    EUR: { monthly: '€7.49', yearly: '€89.99', monthlyValue: 7.49 },
    GBP: { monthly: '£6.49', yearly: '£77.99', monthlyValue: 6.49 },
    PLN: { monthly: 'zł33', yearly: 'zł395', monthlyValue: 33 },
    AUD: { monthly: 'A$12.49', yearly: 'A$149.99', monthlyValue: 12.49 },
    CAD: { monthly: 'C$10.99', yearly: 'C$129.99', monthlyValue: 10.99 },
    SGD: { monthly: 'S$10.99', yearly: 'S$129.99', monthlyValue: 10.99 },
  },
  studyfetch: {
    INR: { monthly: '₹1,580', yearly: '₹18,960', monthlyValue: 1580 },
    USD: { monthly: '$19', yearly: '$228', monthlyValue: 19 },
    EUR: { monthly: '€17.99', yearly: '€215.88', monthlyValue: 17.99 },
    GBP: { monthly: '£15.49', yearly: '£185.88', monthlyValue: 15.49 },
    PLN: { monthly: 'zł78', yearly: 'zł936', monthlyValue: 78 },
    AUD: { monthly: 'A$29.49', yearly: 'A$353.88', monthlyValue: 29.49 },
    CAD: { monthly: 'C$25.49', yearly: 'C$305.88', monthlyValue: 25.49 },
    SGD: { monthly: 'S$25.49', yearly: 'S$305.88', monthlyValue: 25.49 },
  },
};

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

// Map timezone to currency (most reliable for location detection)
const TIMEZONE_TO_CURRENCY: Record<string, CurrencyCode> = {
  // India
  'Asia/Kolkata': 'INR',
  'Asia/Calcutta': 'INR',
  // Poland
  'Europe/Warsaw': 'PLN',
  // UK
  'Europe/London': 'GBP',
  // US
  'America/New_York': 'USD',
  'America/Los_Angeles': 'USD',
  'America/Chicago': 'USD',
  'America/Denver': 'USD',
  'America/Phoenix': 'USD',
  'Pacific/Honolulu': 'USD',
  // Europe (EUR)
  'Europe/Berlin': 'EUR',
  'Europe/Paris': 'EUR',
  'Europe/Rome': 'EUR',
  'Europe/Madrid': 'EUR',
  'Europe/Amsterdam': 'EUR',
  'Europe/Brussels': 'EUR',
  'Europe/Vienna': 'EUR',
  'Europe/Dublin': 'EUR',
  'Europe/Lisbon': 'EUR',
  'Europe/Helsinki': 'EUR',
  // Australia
  'Australia/Sydney': 'AUD',
  'Australia/Melbourne': 'AUD',
  'Australia/Brisbane': 'AUD',
  'Australia/Perth': 'AUD',
  // Canada
  'America/Toronto': 'CAD',
  'America/Vancouver': 'CAD',
  'America/Montreal': 'CAD',
  // Singapore
  'Asia/Singapore': 'SGD',
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
 * Detect currency from browser timezone (most reliable for location)
 */
export function getCurrencyFromTimezone(): CurrencyCode | null {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_TO_CURRENCY[timezone] || null;
  } catch {
    return null;
  }
}

/**
 * Detect currency based on email, timezone, and browser locale (in priority order)
 */
export function detectCurrency(email?: string | null): CurrencyCode {
  // Priority 1: Email TLD (e.g., .in → INR, .pl → PLN)
  const emailCurrency = getCurrencyFromEmail(email);
  if (emailCurrency) {
    return emailCurrency;
  }
  
  // Priority 2: Timezone (most reliable for generic email domains like gmail.com)
  const timezoneCurrency = getCurrencyFromTimezone();
  if (timezoneCurrency) {
    return timezoneCurrency;
  }
  
  // Priority 3: Browser locale
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
