/**
 * Study content export utilities
 * Supports: Markdown, Plain Text, PDF, PNG, DOCX, Clipboard
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

// Copy content to clipboard as formatted text
export async function copyToClipboard(content: string): Promise<boolean> {
  const plainText = stripMarkdown(content);
  
  try {
    await navigator.clipboard.writeText(plainText);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = plainText;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}

// Download as DOCX (Word document)
export async function downloadDOCX(content: string, filename: string): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
  
  const lines = content.split('\n');
  const children: any[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      children.push(new Paragraph({ text: '' }));
      continue;
    }
    
    // Headers
    if (trimmed.startsWith('## ')) {
      children.push(new Paragraph({
        text: trimmed.replace(/^##\s*/, '').replace(/[📚🔑📝📖💡✅📌🎯📋📊🔍📈]\s*/g, ''),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 },
      }));
    } else if (trimmed.startsWith('# ')) {
      children.push(new Paragraph({
        text: trimmed.replace(/^#\s*/, ''),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }));
    } else if (trimmed.startsWith('### ')) {
      children.push(new Paragraph({
        text: trimmed.replace(/^###\s*/, ''),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }));
    }
    // Bullet points
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const text = trimmed.replace(/^[-*]\s*/, '');
      children.push(new Paragraph({
        children: parseInlineFormatting(text, TextRun),
        bullet: { level: 0 },
        spacing: { before: 60, after: 60 },
      }));
    }
    // Numbered list
    else if (/^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s*/, '');
      children.push(new Paragraph({
        children: parseInlineFormatting(text, TextRun),
        numbering: { reference: 'default-numbering', level: 0 },
        spacing: { before: 60, after: 60 },
      }));
    }
    // Regular paragraph
    else {
      children.push(new Paragraph({
        children: parseInlineFormatting(trimmed, TextRun),
        spacing: { before: 120, after: 120 },
      }));
    }
  }
  
  const doc = new Document({
    numbering: {
      config: [{
        reference: 'default-numbering',
        levels: [{
          level: 0,
          format: 'decimal' as const,
          text: '%1.',
          alignment: AlignmentType.START,
        }],
      }],
    },
    sections: [{
      properties: {},
      children,
    }],
  });
  
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${filename}.docx`);
}

// Helper to parse inline formatting (bold, italic)
function parseInlineFormatting(text: string, TextRun: any): any[] {
  const runs: any[] = [];
  let remaining = text;
  
  // Simple pattern matching for **bold** and *italic*
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|__([^_]+)__|_([^_]+)_)/g;
  let lastIndex = 0;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index) }));
    }
    
    // Add formatted text
    if (match[2]) {
      // **bold**
      runs.push(new TextRun({ text: match[2], bold: true }));
    } else if (match[3]) {
      // *italic*
      runs.push(new TextRun({ text: match[3], italics: true }));
    } else if (match[4]) {
      // __bold__
      runs.push(new TextRun({ text: match[4], bold: true }));
    } else if (match[5]) {
      // _italic_
      runs.push(new TextRun({ text: match[5], italics: true }));
    }
    
    lastIndex = pattern.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex) }));
  }
  
  // If no formatting found, return simple text
  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }
  
  return runs;
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
