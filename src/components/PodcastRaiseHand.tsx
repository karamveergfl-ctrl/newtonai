import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send, Loader2, X, Volume2, Volume1 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWebSpeechTTS } from "@/hooks/useWebSpeechTTS";

interface PodcastRaiseHandProps {
  isOpen: boolean;
  onClose: () => void;
  podcastContext?: string;
  currentTopic?: string;
  onResponseComplete: () => void;
  userName?: string;
}

interface ResponseSegment {
  speaker: string;
  name: string;
  text: string;
  audio?: string;
  fallbackAudio?: boolean;
}

export function PodcastRaiseHand({
  isOpen,
  onClose,
  podcastContext,
  currentTopic,
  onResponseComplete,
  userName,
}: PodcastRaiseHandProps) {
  const [question, setQuestion] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [responseSegments, setResponseSegments] = useState<ResponseSegment[]>([]);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingSegmentRef = useRef(false); // Prevent double-invocation
  const { speak, cancel: cancelSpeech, isSupported: webSpeechSupported } = useWebSpeechTTS();

  const stopAllPlayback = () => {
    // Stop HTMLAudioElement
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    // Stop Web Speech
    cancelSpeech();
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel();
    }
    isPlayingSegmentRef.current = false;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];
        const { data, error } = await supabase.functions.invoke("transcribe-audio", {
          body: { audio: base64Audio, mimeType: "audio/webm" },
        });
        if (error) throw error;
        if (data?.text) setQuestion(data.text);
        setIsProcessing(false);
      };
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Failed to transcribe audio");
      setIsProcessing(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!question.trim()) {
      toast.error("Please ask a question");
      return;
    }

    setIsProcessing(true);
    
    // Cancel ALL audio before sending request
    stopAllPlayback();

    try {
      const { data, error } = await supabase.functions.invoke("podcast-raise-hand", {
        body: {
          question: question.trim(),
          podcastContext,
          currentTopic,
          userName: userName || undefined,
        },
      });

      if (error) throw error;

      if (data?.segments) {
        const needsFallback = data.ttsError || data.segments.every((s: ResponseSegment) => !s.audio);
        if (needsFallback && webSpeechSupported) {
          setUsingFallback(true);
          toast.info("Using browser voices as fallback", { duration: 3000 });
        }

        setResponseSegments(data.segments);
        setCurrentResponseIndex(0);
        setIsPlayingResponse(true);
        setIsProcessing(false);
        
        // Small delay to ensure UI renders before playback
        setTimeout(() => playResponseSegment(data.segments, 0), 100);
      }
    } catch (error) {
      console.error("Error submitting question:", error);
      toast.error("Failed to get response");
      setIsProcessing(false);
    }
  };

  const playResponseSegment = async (segs: ResponseSegment[], index: number) => {
    if (isPlayingSegmentRef.current) return; // Prevent double-invocation
    
    if (index >= segs.length) {
      isPlayingSegmentRef.current = false;
      setIsPlayingResponse(false);
      setResponseSegments([]);
      setQuestion("");
      setUsingFallback(false);
      onResponseComplete();
      return;
    }

    isPlayingSegmentRef.current = true;
    const segment = segs[index];
    setCurrentResponseIndex(index);

    // Ensure previous audio is fully stopped
    stopAllPlayback();
    await new Promise(r => setTimeout(r, 50));
    isPlayingSegmentRef.current = true; // Re-set after stopAllPlayback clears it

    if (segment.audio) {
      const audio = new Audio(`data:audio/mpeg;base64,${segment.audio}`);
      audioRef.current = audio;

      audio.onended = () => {
        isPlayingSegmentRef.current = false;
        playResponseSegment(segs, index + 1);
      };

      audio.onerror = () => {
        isPlayingSegmentRef.current = false;
        if (webSpeechSupported) {
          playWithWebSpeech(segment, segs, index);
        } else {
          playResponseSegment(segs, index + 1);
        }
      };

      await audio.play().catch(() => {
        isPlayingSegmentRef.current = false;
        if (webSpeechSupported) playWithWebSpeech(segment, segs, index);
      });
    } else if (webSpeechSupported) {
      await playWithWebSpeech(segment, segs, index);
    } else {
      isPlayingSegmentRef.current = false;
      playResponseSegment(segs, index + 1);
    }
  };

  const playWithWebSpeech = async (
    segment: ResponseSegment,
    segs: ResponseSegment[],
    index: number
  ) => {
    try {
      await speak(segment.text, {
        speaker: segment.speaker as "host1" | "host2",
        onEnd: () => {
          isPlayingSegmentRef.current = false;
          playResponseSegment(segs, index + 1);
        },
        onError: () => {
          isPlayingSegmentRef.current = false;
          playResponseSegment(segs, index + 1);
        },
      });
    } catch {
      isPlayingSegmentRef.current = false;
      playResponseSegment(segs, index + 1);
    }
  };

  useEffect(() => {
    return () => { stopAllPlayback(); };
  }, []);

  const handleClose = () => {
    stopAllPlayback();
    setResponseSegments([]);
    setQuestion("");
    setIsPlayingResponse(false);
    setIsProcessing(false);
    setUsingFallback(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🙋 Ask the Hosts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isPlayingResponse ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentResponseIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      {usingFallback ? (
                        <Volume1 className="w-5 h-5 text-primary animate-pulse" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-primary animate-pulse" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-primary">
                        {responseSegments[currentResponseIndex]?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">Speaking...</p>
                    </div>
                  </div>
                  {usingFallback && (
                    <Badge variant="secondary" className="text-xs">
                      Browser Voice
                    </Badge>
                  )}
                </div>
                
                <Card className="p-3 bg-primary/5">
                  <p className="text-sm">
                    {responseSegments[currentResponseIndex]?.text}
                  </p>
                </Card>

                <div className="flex gap-1">
                  {responseSegments.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        idx <= currentResponseIndex ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <>
              <div className="relative">
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your question or use voice input..."
                  className="min-h-[100px] pr-12"
                  disabled={isProcessing}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className={`absolute bottom-2 right-2 ${isRecording ? "text-destructive animate-pulse" : ""}`}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
              </div>

              {isRecording && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-sm text-destructive"
                >
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  Recording... Tap mic to stop
                </motion.div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isProcessing}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleSubmitQuestion} className="flex-1" disabled={!question.trim() || isProcessing}>
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Ask
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
