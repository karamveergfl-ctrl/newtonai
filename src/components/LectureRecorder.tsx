import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Folder, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AudioRecorder, blobToBase64 } from "@/utils/audioRecorder";

interface LectureRecorderProps {
  onNotesGenerated: (notes: string, title: string) => void;
}

// Speech Recognition types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const LectureRecorder = ({ onNotesGenerated }: LectureRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecordingRef = useRef(false);
  const { toast } = useToast();

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }
        
        if (final) {
          setFinalTranscript(prev => prev + final);
        }
        setLiveTranscript(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toast({
            title: "Speech recognition error",
            description: event.error,
            variant: "destructive",
          });
        }
      };

      recognition.onend = () => {
        // Restart if still recording
        if (isRecordingRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.log('Recognition restart skipped');
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [toast]);

  const startRecording = async () => {
    try {
      audioRecorderRef.current = new AudioRecorder();
      await audioRecorderRef.current.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      setFinalTranscript('');
      setLiveTranscript('');
      
      // Start speech recognition for live transcription
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log('Recognition start error:', e);
        }
      }
      
      toast({
        title: "Recording started",
        description: recognitionRef.current 
          ? "Live transcription enabled - speak clearly" 
          : "Speak clearly into your microphone",
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
      // Stop speech recognition
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
      
      setIsRecording(false);
      const audioBlob = await audioRecorderRef.current.stop();
      
      // Combine transcripts
      const fullTranscript = (finalTranscript + liveTranscript).trim();
      
      if (fullTranscript.length > 100) {
        // Use live transcription if substantial
        await processTranscription(fullTranscript);
      } else {
        // Fallback to audio transcription
        await processAudio(audioBlob);
      }
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

  const processTranscription = async (transcription: string) => {
    setIsProcessing(true);
    setProgress(50);
    setProcessingStep("Generating study notes...");

    try {
      const { data: notesData, error: notesError } = await supabase
        .functions.invoke("generate-lecture-notes", {
          body: { transcription },
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
        description: error instanceof Error ? error.message : "Could not generate notes",
        variant: "destructive",
      });
    } finally {
      resetState();
    }
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
          body: { audio: base64Audio, mimeType: audioBlob.type || 'audio/webm' },
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
      resetState();
    }
  };

  const resetState = () => {
    setIsProcessing(false);
    setProcessingStep("");
    setProgress(0);
    setLiveTranscript("");
    setFinalTranscript("");
  };

  return (
    <div className="w-full">
      <div className="relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 backdrop-blur-sm border-border bg-card/50 hover:border-primary/50 min-h-[320px] flex items-center justify-center">
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
              <p className="text-sm text-muted-foreground mb-3">
                <span className="text-primary">Live recording</span> or <span className="text-secondary">upload audio</span> to get instant study notes
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Supported: MP3, WAV, WEBM, M4A, FLAC • Max: 25MB
              </p>
              <p className="text-sm text-primary">
                Record audio or upload audio to make complete study notes
              </p>
            </div>

            {/* Live Transcription Display */}
            {isRecording && (finalTranscript || liveTranscript) && (
              <div className="max-h-32 overflow-y-auto bg-muted/50 rounded-lg p-3 text-left">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Live Transcription:</p>
                <p className="text-sm text-foreground">
                  {finalTranscript}
                  <span className="text-muted-foreground italic">{liveTranscript}</span>
                </p>
              </div>
            )}

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
