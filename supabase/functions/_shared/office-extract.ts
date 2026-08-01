/**
 * Text extraction for Office documents (DOCX / PPTX).
 * Both formats are ZIP packages of XML — we read the relevant parts and
 * return page-like blocks that can be rendered on a classroom display.
 */

export interface ExtractedPage {
  title: string;
  blocks: string[];
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&");
}

export function base64ToBytes(base64: string): Uint8Array {
  const raw = base64.includes(",") ? base64.split(",").pop()! : base64;
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// deno-lint-ignore no-explicit-any
async function loadZip(bytes: Uint8Array): Promise<any> {
  const JSZip = (await import("https://esm.sh/jszip@3.10.1")).default;
  return await JSZip.loadAsync(bytes);
}

/** DOCX → pages split on Heading paragraphs, so long documents page sensibly. */
export async function extractDocxPages(bytes: Uint8Array, fallbackTitle: string): Promise<ExtractedPage[]> {
  const zip = await loadZip(bytes);
  const xml: string | undefined = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("Invalid DOCX file: missing document.xml");

  const pages: ExtractedPage[] = [];
  let current: ExtractedPage = { title: fallbackTitle, blocks: [] };

  const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
  let pMatch: RegExpExecArray | null;

  while ((pMatch = paragraphRegex.exec(xml)) !== null) {
    const content = pMatch[1];
    const isHeading = /<w:pStyle[^>]*w:val="(Heading\d|Title)"/i.test(content);

    const runs: string[] = [];
    const runRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let rMatch: RegExpExecArray | null;
    while ((rMatch = runRegex.exec(content)) !== null) runs.push(decodeXmlEntities(rMatch[1]));

    const text = runs.join("").trim();
    if (!text) continue;

    if (isHeading) {
      if (current.blocks.length > 0) pages.push(current);
      current = { title: text, blocks: [] };
    } else {
      current.blocks.push(text);
      // Keep pages readable on a large display.
      if (current.blocks.length >= 14) {
        pages.push(current);
        current = { title: `${current.title} (cont.)`, blocks: [] };
      }
    }
  }

  if (current.blocks.length > 0) pages.push(current);
  if (pages.length === 0) throw new Error("No readable text was found in this document.");
  return pages;
}

/** PPTX → one page per slide, first text node treated as the slide title. */
export async function extractPptxPages(bytes: Uint8Array): Promise<ExtractedPage[]> {
  const zip = await loadZip(bytes);

  const slideFiles: { name: string; num: number }[] = [];
  zip.forEach((relativePath: string) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/);
    if (match) slideFiles.push({ name: relativePath, num: parseInt(match[1], 10) });
  });
  slideFiles.sort((a, b) => a.num - b.num);

  if (slideFiles.length === 0) throw new Error("Invalid PPTX file: no slides found.");

  const pages: ExtractedPage[] = [];

  for (const slide of slideFiles) {
    const xml: string | undefined = await zip.file(slide.name)?.async("string");
    if (!xml) continue;

    const lines: string[] = [];
    // Group text per shape paragraph so bullets stay separate lines.
    const paraRegex = /<a:p>([\s\S]*?)<\/a:p>/g;
    let paraMatch: RegExpExecArray | null;
    while ((paraMatch = paraRegex.exec(xml)) !== null) {
      const runRegex = /<a:t>([^<]*)<\/a:t>/g;
      const runs: string[] = [];
      let rMatch: RegExpExecArray | null;
      while ((rMatch = runRegex.exec(paraMatch[1])) !== null) runs.push(decodeXmlEntities(rMatch[1]));
      const text = runs.join("").trim();
      if (text) lines.push(text);
    }

    const title = lines.length > 0 ? lines[0] : `Slide ${slide.num}`;
    pages.push({ title: `Slide ${slide.num} · ${title}`, blocks: lines.slice(1) });
  }

  if (pages.length === 0) throw new Error("No readable text was found in this presentation.");
  return pages;
}