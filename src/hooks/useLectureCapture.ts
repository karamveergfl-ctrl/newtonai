import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AudioRecorder, blobToBase64 } from "@/utils/audioRecorder";

interface SlideTimelineEntry {
  slideIndex: number;
  timestamp: string;
  content: string;
}

interface TranscriptSegment {
  startTime: string;
  text: string;
  durationSeconds: number;
}

interface UseLectureCaptureProps {
  sessionId: string;
  teacherId: string;
}

export function useLectureCapture({ sessionId, teacherId }: UseLectureCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureId, setCaptureId] = useState<string | null>(null);
  const [latestTranscript, setLatestTranscript] = useState<string>("");

  const slideTimelineRef = useRef<SlideTimelineEntry[]>([]);
  const transcriptSegmentsRef = useRef<TranscriptSegment[]>([]);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const totalAudioRef = useRef(0);
  const mountedRef = useRef(true);

  const CHUNK_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

  const processAudioChunk = useCallback(async () => {
    const recorder = audioRecorderRef.current;
    if (!recorder?.isRecording()) return;

    try {
      const blob = await recorder.stop();
      const base64 = await blobToBase64(blob);
      const startTime = new Date().toISOString();

      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: { audio: base64, language: "en" },
      });

      if (!error && data?.text) {
        transcriptSegmentsRef.current.push({
          startTime,
          text: data.text,
          durationSeconds: 120,
        });
        totalAudioRef.current += 120;
      }

      // Restart recording for next chunk
      if (mountedRef.current && audioRecorderRef.current) {
        await audioRecorderRef.current.start();
      }
    } catch (err) {
      console.error("Audio chunk processing error:", err);
      // Try to restart
      try {
        if (audioRecorderRef.current) await audioRecorderRef.current.start();
      } catch {}
    }
  }, []);

  const startCapture = useCallback(async () => {
    slideTimelineRef.current = [];
    transcriptSegmentsRef.current = [];
    totalAudioRef.current = 0;

    // Create capture record
    const { data, error } = await supabase
      .from("lecture_captures" as any)
      .insert({
        session_id: sessionId,
        teacher_id: teacherId,
        status: "recording",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create lecture capture:", error);
      return;
    }

    setCaptureId((data as any).id);
    setIsCapturing(true);

    // Start audio recording
    audioRecorderRef.current = new AudioRecorder();
    try {
      await audioRecorderRef.current.start();
    } catch (err) {
      console.error("Microphone access denied:", err);
    }

    // Process audio in chunks
    chunkTimerRef.current = setInterval(processAudioChunk, CHUNK_INTERVAL_MS);
  }, [sessionId, teacherId, processAudioChunk]);

  const recordSlideChange = useCallback(
    (slideIndex: number, content: string) => {
      if (!isCapturing) return;
      slideTimelineRef.current.push({
        slideIndex,
        timestamp: new Date().toISOString(),
        content: content.slice(0, 500),
      });
    },
    [isCapturing]
  );

  const stopCapture = useCallback(async () => {
    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);

    // Process final audio chunk
    if (audioRecorderRef.current?.isRecording()) {
      try {
        const blob = await audioRecorderRef.current.stop();
        const base64 = await blobToBase64(blob);
        const { data } = await supabase.functions.invoke("transcribe-audio", {
          body: { audio: base64, language: "en" },
        });
        if (data?.text) {
          transcriptSegmentsRef.current.push({
            startTime: new Date().toISOString(),
            text: data.text,
            durationSeconds: 120,
          });
        }
      } catch (err) {
        console.error("Final audio chunk error:", err);
      }
    }

    // Update capture record
    if (captureId) {
      await supabase
        .from("lecture_captures" as any)
        .update({
          slide_timeline: slideTimelineRef.current,
          transcript_segments: transcriptSegmentsRef.current,
          audio_duration_seconds: totalAudioRef.current,
          status: "completed",
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", captureId);
    }

    setIsCapturing(false);
    setCaptureId(null);
  }, [captureId]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
    };
  }, []);

  return {
    isCapturing,
    startCapture,
    stopCapture,
    recordSlideChange,
  };
}
