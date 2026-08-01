import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, resolveBoard, serviceClient } from "../_shared/smartboard-auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = serviceClient();
    const auth = await resolveBoard(supabase, body.deviceToken);
    if (!auth.ok) {
      return json({ success: false, error: auth.error, message: auth.message }, auth.status);
    }

    const str = (v: unknown, max = 300) => (typeof v === "string" ? v.slice(0, max) : null);

    await supabase.from("sb_board_usage").insert({
      board_id: auth.board.boardId,
      institution_id: auth.board.institutionId,
      search_query: str(body.query, 200) ?? "",
      video_id: str(body.videoId, 64),
      video_title: str(body.videoTitle),
      video_channel: str(body.videoChannel, 200),
      action: "play",
    });

    await supabase
      .from("sb_boards")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", auth.board.boardId);

    return json({ success: true });
  } catch (e) {
    console.error("[smartboard-log-play] error", e);
    return json({ success: false, error: "server_error" }, 500);
  }
});