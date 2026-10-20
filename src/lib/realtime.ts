import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Unique channel name so two components never reuse an already-subscribed channel. */
export function uniqueChannelName(base: string): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${base}-${id}`;
}

/**
 * Creates a channel, attaches handlers, then subscribes once.
 * Never throws: on failure it logs and polls `fallback` every 10s.
 * Returns a cleanup function that removes the channel and stops polling.
 */
export function safeSubscribe(
  base: string,
  attach: (channel: RealtimeChannel) => RealtimeChannel,
  fallback?: () => void,
): () => void {
  let channel: RealtimeChannel | null = null;
  let poll: ReturnType<typeof setInterval> | null = null;

  const startFallback = (err: unknown) => {
    console.error(`[realtime] ${base} failed, falling back to polling:`, err);
    if (fallback && !poll) poll = setInterval(fallback, 10_000);
  };

  try {
    channel = attach(supabase.channel(uniqueChannelName(base)));
    channel.subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") startFallback(err ?? status);
    });
  } catch (err) {
    startFallback(err);
  }

  return () => {
    if (poll) clearInterval(poll);
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.error(`[realtime] ${base} cleanup failed:`, err);
      }
    }
  };
}
