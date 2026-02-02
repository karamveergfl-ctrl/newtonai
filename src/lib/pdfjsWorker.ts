/**
 * Centralized PDF.js worker configuration.
 * This module configures the worker ONCE at app startup for both:
 * - pdfjs-dist (used for text extraction)
 * - react-pdf (used for rendering)
 * 
 * Using Vite's ?url import ensures the worker is treated as a static asset,
 * avoiding CDN fallbacks and dynamic ESM import failures.
 */
import * as pdfjsLib from 'pdfjs-dist';
import { pdfjs } from 'react-pdf';

// Import worker as a static asset URL (Vite ?url suffix)
// This ensures deterministic loading from the app's origin, not CDN
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure both pdfjs-dist and react-pdf to use the same local worker
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// Export the URL for safety resets if needed
export const pdfWorkerUrl = workerUrl;

// Export a function to verify/reset worker config (belt-and-suspenders)
export function ensurePdfWorkerConfigured(): void {
  const currentSrc = pdfjsLib.GlobalWorkerOptions.workerSrc;
  
  // If workerSrc is empty or pointing to CDN, reset it
  if (!currentSrc || currentSrc.includes('cdnjs') || currentSrc.includes('unpkg')) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  }
}
