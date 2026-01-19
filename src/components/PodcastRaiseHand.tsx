import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send, Loader2, X, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PodcastRaiseHandProps {
  isOpen: boolean;
  onClose: () => void;
  podcastContext?: string;
  currentTopic?: string;
  onResponseComplete: () => void;
}

interface ResponseSegment {
  speaker: string;
  name: string;
  text: string;
  audio?: string;
}

export function PodcastRaiseHand({
  isOpen,
  onClose,
  podcastContext,
  currentTopic,
  onResponseComplete,
}: PodcastRaiseHandProps) {
  const [question, setQuestion] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [responseSegments, setResponseSegments] = useState<ResponseSegment[]>([]);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
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
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];
        
        const { data, error } = await supabase.functions.invoke("transcribe-audio", {
          body: { audio: base64Audio, mimeType: "audio/webm" },
        });

        if (error) throw error;
        
        if (data?.text) {
          setQuestion(data.text);
        }
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
    try {
      const { data, error } = await supabase.functions.invoke("podcast-raise-hand", {
        body: {
          question: question.trim(),
          podcastContext,
          currentTopic,
        },
      });

      if (error) throw error;

      if (data?.segments) {
        setResponseSegments(data.segments);
        setCurrentResponseIndex(0);
        setIsPlayingResponse(true);
        playResponseSegment(data.segments, 0);
      }
    } catch (error) {
      console.error("Error submitting question:", error);
      toast.error("Failed to get response");
      setIsProcessing(false);
    }
  };

  const playResponseSegment = async (segments: ResponseSegment[], index: number) => {
    if (index >= segments.length) {
      setIsPlayingResponse(false);
      setIsProcessing(false);
      setResponseSegments([]);
      setQuestion("");
      onResponseComplete();
      return;
    }

    const segment = segments[index];
    if (!segment.audio) {
      playResponseSegment(segments, index + 1);
      return;
    }

    setCurrentResponseIndex(index);
    
    const audioUrl = `data:audio/mpeg;base64,${segment.audio}`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      playResponseSegment(segments, index + 1);
    };

    audio.onerror = () => {
      console.error("Audio playback error");
      playResponseSegment(segments, index + 1);
    };

    await audio.play().catch(console.error);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setResponseSegments([]);
    setQuestion("");
    setIsPlayingResponse(false);
    setIsProcessing(false);
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
            // Response Playback
            <AnimatePresence mode="wait">
              <motion.div
                key={currentResponseIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">
                      {responseSegments[currentResponseIndex]?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">Speaking...</p>
                  </div>
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
            // Question Input
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
                  className={`absolute bottom-2 right-2 ${
                    isRecording ? "text-destructive animate-pulse" : ""
                  }`}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
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
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitQuestion}
                  className="flex-1"
                  disabled={!question.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
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
