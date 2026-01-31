/**
 * Bot Detection Utility
 * 
 * Detects automated browsers, bots, and non-human traffic to ensure
 * ad displays only to legitimate users (Monetag compliance).
 */

/**
 * Check if the current user agent appears to be a bot or automated browser
 */
export function isBot(): boolean {
  // Server-side rendering check
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true;
  }

  // Check for automation flags (Selenium, Puppeteer, Playwright, etc.)
  if ((navigator as any).webdriver) {
    return true;
  }

  // Check for missing languages (common in headless browsers)
  if (!navigator.languages || navigator.languages.length === 0) {
    return true;
  }

  // Check for suspicious user agents
  const botPatterns = /headless|phantom|puppeteer|selenium|webdriver|crawl|bot|spider|slurp|baidu|bing|yandex|duckduck/i;
  if (botPatterns.test(navigator.userAgent)) {
    return true;
  }

  // Check for inconsistent screen dimensions (headless browsers often have 0 values)
  if (window.outerWidth === 0 || window.outerHeight === 0) {
    return true;
  }

  // Check for missing plugins (real browsers usually have some)
  // Note: Modern browsers may have 0 plugins due to privacy, so this is a soft check
  if (navigator.plugins && navigator.plugins.length === 0 && !navigator.userAgent.includes('Firefox')) {
    // Only suspicious if also missing other indicators
    if (!window.chrome && !window.safari) {
      // Could be a headless browser
    }
  }

  // Check for automation-related properties
  if ('__nightmare' in window || '__selenium_unwrapped' in window || '__webdriver_evaluate' in window) {
    return true;
  }

  // Check for PhantomJS
  if ((window as any).callPhantom || (window as any)._phantom) {
    return true;
  }

  // All checks passed - likely a real user
  return false;
}

/**
 * Check if the browser environment is suitable for ad display
 * Returns false if any red flags are detected
 */
export function isSafeAdEnvironment(): boolean {
  if (isBot()) {
    return false;
  }

  // Ensure we have a proper document
  if (!document.body) {
    return false;
  }

  // Check if page is visible
  if (document.hidden) {
    return false;
  }

  return true;
}

// Extend Window interface for type safety
declare global {
  interface Window {
    chrome?: unknown;
    safari?: unknown;
    __nightmare?: unknown;
    __selenium_unwrapped?: unknown;
    __webdriver_evaluate?: unknown;
    callPhantom?: unknown;
    _phantom?: unknown;
  }
}
