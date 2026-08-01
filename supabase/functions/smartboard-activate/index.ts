import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, newDeviceToken, serviceClient, sha256 } from "../_shared/smartboard-auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";

    if (code.length < 5 || code.length > 32) {
      return json({ success: false, error: "invalid_code", message: "Please enter a valid activation code." }, 400);
    }

    const supabase = serviceClient();

    const { data: board, error } = await supabase
      .from("sb_boards")
      .select("id, board_name, grade_level, subject_focus, is_active, institution_id, sb_institutions(name, is_active, expires_at)")
      .eq("activation_code", code)
      .maybeSingle();

    if (error || !board) {
      return json({ success: false, error: "not_found", message: "Invalid activation code. Please check with your school administrator." }, 404);
    }
    if (!board.is_active) {
      return json({ success: false, error: "board_inactive", message: "This SmartBoard has been deactivated by your school administrator." }, 403);
    }

    // deno-lint-ignore no-explicit-any
    const inst = board.sb_institutions as any;
    if (!inst?.is_active) {
      return json({ success: false, error: "institution_inactive", message: "Your school's SmartBoard plan is not active. Please contact your administrator." }, 403);
    }
    if (inst.expires_at && new Date(inst.expires_at).getTime() < Date.now()) {
      return json({
        success: false,
        error: "plan_expired",
        message: `Your school's SmartBoard plan expired on ${new Date(inst.expires_at).toLocaleDateString()}. Please renew to continue.`,
      }, 403);
    }

    const token = newDeviceToken();
    const hash = await sha256(token);

    const { error: updateError } = await supabase
      .from("sb_boards")
      .update({ device_token_hash: hash, activated_at: new Date().toISOString(), last_active_at: new Date().toISOString() })
      .eq("id", board.id);

    if (updateError) {
      console.error("[smartboard-activate] update failed", updateError);
      return json({ success: false, error: "activation_failed", message: "Could not activate this board. Please try again." }, 500);
    }

    return json({
      success: true,
      deviceToken: token,
      board: {
        boardId: board.id,
        boardName: board.board_name,
        gradeLevel: board.grade_level,
        subjectFocus: board.subject_focus,
        institutionId: board.institution_id,
        institutionName: inst.name,
      },
    });
  } catch (e) {
    console.error("[smartboard-activate] error", e);
    return json({ success: false, error: "server_error", message: "Something went wrong. Please try again." }, 500);
  }
});