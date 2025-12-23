import { useState, useRef } from "react";
import { Mic, MicOff, Folder, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AudioRecorder, blobToBase64 } from "@/utils/audioRecorder";

interface LectureRecorderProps {
  onNotesGenerated: (notes: string, title: string) => void;
}

export const LectureRecorder = ({ onNotesGenerated }: LectureRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [progress, setProgress] = useState(0);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      audioRecorderRef.current = new AudioRecorder();
      await audioRecorderRef.current.start();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record lectures",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    if (!audioRecorderRef.current) return;

    try {
      setIsRecording(false);
      const audioBlob = await audioRecorderRef.current.stop();
      await processAudio(audioBlob);
    } catch (error) {
      console.error("Failed to stop recording:", error);
      toast({
        title: "Recording failed",
        description: "Could not process the recording",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/webm",
      "audio/m4a",
      "audio/ogg",
      "audio/flac",
      "audio/aac",
    ];

    if (!validTypes.some((type) => file.type.includes(type.split("/")[1]))) {
      toast({
        title: "Invalid file type",
        description: "Please upload MP3, WAV, WEBM, M4A, or FLAC audio files",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 25MB",
        variant: "destructive",
      });
      return;
    }

    await processAudio(file);
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      // Step 1: Transcribe audio
      setProcessingStep("Transcribing audio...");
      setProgress(20);
      
      const base64Audio = await blobToBase64(audioBlob);
      
      const { data: transcriptionData, error: transcriptionError } = await supabase
        .functions.invoke("transcribe-audio", {
          body: { audio: base64Audio },
        });

      if (transcriptionError || !transcriptionData?.text) {
        throw new Error(transcriptionError?.message || "Transcription failed");
      }

      setProgress(50);
      setProcessingStep("Generating study notes...");

      // Step 2: Generate notes from transcription
      const { data: notesData, error: notesError } = await supabase
        .functions.invoke("generate-lecture-notes", {
          body: { transcription: transcriptionData.text },
        });

      if (notesError || !notesData?.notes) {
        throw new Error(notesError?.message || "Notes generation failed");
      }

      setProgress(100);
      
      toast({
        title: "Notes generated!",
        description: "Your lecture notes are ready",
      });

      onNotesGenerated(notesData.notes, notesData.title || "Lecture Notes");
    } catch (error) {
      console.error("Processing failed:", error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Could not process audio",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
      setProgress(0);
    }
  };

  return (
    <div className="w-full">
      <div className="relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 backdrop-blur-sm border-border bg-card/50 hover:border-primary/50">
        {isProcessing ? (
          <div className="space-y-4 animate-fade-in">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
            <div>
              <p className="text-lg font-semibold text-foreground mb-2">
                {processingStep}
              </p>
              <div className="w-full max-w-xs mx-auto h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {progress}% complete
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Microphone Icon with glow */}
            <div className="relative mx-auto w-24 h-24">
              <div className={`absolute inset-0 rounded-full ${isRecording ? 'bg-red-500/20 animate-pulse' : 'bg-primary/10'}`} />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                {isRecording ? (
                  <MicOff className="w-10 h-10 text-red-500" />
                ) : (
                  <Mic className="w-10 h-10 text-primary" />
                )}
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
              <Sparkles className="absolute -bottom-1 -left-1 w-4 h-4 text-secondary animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Live Lecture Transcription
              </h3>
              <p className="text-sm text-muted-foreground mb-1">
                <span className="text-primary">Live recording</span> or <span className="text-secondary">upload audio</span> to get instant study notes
              </p>
              <p className="text-xs text-muted-foreground">
                Supported: MP3, WAV, WEBM, M4A, FLAC • Max: 25MB
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <input
                id="audio-file-input"
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                variant="outline"
                size="lg"
                className="gap-2 px-6"
                onClick={() => document.getElementById("audio-file-input")?.click()}
              >
                <Folder className="w-5 h-5" />
                Select file
              </Button>

              <Button
                size="lg"
                className={`gap-2 px-8 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90'}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    Stop recording
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Start recording
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
