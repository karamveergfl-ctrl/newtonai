/**
 * Centralized PDF.js worker configuration.
 * 
 * CRITICAL: react-pdf bundles its own version of pdfjs-dist internally.
 * We MUST use the pdfjs object from react-pdf and configure the worker
 * to match that version. This ensures API version matches worker version.
 * 
 * DO NOT import from 'pdfjs-dist' directly for PDF operations - always
 * use the pdfjs export from this module or from react-pdf.
 */
import { pdfjs } from 'react-pdf';

// Configure worker using react-pdf's bundled pdfjs version
// This ensures the worker version matches the API version
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Export pdfjs for components that need direct access (text extraction, etc.)
export { pdfjs };

// Export the worker URL for reference
export const pdfWorkerUrl = pdfjs.GlobalWorkerOptions.workerSrc;

// Safety function to verify/reset worker config
export function ensurePdfWorkerConfigured(): void {
  const currentSrc = pdfjs.GlobalWorkerOptions.workerSrc;
  
  // If workerSrc is empty or pointing to CDN, reset it
  if (!currentSrc || currentSrc.includes('cdnjs') || currentSrc.includes('unpkg')) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
}
