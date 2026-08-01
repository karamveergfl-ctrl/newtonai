import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, resolveBoard, serviceClient } from "../_shared/smartboard-auth.ts";
import { base64ToBytes, extractDocxPages, extractPptxPages } from "../_shared/office-extract.ts";

const MAX_BASE64_BYTES = 20 * 1024 * 1024; // ~15 MB source file

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = serviceClient();

    const auth = await resolveBoard(supabase, body.deviceToken);
    if (!auth.ok) {
      return json({ success: false, error: auth.error, message: auth.message }, auth.status);
    }

    const fileName = typeof body.fileName === "string" ? body.fileName.slice(0, 200) : "";
    const fileBase64 = typeof body.fileBase64 === "string" ? body.fileBase64 : "";
    const lower = fileName.toLowerCase();
    const kind = lower.endsWith(".docx") ? "docx" : lower.endsWith(".pptx") ? "pptx" : null;

    if (!kind) {
      return json(
        { success: false, error: "unsupported_type", message: "Only Word (.docx) and PowerPoint (.pptx) files can be opened this way." },
        400,
      );
    }
    if (!fileBase64) {
      return json({ success: false, error: "missing_file", message: "No file content was received." }, 400);
    }
    if (fileBase64.length > MAX_BASE64_BYTES) {
      return json(
        { success: false, error: "file_too_large", message: "This file is too large. Please use a file under 15 MB." },
        413,
      );
    }

    let pages;
    try {
      const bytes = base64ToBytes(fileBase64);
      pages = kind === "docx"
        ? await extractDocxPages(bytes, fileName.replace(/\.[^.]+$/, ""))
        : await extractPptxPages(bytes);
    } catch (e) {
      console.error("[smartboard-extract-document] parse failed", e);
      return json(
        {
          success: false,
          error: "parse_failed",
          message: e instanceof Error ? e.message : "This file could not be read.",
        },
        422,
      );
    }

    // Usage log for the school's report (best effort).
    await supabase.from("sb_board_usage").insert({
      board_id: auth.board.boardId,
      institution_id: auth.board.institutionId,
      search_query: fileName,
      action: "document_open",
    });

    await supabase
      .from("sb_boards")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", auth.board.boardId);

    return json({ success: true, kind, pages });
  } catch (e) {
    console.error("[smartboard-extract-document] error", e);
    return json({ success: false, error: "server_error", message: "Something went wrong reading this document." }, 500);
  }
});