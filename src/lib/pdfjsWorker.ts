/**
 * Centralized PDF.js worker configuration.
 * 
 * CRITICAL: react-pdf bundles its own version of pdfjs-dist internally.
 * We MUST use the pdfjs object from react-pdf and configure the worker
 * to match that version. This ensures API version matches worker version.
 * 
 * DO NOT import from 'pdfjs-dist' directly for PDF operations - always
 * use the pdfjs export from this module or from react-pdf.
 * 
 * NOTE: This module is NOT eagerly imported in main.tsx to avoid pulling
 * ~100KB of vendor-pdf into the critical rendering chain. Instead, call
 * ensurePdfWorkerConfigured() in any component that needs PDF support.
 */
import { pdfjs } from 'react-pdf';

let configured = false;

function getWorkerSrc(): string {
  return new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

// Safety function to verify/reset worker config — call before any PDF usage
export function ensurePdfWorkerConfigured(): void {
  if (configured) return;
  
  const currentSrc = pdfjs.GlobalWorkerOptions.workerSrc;
  
  if (!currentSrc || currentSrc.includes('cdnjs') || currentSrc.includes('unpkg')) {
    pdfjs.GlobalWorkerOptions.workerSrc = getWorkerSrc();
  }
  configured = true;
}

// Export pdfjs for components that need direct access (text extraction, etc.)
export { pdfjs };

// Export the worker URL for reference
export const pdfWorkerUrl = pdfjs.GlobalWorkerOptions.workerSrc || getWorkerSrc();
