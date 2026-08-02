import { supabase } from "@/integrations/supabase/client";

export const SMARTBOARD_STORAGE_KEY = "newtonai_smartboard_device";

export interface SmartBoardSession {
  deviceToken: string;
  boardId: string;
  boardName: string;
  gradeLevel: string | null;
  subjectFocus: string | null;
  institutionId: string;
  institutionName: string;
  activatedAt: string;
}

export function readSmartBoardSession(): SmartBoardSession | null {
  try {
    const raw = window.localStorage.getItem(SMARTBOARD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SmartBoardSession;
    if (!parsed?.deviceToken || !parsed?.boardId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSmartBoardSession(session: SmartBoardSession) {
  try {
    window.localStorage.setItem(SMARTBOARD_STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable */
  }
}

export function clearSmartBoardSession() {
  try {
    window.localStorage.removeItem(SMARTBOARD_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}

export interface SmartBoardVideo {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  viewCount: string;
  definition?: string;
}

interface InvokeResult<T> {
  data: T | null;
  message: string | null;
  errorCode: string | null;
}

async function invoke<T>(fn: string, body: Record<string, unknown>): Promise<InvokeResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(fn, { body });
    if (error) {
      const ctx = (error as unknown as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") {
        try {
          const parsed = await ctx.json();
          return { data: null, message: parsed?.message ?? error.message, errorCode: parsed?.error ?? null };
        } catch {
          /* fall through to generic message */
        }
      }
      return { data: null, message: error.message, errorCode: null };
    }
    const payload = data as { success?: boolean; message?: string; error?: string };
    if (payload && payload.success === false) {
      return { data: null, message: payload.message ?? "Something went wrong.", errorCode: payload.error ?? null };
    }
    return { data: data as T, message: null, errorCode: null };
  } catch (e) {
    return { data: null, message: e instanceof Error ? e.message : "Network error", errorCode: "network" };
  }
}

export function activateBoard(code: string) {
  return invoke<{ deviceToken: string; board: Omit<SmartBoardSession, "deviceToken" | "activatedAt"> }>(
    "smartboard-activate",
    { code },
  );
}

export function verifyBoardSession(deviceToken: string) {
  return invoke<{ board: Omit<SmartBoardSession, "deviceToken" | "activatedAt"> }>("smartboard-session", { deviceToken });
}

export interface SchoolBoardOption {
  id: string;
  board_name: string;
  grade_level: string | null;
  subject_focus: string | null;
  last_active_at: string | null;
  activated_at: string | null;
}

/** Lists the boards of the signed-in school account (uses the user's JWT). */
export function listSchoolBoards() {
  return invoke<{ institution: { id: string; name: string }; boards: SchoolBoardOption[] }>(
    "smartboard-signin",
    {},
  );
}

/** Signs this device in as a specific board of the signed-in school account. */
export async function signInBoardAsSchool(boardId: string) {
  const res = await invoke<{ deviceToken: string; board: Omit<SmartBoardSession, "deviceToken" | "activatedAt"> }>(
    "smartboard-signin",
    { boardId },
  );
  if (res.data) {
    writeSmartBoardSession({
      deviceToken: res.data.deviceToken,
      ...res.data.board,
      activatedAt: new Date().toISOString(),
    });
  }
  return res;
}

export function searchBoardVideos(
  deviceToken: string,
  query: string,
  opts?: { limit?: number; action?: "search" | "select_text" },
) {
  return invoke<{ videos: SmartBoardVideo[] }>("smartboard-video-search", {
    deviceToken,
    query,
    limit: opts?.limit ?? 12,
    action: opts?.action ?? "search",
  });
}

export function logBoardPlay(
  deviceToken: string,
  payload: { query: string; videoId: string; videoTitle: string; videoChannel: string },
) {
  return invoke<{ success: boolean }>("smartboard-log-play", { deviceToken, ...payload });
}

export interface ExtractedDocPage {
  title: string;
  blocks: string[];
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",").pop() ?? "");
    reader.onerror = () => reject(new Error("Could not read this file."));
    reader.readAsDataURL(file);
  });
}

/** Sends a .docx/.pptx to the board-authenticated extractor and returns page-like text blocks. */
export async function extractBoardDocument(
  deviceToken: string,
  file: File,
): Promise<InvokeResult<{ kind: "docx" | "pptx"; pages: ExtractedDocPage[] }>> {
  let fileBase64: string;
  try {
    fileBase64 = await fileToBase64(file);
  } catch (e) {
    return { data: null, message: e instanceof Error ? e.message : "Could not read this file.", errorCode: "read_failed" };
  }

  return invoke<{ kind: "docx" | "pptx"; pages: ExtractedDocPage[] }>("smartboard-extract-document", {
    deviceToken,
    fileName: file.name,
    fileBase64,
  });
}