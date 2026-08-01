import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function newDeviceToken(): string {
  const raw = new Uint8Array(32);
  crypto.getRandomValues(raw);
  return Array.from(raw).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface BoardContext {
  boardId: string;
  boardName: string;
  gradeLevel: string | null;
  subjectFocus: string | null;
  institutionId: string;
  institutionName: string;
}

export type BoardResult =
  | { ok: true; board: BoardContext }
  | { ok: false; status: number; error: string; message: string };

/** Resolves a device token to an active board on an active, unexpired plan. */
export async function resolveBoard(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  deviceToken: unknown,
): Promise<BoardResult> {
  if (typeof deviceToken !== "string" || deviceToken.length < 32) {
    return { ok: false, status: 401, error: "invalid_token", message: "This board is not activated." };
  }

  const hash = await sha256(deviceToken);
  const { data, error } = await supabase
    .from("sb_boards")
    .select("id, board_name, grade_level, subject_focus, is_active, institution_id, sb_institutions(name, is_active, expires_at)")
    .eq("device_token_hash", hash)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, status: 401, error: "invalid_token", message: "This board is not activated." };
  }
  if (!data.is_active) {
    return { ok: false, status: 403, error: "board_inactive", message: "This SmartBoard has been deactivated by your school administrator." };
  }

  const inst = data.sb_institutions;
  if (!inst?.is_active) {
    return { ok: false, status: 403, error: "institution_inactive", message: "Your school's SmartBoard plan is not active. Please contact your administrator." };
  }
  if (inst.expires_at && new Date(inst.expires_at).getTime() < Date.now()) {
    return {
      ok: false,
      status: 403,
      error: "plan_expired",
      message: `Your school's SmartBoard plan expired on ${new Date(inst.expires_at).toLocaleDateString()}. Please renew to continue.`,
    };
  }

  return {
    ok: true,
    board: {
      boardId: data.id,
      boardName: data.board_name,
      gradeLevel: data.grade_level,
      subjectFocus: data.subject_focus,
      institutionId: data.institution_id,
      institutionName: inst.name,
    },
  };
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}