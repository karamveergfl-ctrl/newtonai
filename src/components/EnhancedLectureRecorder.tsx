import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, Square, Play, Pause, Loader2, Music, 
  Upload, X, Clock, FileAudio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", name: "English", speechCode: "en-US" },
  { code: "es", name: "Spanish", speechCode: "es-ES" },
  { code: "fr", name: "French", speechCode: "fr-FR" },
  { code: "de", name: "German", speechCode: "de-DE" },
  { code: "it", name: "Italian", speechCode: "it-IT" },
  { code: "pt", name: "Portuguese", speechCode: "pt-BR" },
  { code: "zh", name: "Chinese", speechCode: "zh-CN" },
  { code: "ja", name: "Japanese", speechCode: "ja-JP" },
  { code: "ko", name: "Korean", speechCode: "ko-KR" },
  { code: "ar", name: "Arabic", speechCode: "ar-SA" },
  { code: "hi", name: "Hindi", speechCode: "hi-IN" },
  { code: "ru", name: "Russian", speechCode: "ru-RU" },
  { code: "nl", name: "Dutch", speechCode: "nl-NL" },
  { code: "pl", name: "Polish", speechCode: "pl-PL" },
  { code: "tr", name: "Turkish", speechCode: "tr-TR" },
  { code: "vi", name: "Vietnamese", speechCode: "vi-VN" },
  { code: "th", name: "Thai", speechCode: "th-TH" },
  { code: "id", name: "Indonesian", speechCode: "id-ID" },
];

const AUDIO_TYPES = {
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/webm": [".webm"],
  "audio/mp4": [".m4a"],
  "audio/x-m4a": [".m4a"],
  "audio/ogg": [".ogg"],
  "audio/flac": [".flac"],
  "audio/aac": [".aac"],
};

interface EnhancedLectureRecorderProps {
  onContentReady: (content: string, type: "recording" | "audio", metadata?: { 
    file?: File; 
    language?: string;
  }) => void;
  isProcessing?: boolean;
  defaultLanguage?: string;
}

export const EnhancedLectureRecorder = ({
  onContentReady,
  isProcessing = false,
  defaultLanguage = "en",
}: EnhancedLectureRecorderProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Initialize Speech Recognition
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      const langData = LANGUAGES.find(l => l.code === selectedLanguage);
      recognition.lang = langData?.speechCode || "en-US";
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + " ";
          } else {
            interim += result[0].transcript;
          }
        }
        
        setFinalTranscript(prev => prev + final);
        setLiveTranscript(interim);
      };

      recognition.onerror = () => {
        // Silent fail - transcription is optional
      };

      recognition.onend = () => {
        // Restart if still recording
        if (isRecording && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {
            // Ignore restart errors
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [selectedLanguage, isRecording]);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Audio upload handling
  const onDropAudio = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum audio file size is 25MB",
          variant: "destructive",
        });
        return;
      }
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
      // Clear recording when audio uploaded
      setAudioBlob(null);
      setFinalTranscript("");
      setLiveTranscript("");
      setElapsedTime(0);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropAudio,
    accept: AUDIO_TYPES,
    maxFiles: 1,
    noClick: false,
  });

  const startRecording = async () => {
    try {
      // Clear previous state
      setAudioFile(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setFinalTranscript("");
      setLiveTranscript("");
      setElapsedTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Ignore if already started
        }
      }
    } catch {
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access to record",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setAudioFile(null);
    setAudioUrl(null);
    setFinalTranscript("");
    setLiveTranscript("");
    setElapsedTime(0);
  };

  const handleSubmit = async () => {
    if (audioFile) {
      // Handle uploaded audio file
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = (reader.result as string).split(",")[1];
          resolve(result);
        };
        reader.readAsDataURL(audioFile);
      });
      onContentReady(base64, "audio", { file: audioFile, language: selectedLanguage });
    } else if (audioBlob) {
      // Handle recorded audio
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = (reader.result as string).split(",")[1];
          resolve(result);
        };
        reader.readAsDataURL(audioBlob);
      });
      onContentReady(base64, "recording", { language: selectedLanguage });
    }
  };

  const isReady = audioBlob !== null || audioFile !== null;
  const currentTranscript = finalTranscript + liveTranscript;

  return (
    <div className="space-y-5">
      {/* Language Selector */}
      <div className="flex justify-end">
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background">
            <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Recording Area */}
      <div className="border-2 border-dashed rounded-xl p-6 sm:p-8 border-border bg-muted/20">
        <div className="flex flex-col items-center gap-5">
          {/* Record Button with Timer */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={cn(
                "w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-lg",
                isRecording
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isRecording ? (
                <>
                  <Square className="h-8 w-8 sm:h-10 sm:w-10" />
                  <span className="text-xs mt-1 font-medium">{formatTime(elapsedTime)}</span>
                </>
              ) : (
                <Mic className="h-10 w-10 sm:h-12 sm:w-12" />
              )}
            </motion.button>

            {/* Pulsing Ring when Recording */}
            {isRecording && (
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-destructive"
                animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.3, 0.7] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </div>

          {/* Recording Status */}
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                key="recording"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-destructive"
              >
                <motion.span
                  className="w-2.5 h-2.5 rounded-full bg-destructive"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <span className="text-sm font-medium">Recording in progress</span>
              </motion.div>
            ) : (
              <motion.p
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                Tap to start recording your lecture
              </motion.p>
            )}
          </AnimatePresence>

          {/* Live Transcription Box */}
          {(isRecording || currentTranscript) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg bg-background border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Live Transcription
                </span>
              </div>
              <p className="text-sm min-h-[60px] max-h-[120px] overflow-y-auto">
                {currentTranscript || (
                  <span className="text-muted-foreground italic">
                    Speak into your microphone...
                  </span>
                )}
                {liveTranscript && (
                  <span className="text-muted-foreground">{liveTranscript}</span>
                )}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Audio Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/30"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex items-center justify-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Music className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-medium text-sm">
              {isDragActive ? "Drop audio file here" : "Or upload an audio file"}
            </p>
            <p className="text-xs text-muted-foreground">
              MP3, WAV, M4A, WEBM, FLAC • Max 25MB
            </p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto">
            <Upload className="h-4 w-4 mr-2" />
            Browse
          </Button>
        </div>
      </div>

      {/* Audio Preview */}
      {audioUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-muted rounded-lg"
        >
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10 flex-shrink-0" 
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileAudio className="h-4 w-4 text-primary flex-shrink-0" />
              <p className="font-medium text-sm truncate">
                {audioFile?.name || `Recording (${formatTime(elapsedTime)})`}
              </p>
            </div>
            {audioFile && (
              <p className="text-xs text-muted-foreground">
                {(audioFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={clearAudio}>
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Process Button */}
      <Button
        onClick={handleSubmit}
        disabled={!isReady || isProcessing || isRecording}
        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Audio...
          </>
        ) : (
          <>
            <Mic className="h-4 w-4 mr-2" />
            Generate Notes
          </>
        )}
      </Button>
    </div>
  );
};
