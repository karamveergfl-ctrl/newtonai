import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, resolveBoard, serviceClient } from "../_shared/smartboard-auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = serviceClient();
    const result = await resolveBoard(supabase, body.deviceToken);

    if (!result.ok) {
      return json({ success: false, error: result.error, message: result.message }, result.status);
    }

    await supabase
      .from("sb_boards")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", result.board.boardId);

    return json({ success: true, board: result.board });
  } catch (e) {
    console.error("[smartboard-session] error", e);
    return json({ success: false, error: "server_error", message: "Something went wrong. Please try again." }, 500);
  }
});