import { supabase } from "@/integrations/supabase/client";

const STORAGE_PREFIX = "storage://class-materials/";

/**
 * Check if a content_ref is a storage path (private bucket).
 */
export function isStoragePath(ref: string): boolean {
  return ref.startsWith(STORAGE_PREFIX);
}

/**
 * Check if a content_ref is a legacy public URL from the class-materials bucket.
 */
export function isLegacyPublicUrl(ref: string): boolean {
  return ref.includes("/storage/v1/object/public/class-materials/");
}

/**
 * Extract the storage file path from a content_ref (handles both new and legacy formats).
 */
function extractPath(ref: string): string | null {
  if (ref.startsWith(STORAGE_PREFIX)) {
    return ref.slice(STORAGE_PREFIX.length);
  }
  // Legacy public URL format
  const marker = "/storage/v1/object/public/class-materials/";
  const idx = ref.indexOf(marker);
  if (idx !== -1) {
    return ref.slice(idx + marker.length);
  }
  return null;
}

/**
 * Resolve a material content_ref to a usable URL.
 * For storage paths, generates a 1-hour signed URL.
 * For regular URLs, returns as-is.
 */
export async function resolveMaterialUrl(ref: string): Promise<string> {
  const path = extractPath(ref);
  if (!path) return ref;

  const { data, error } = await supabase.storage
    .from("class-materials")
    .createSignedUrl(path, 3600); // 1 hour

  if (error || !data?.signedUrl) {
    console.error("Failed to create signed URL:", error);
    return ref; // fallback
  }
  return data.signedUrl;
}

/**
 * Check if a content_ref needs signed URL resolution.
 */
export function needsSignedUrl(ref: string): boolean {
  return isStoragePath(ref) || isLegacyPublicUrl(ref);
}
