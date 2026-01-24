/**
 * Study content export utilities
 * Supports: Markdown, Plain Text, PDF, PNG
 */

// Helper to trigger download
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Strip markdown formatting for plain text export
export function stripMarkdown(content: string): string {
  return content
    .replace(/#{1,6}\s*/g, '')                    // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1')            // Bold
    .replace(/\*([^*]+)\*/g, '$1')                // Italic
    .replace(/__([^_]+)__/g, '$1')                // Bold alt
    .replace(/_([^_]+)_/g, '$1')                  // Italic alt
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')      // Links
    .replace(/`{3}[\s\S]*?`{3}/g, '')             // Code blocks
    .replace(/`([^`]+)`/g, '$1')                  // Inline code
    .replace(/^\s*[-*+]\s/gm, '• ')               // List items
    .replace(/^\s*\d+\.\s/gm, '')                 // Numbered lists
    .replace(/\|[^|]+\|/g, '')                    // Table cells
    .replace(/[-:]+\|[-:]+/g, '')                 // Table separators
    .replace(/\n{3,}/g, '\n\n')                   // Multiple newlines
    .trim();
}

// Download as Markdown (.md)
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  triggerDownload(blob, `${filename}.md`);
}

// Download as Plain Text (.txt)
export function downloadText(content: string, filename: string): void {
  const plainText = stripMarkdown(content);
  const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8;' });
  triggerDownload(blob, `${filename}.txt`);
}

// Download as PDF using jsPDF + html2canvas
export async function downloadPDF(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;
  const { default: jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    windowHeight: element.scrollHeight,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 10;

  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  // First page
  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - margin * 2;

  // Additional pages if needed
  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save(`${filename}.pdf`);
}

// Download as PNG image
export async function downloadPNG(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    windowHeight: element.scrollHeight,
    logging: false,
  });

  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
