/**
 * Shared content processing utilities for study tools
 */
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

// In-memory cache for extracted document text (dedup within session)
const documentCache = new Map<string, { text: string; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getFileCacheKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function getCachedExtraction(file: File): string | null {
  const key = getFileCacheKey(file);
  const cached = documentCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.text;
  }
  documentCache.delete(key);
  return null;
}

function setCachedExtraction(file: File, text: string): void {
  documentCache.set(getFileCacheKey(file), { text, timestamp: Date.now() });
}

/**
 * Convert a File to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Extract text from a PDF file using the extract-pdf-text edge function
 */
export const extractTextFromPDF = async (
  file: File,
  accessToken: string
): Promise<string> => {
  const base64 = await fileToBase64(file);
  
  const response = await fetchWithTimeout(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-text`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ pdfContent: base64 }),
      timeoutMs: 30000,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to extract PDF text" }));
    throw new Error(error.error || "Failed to extract PDF text");
  }

  const { text } = await response.json();
  return text;
};

/**
 * Extract text from an image using OCR (ocr-handwriting edge function)
 */
export const extractTextFromImage = async (
  file: File,
  accessToken: string
): Promise<string> => {
  const base64 = await fileToBase64(file);
  
  const response = await fetchWithTimeout(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-handwriting`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ imageData: base64 }),
      timeoutMs: 30000,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to extract text from image" }));
    throw new Error(error.error || "Failed to extract text from image");
  }

  const { text } = await response.json();
  return text;
};

/**
 * Get transcript from a YouTube video
 */
export const getYouTubeTranscript = async (
  videoId: string,
  accessToken: string
): Promise<string> => {
  const response = await fetchWithTimeout(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-transcript`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ videoId, videoTitle: "Video" }),
      timeoutMs: 20000,
    }
  );

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch transcript");
  }

  if (!data.transcript || data.transcript.length < 20) {
    throw new Error("This video doesn't have captions available. Please try a different video or paste the content directly.");
  }

  return data.transcript;
};

/**
 * Transcribe audio to text
 */
export const transcribeAudio = async (
  audioBase64: string,
  accessToken: string,
  mimeType?: string,
  language?: string
): Promise<string> => {
  const response = await fetchWithTimeout(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ audio: audioBase64, mimeType, language }),
      timeoutMs: 30000,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to transcribe audio" }));
    throw new Error(error.error || "Failed to transcribe audio");
  }

  const { text } = await response.json();
  return text;
};

/**
 * Read text content from a text file
 */
export const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

/**
 * Extract text from a DOCX file using the extract-docx-text edge function
 */
export const extractTextFromDOCX = async (
  file: File,
  accessToken: string
): Promise<string> => {
  const base64 = await fileToBase64(file);
  
  const response = await fetchWithTimeout(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-docx-text`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ docxContent: base64 }),
      timeoutMs: 30000,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to extract DOCX text" }));
    throw new Error(error.error || "Failed to extract DOCX text");
  }

  const { text } = await response.json();
  return text;
};

/**
 * Extract text from a PPTX file using the extract-pptx-text edge function
 */
export const extractTextFromPPTX = async (
  file: File,
  accessToken: string
): Promise<string> => {
  const base64 = await fileToBase64(file);
  
  const response = await fetchWithTimeout(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pptx-text`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ pptxContent: base64 }),
      timeoutMs: 30000,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to extract PPTX text" }));
    throw new Error(error.error || "Failed to extract PPTX text");
  }

  const { text } = await response.json();
  return text;
};

/**
 * Process uploaded file and extract text content
 */
export const processUploadedFile = async (
  file: File,
  accessToken: string
): Promise<string> => {
  if (file.type === "application/pdf") {
    return extractTextFromPDF(file, accessToken);
  }
  
  if (file.type.startsWith("image/")) {
    return extractTextFromImage(file, accessToken);
  }
  
  if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
    return readTextFile(file);
  }
  
  // Handle DOCX files
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword" ||
    file.name.endsWith(".docx") ||
    file.name.endsWith(".doc")
  ) {
    return extractTextFromDOCX(file, accessToken);
  }

  // Handle PPTX/PPT files
  if (
    file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    file.type === "application/vnd.ms-powerpoint" ||
    file.name.endsWith(".pptx") ||
    file.name.endsWith(".ppt")
  ) {
    return extractTextFromPPTX(file, accessToken);
  }
  
  throw new Error(`Unsupported file type: ${file.type}`);
};
