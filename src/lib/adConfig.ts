/**
 * Ad Configuration for Google AdSense Compliance
 * 
 * Set `enabled: false` before submitting for AdSense review.
 * Once approved, set to `true` to display ads.
 */

export const AD_CONFIG = {
  /**
   * Master toggle to enable/disable all ads site-wide.
   * Set to FALSE before AdSense review submission.
   */
  enabled: false,

  /**
   * Minimum content word count required for a page to display ads.
   * Pages with less content should not show ads.
   */
  minContentWords: 400,

  /**
   * Maximum number of ad units allowed per page.
   */
  maxAdsPerPage: 1,
} as const;

export type AdConfig = typeof AD_CONFIG;
