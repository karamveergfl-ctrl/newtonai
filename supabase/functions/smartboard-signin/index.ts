import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json, newDeviceToken, serviceClient, sha256 } from "../_shared/smartboard-auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ success: false, error: "unauthenticated", message: "Please sign in with your school account." }, 401);
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return json({ success: false, error: "unauthenticated", message: "Please sign in with your school account." }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const boardId = typeof body.boardId === "string" ? body.boardId : null;

    const supabase = serviceClient();

    const { data: membership } = await supabase
      .from("sb_institution_admins")
      .select("institution_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!membership) {
      return json({
        success: false,
        error: "not_school_account",
        message: "This account is not registered as a SmartBoard school account.",
      }, 403);
    }

    const { data: inst } = await supabase
      .from("sb_institutions")
      .select("id, name, is_active, expires_at")
      .eq("id", membership.institution_id)
      .maybeSingle();

    if (!inst?.is_active) {
      return json({
        success: false,
        error: "institution_inactive",
        message: "Your school's SmartBoard plan is not active. Please contact NewtonAI support.",
      }, 403);
    }
    if (inst.expires_at && new Date(inst.expires_at).getTime() < Date.now()) {
      return json({
        success: false,
        error: "plan_expired",
        message: `Your school's SmartBoard plan expired on ${new Date(inst.expires_at).toLocaleDateString()}. Please renew to continue.`,
      }, 403);
    }

    // No board chosen yet — return the school's boards so the device can pick one.
    if (!boardId) {
      const { data: boards } = await supabase
        .from("sb_boards")
        .select("id, board_name, grade_level, subject_focus, is_active, last_active_at, activated_at")
        .eq("institution_id", inst.id)
        .order("created_at", { ascending: true });

      return json({
        success: true,
        institution: { id: inst.id, name: inst.name },
        boards: (boards ?? []).filter((b) => b.is_active),
      });
    }

    const { data: board } = await supabase
      .from("sb_boards")
      .select("id, board_name, grade_level, subject_focus, is_active, institution_id")
      .eq("id", boardId)
      .eq("institution_id", inst.id)
      .maybeSingle();

    if (!board) {
      return json({ success: false, error: "board_not_found", message: "That board does not belong to your school." }, 404);
    }
    if (!board.is_active) {
      return json({ success: false, error: "board_inactive", message: "This SmartBoard has been deactivated." }, 403);
    }

    const token = newDeviceToken();
    const hash = await sha256(token);
    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("sb_boards")
      .update({ device_token_hash: hash, activated_at: nowIso, last_active_at: nowIso })
      .eq("id", board.id);

    if (updateError) {
      console.error("[smartboard-signin] update failed", updateError);
      return json({ success: false, error: "signin_failed", message: "Could not sign in this board. Please try again." }, 500);
    }

    return json({
      success: true,
      deviceToken: token,
      board: {
        boardId: board.id,
        boardName: board.board_name,
        gradeLevel: board.grade_level,
        subjectFocus: board.subject_focus,
        institutionId: inst.id,
        institutionName: inst.name,
      },
    });
  } catch (e) {
    console.error("[smartboard-signin] error", e);
    return json({ success: false, error: "server_error", message: "Something went wrong. Please try again." }, 500);
  }
});
