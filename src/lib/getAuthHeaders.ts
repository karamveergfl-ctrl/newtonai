import { supabase } from "@/integrations/supabase/client";

/**
 * Get auth session and return headers for edge function calls.
 * Throws if not authenticated.
 */
export async function getAuthHeaders(): Promise<{
  headers: Record<string, string>;
  accessToken: string;
}> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  return {
    accessToken: session.access_token,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
  };
}
