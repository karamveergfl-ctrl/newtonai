import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Folder, Loader2, Sparkles, Globe, ArrowLeft, Upload, MousePointerClick, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AudioRecorder, blobToBase64 } from "@/utils/audioRecorder";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";

interface LectureRecorderProps {
  onNotesGenerated: (notes: string, title: string) => void;
}

// Template types
type TemplateType = "lecture" | "study-guide" | "research" | "project";
interface Template {
  id: TemplateType;
  name: string;
  description: string;
  structure: string[];
}
const templates: Template[] = [{
  id: "lecture",
  name: "Lecture Notes",
  description: "Auto supplement details based on meeting information.",
  structure: ["Key Points", "Details", "Summary"]
}, {
  id: "study-guide",
  name: "Study Guide",
  description: "Organized study material with action items.",
  structure: ["Summary", "Chapters", "Action Items"]
}, {
  id: "research",
  name: "Research Summary",
  description: "Academic research format with progress tracking.",
  structure: ["Topics", "Review", "Progress"]
}, {
  id: "project",
  name: "Project Work Plan",
  description: "Problem-solution focused structure.",
  structure: ["Summary", "Issue", "Solution"]
}];
const languages = [{
  code: "en-US",
  name: "English"
}, {
  code: "es-ES",
  name: "Spanish"
}, {
  code: "fr-FR",
  name: "French"
}, {
  code: "de-DE",
  name: "German"
}, {
  code: "it-IT",
  name: "Italian"
}, {
  code: "pt-BR",
  name: "Portuguese"
}, {
  code: "zh-CN",
  name: "Chinese"
}, {
  code: "ja-JP",
  name: "Japanese"
}, {
  code: "ko-KR",
  name: "Korean"
}, {
  code: "ar-SA",
  name: "Arabic"
}, {
  code: "hi-IN",
  name: "Hindi"
}, {
  code: "ru-RU",
  name: "Russian"
}];

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
export const LectureRecorder = ({
  onNotesGenerated
}: LectureRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);

  // Template selection state
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("lecture");
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [pendingTranscription, setPendingTranscription] = useState<string | null>(null);
  const [pendingAudioBlob, setPendingAudioBlob] = useState<Blob | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecordingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const {
    toast
  } = useToast();
  const { incrementUsage } = useFeatureUsage();

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer effect for recording
  useEffect(() => {
    if (isRecording) {
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Initialize Speech Recognition with selected language
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;
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
            variant: "destructive"
          });
        }
      };
      recognition.onend = () => {
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
  }, [toast, selectedLanguage]);
  const startRecording = async () => {
    try {
      audioRecorderRef.current = new AudioRecorder();
      await audioRecorderRef.current.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      setFinalTranscript('');
      setLiveTranscript('');
      if (recognitionRef.current) {
        recognitionRef.current.lang = selectedLanguage;
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log('Recognition start error:', e);
        }
      }
      toast({
        title: "Recording started",
        description: recognitionRef.current ? "Live transcription enabled - speak clearly" : "Speak clearly into your microphone"
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record lectures",
        variant: "destructive"
      });
    }
  };
  const stopRecording = async () => {
    if (!audioRecorderRef.current) return;
    try {
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
      setIsRecording(false);
      
      // Track transcription minutes
      const recordingMinutes = Math.ceil(elapsedTime / 60);
      if (recordingMinutes > 0) {
        await incrementUsage('lecture_transcription', recordingMinutes);
      }
      
      const audioBlob = await audioRecorderRef.current.stop();
      const fullTranscript = (finalTranscript + liveTranscript).trim();
      if (fullTranscript.length > 50) {
        // Show template selection with transcription
        setPendingTranscription(fullTranscript);
        setPendingAudioBlob(null);
        setShowTemplateSelection(true);
      } else {
        // Show template selection with audio blob
        setPendingTranscription(null);
        setPendingAudioBlob(audioBlob);
        setShowTemplateSelection(true);
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      toast({
        title: "Recording failed",
        description: "Could not process the recording",
        variant: "destructive"
      });
    }
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/webm", "audio/m4a", "audio/ogg", "audio/flac", "audio/aac"];
    if (!validTypes.some(type => file.type.includes(type.split("/")[1]))) {
      toast({
        title: "Invalid file type",
        description: "Please upload MP3, WAV, WEBM, M4A, or FLAC audio files",
        variant: "destructive"
      });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 25MB",
        variant: "destructive"
      });
      return;
    }

    // Show template selection with audio blob
    setPendingTranscription(null);
    setPendingAudioBlob(file);
    setShowTemplateSelection(true);
  };
  const handleGenerateSummary = async () => {
    setShowTemplateSelection(false);
    if (pendingTranscription) {
      await processTranscription(pendingTranscription);
    } else if (pendingAudioBlob) {
      await processAudio(pendingAudioBlob);
    }
  };
  const processTranscription = async (transcription: string) => {
    setIsProcessing(true);
    setProgress(50);
    setProcessingStep("Generating summary...");
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      const {
        data: notesData,
        error: notesError
      } = await supabase.functions.invoke("generate-lecture-notes", {
        body: {
          transcription,
          template: selectedTemplate,
          templateStructure: template?.structure || [],
          language: selectedLanguage
        }
      });
      if (notesError || !notesData?.notes) {
        throw new Error(notesError?.message || "Summary generation failed");
      }
      setProgress(100);
      toast({
        title: "Summary generated!",
        description: "Your brief summary is ready"
      });
      onNotesGenerated(notesData.notes, notesData.title || template?.name || "Summary");
    } catch (error) {
      console.error("Processing failed:", error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Could not generate summary",
        variant: "destructive"
      });
    } finally {
      resetState();
    }
  };
  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setProgress(0);
    try {
      setProcessingStep("Transcribing audio...");
      setProgress(20);
      const base64Audio = await blobToBase64(audioBlob);
      const {
        data: transcriptionData,
        error: transcriptionError
      } = await supabase.functions.invoke("transcribe-audio", {
        body: {
          audio: base64Audio,
          mimeType: audioBlob.type || 'audio/webm'
        }
      });
      if (transcriptionError || !transcriptionData?.text) {
        throw new Error(transcriptionError?.message || "Transcription failed");
      }
      setProgress(50);
      setProcessingStep("Generating summary...");
      const template = templates.find(t => t.id === selectedTemplate);
      const {
        data: notesData,
        error: notesError
      } = await supabase.functions.invoke("generate-lecture-notes", {
        body: {
          transcription: transcriptionData.text,
          template: selectedTemplate,
          templateStructure: template?.structure || [],
          language: selectedLanguage
        }
      });
      if (notesError || !notesData?.notes) {
        throw new Error(notesError?.message || "Summary generation failed");
      }
      setProgress(100);
      toast({
        title: "Summary generated!",
        description: "Your brief summary is ready"
      });
      onNotesGenerated(notesData.notes, notesData.title || template?.name || "Summary");
    } catch (error) {
      console.error("Processing failed:", error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Could not process audio",
        variant: "destructive"
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
    setPendingTranscription(null);
    setPendingAudioBlob(null);
  };
  const handleBackToRecorder = () => {
    setShowTemplateSelection(false);
    setPendingTranscription(null);
    setPendingAudioBlob(null);
  };

  // Template Selection View
  if (showTemplateSelection) {
    return <div className="w-full">
        <div className="relative border-2 border-dashed rounded-2xl p-6 transition-all duration-300 backdrop-blur-sm border-border bg-card/50 min-h-[320px]">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleBackToRecorder} className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Click a template to summarize your notes
                </h3>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-2 gap-4">
              {templates.map(template => <button key={template.id} onClick={() => setSelectedTemplate(template.id)} className={`relative p-4 rounded-xl text-left transition-all duration-200 border-2 ${selectedTemplate === template.id ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "border-border bg-card/80 hover:border-primary/50"}`}>
                  <h4 className="font-semibold text-foreground mb-2">{template.name}</h4>
                  <div className="space-y-1.5 mb-3">
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                  <div className="space-y-1">
                    {template.structure.map((item, idx) => <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item}</span>
                        <div className="flex-1 h-1.5 bg-muted/50 rounded-full" />
                      </div>)}
                  </div>
                </button>)}
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Globe className="w-4 h-4 text-primary" />
                Select the language for your summary
              </div>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-full bg-card/80">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleBackToRecorder}>
                Resume
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 gap-2" onClick={handleGenerateSummary}>
                <Sparkles className="w-4 h-4" />
                Generate
              </Button>
            </div>
          </div>
        </div>
      </div>;
  }
  return <div className="w-full h-full">
      <motion.div 
        className="relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 backdrop-blur-sm min-h-[320px] h-full flex items-center justify-center group border-primary/40 bg-gradient-to-br from-card/80 via-card/60 to-primary/5 hover:border-primary hover:bg-primary/5 hover:shadow-xl hover:shadow-primary/10 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={{ scale: 1.01 }}
      >
        {/* Animated glow effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 pointer-events-none"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Corner sparkles */}
        {!isProcessing && !isRecording && (
          <>
            <motion.div
              className="absolute top-4 left-4 w-2 h-2 rounded-full bg-primary/60"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-primary/60"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <motion.div
              className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-primary/40"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}
        
        {isProcessing ? <div className="space-y-4 animate-fade-in relative z-10">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
            <div>
              <p className="text-lg font-semibold text-foreground mb-2">
                {processingStep}
              </p>
              <div className="w-full max-w-xs mx-auto h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" style={{
              width: `${progress}%`
            }} />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {progress}% complete
              </p>
            </div>
          </div> : <div className="space-y-5 relative z-10">
            {/* Floating click indicator badge */}
            {!isRecording && (
              <motion.div
                className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-lg flex items-center gap-1.5"
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <MousePointerClick className="w-3.5 h-3.5" />
                Record or Upload
              </motion.div>
            )}
            
            {/* Language Selection in Recorder View */}
            <div className="absolute top-4 right-4">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-[140px] h-8 text-xs bg-card/80">
                  <Globe className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Microphone Icon with enhanced glow */}
            <motion.div 
              className="relative mx-auto w-24 h-24 pt-4"
              animate={isRecording ? {} : {
                y: [0, -3, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <motion.div 
                className={`absolute inset-0 rounded-full ${isRecording ? 'bg-red-500/30' : 'bg-primary/20'}`}
                animate={isRecording ? { scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] } : { scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: isRecording ? 1 : 2, repeat: Infinity }}
              />
              <div className={`absolute inset-2 rounded-full flex items-center justify-center border-2 ${isRecording ? 'bg-red-500/20 border-red-500/50' : 'bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/30'}`}>
                {isRecording ? <MicOff className="w-10 h-10 text-red-500" /> : <Mic className="w-10 h-10 text-primary" />}
              </div>
            </motion.div>

            {/* Animated arrow pointing down */}
            {!isRecording && (
              <motion.div
                className="flex justify-center"
                animate={{
                  y: [0, 6, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <ArrowDown className="w-5 h-5 text-primary/60" />
              </motion.div>
            )}

            {/* Recording Timer */}
            <AnimatePresence>
              {isRecording && (
                <motion.div 
                  className="flex items-center justify-center gap-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <motion.div 
                    className="w-3 h-3 bg-red-500 rounded-full"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-2xl font-mono font-bold text-red-500">
                    {formatTime(elapsedTime)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Live Lecture Transcription
              </h3>
              <p className="text-sm text-muted-foreground mb-1">
                <span className="font-medium text-foreground/80">Drop files here</span> or <span className="text-primary font-medium underline underline-offset-2 decoration-primary/50">click to record</span>
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                MP3, WAV, WEBM, M4A, FLAC • Max 25MB
              </p>
            </div>

            {/* Live Transcription Display */}
            <AnimatePresence>
              {isRecording && (finalTranscript || liveTranscript) && (
                <motion.div 
                  className="max-h-32 overflow-y-auto bg-background/80 border border-border rounded-lg p-3 text-left"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Live Transcription:</p>
                  <p className="text-sm text-foreground">
                    {finalTranscript}
                    <span className="text-muted-foreground italic">{liveTranscript}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
              <input id="audio-file-input" type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" size="lg" className="gap-2 px-6 w-full sm:w-auto" onClick={() => document.getElementById("audio-file-input")?.click()}>
                  <Upload className="w-5 h-5" />
                  Upload Audio
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" data-action="record-lecture" className={`gap-2 px-8 w-full sm:w-auto ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90'}`} onClick={isRecording ? stopRecording : startRecording}>
                  {isRecording ? <>
                      <MicOff className="w-5 h-5" />
                      Stop Recording
                    </> : <>
                      <Mic className="w-5 h-5" />
                      Start Recording
                    </>}
                </Button>
              </motion.div>
            </div>
          </div>}
      </motion.div>
    </div>;
};