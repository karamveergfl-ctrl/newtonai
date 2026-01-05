/**
 * Shared content processing utilities for study tools
 */

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
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-text`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ pdfContent: base64 }),
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
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-handwriting`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ imageData: base64 }),
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
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-transcript`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ videoId, videoTitle: "Video" }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch transcript" }));
    throw new Error(error.error || "Failed to fetch transcript");
  }

  const { transcript } = await response.json();
  return transcript;
};

/**
 * Transcribe audio to text
 */
export const transcribeAudio = async (
  audioBase64: string,
  accessToken: string,
  mimeType?: string
): Promise<string> => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ audio: audioBase64, mimeType }),
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
  
  throw new Error(`Unsupported file type: ${file.type}`);
};
