import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Mic, Youtube, FileText, Square, Play, Pause, Loader2, File, X, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { useAudioWaveform } from "@/hooks/useAudioWaveform";
import { AudioWaveformVisualizer, StaticWaveformVisualizer } from "@/components/AudioWaveformVisualizer";
import { useTemplatePreferences, type LanguageCode } from "@/hooks/useTemplatePreferences";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "ru", name: "Russian" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "id", name: "Indonesian" },
  { code: "bn", name: "Bengali" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
  { code: "or", name: "Odia" },
  { code: "as", name: "Assamese" },
  { code: "ks", name: "Kashmiri" },
];

type InputType = "upload" | "recording" | "youtube" | "text";

interface ContentInputTabsProps {
  onContentReady: (content: string, type: InputType, metadata?: { videoId?: string; videoTitle?: string; file?: File; language?: string }) => void;
  isProcessing?: boolean;
  supportedFormats?: string;
  acceptedFileTypes?: Record<string, string[]>;
  placeholder?: string;
  showYouTube?: boolean;
  showRecording?: boolean;
  showUpload?: boolean;
  showText?: boolean;
  showLanguageSelector?: boolean;
  defaultLanguage?: string;
}

export const ContentInputTabs = ({
  onContentReady,
  isProcessing = false,
  supportedFormats = "PDF, DOC, DOCX, TXT, Images; Max size: 20MB",
  acceptedFileTypes = {
    "application/pdf": [".pdf"],
    "text/plain": [".txt"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  },
  placeholder = "Paste your content here...",
  showYouTube = true,
  showRecording = true,
  showUpload = true,
  showText = true,
  showLanguageSelector = true,
  defaultLanguage,
}: ContentInputTabsProps) => {
  // Use saved language preference
  const { preferences, isLoaded: prefsLoaded, setLanguage: saveLanguage } = useTemplatePreferences();
  
  const [activeTab, setActiveTab] = useState<InputType>("upload");
  const [textContent, setTextContent] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage || "en");
  
  // Sync with saved preference once loaded
  useEffect(() => {
    if (prefsLoaded && !defaultLanguage) {
      setSelectedLanguage(preferences.language);
    }
  }, [prefsLoaded, preferences.language, defaultLanguage]);

  // Save language preference when changed
  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    saveLanguage(lang as LanguageCode);
  };
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const { toast } = useToast();
  
  // Audio waveform visualization
  const { waveformData, connectToStream, disconnect: disconnectWaveform, isActive: isWaveformActive } = useAudioWaveform({
    barCount: 24,
    minBarHeight: 8,
    maxBarHeight: 80,
  });

  const tabs = [
    { id: "upload" as InputType, label: "Upload", icon: Upload, show: showUpload },
    { id: "recording" as InputType, label: "Recording", icon: Mic, show: showRecording },
    { id: "youtube" as InputType, label: "Youtube", icon: Youtube, show: showYouTube },
    { id: "text" as InputType, label: "Text", icon: FileText, show: showText },
  ].filter(tab => tab.show);

  // File upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      if (uploadedFile.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 20MB",
          variant: "destructive",
        });
        return;
      }
      setFile(uploadedFile);
      
      // Generate image preview if it's an image file
      if (uploadedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(uploadedFile);
      } else {
        setImagePreview(null);
      }
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles: 1,
  });

  // Recording handling
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Connect to waveform visualizer
      connectToStream(stream);

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
        disconnectWaveform();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
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
      disconnectWaveform();
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

  // Track playback progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  // YouTube URL extraction
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Submit handlers
  const handleSubmit = async () => {
    switch (activeTab) {
      case "text":
        if (!textContent.trim()) {
          toast({ title: "No content", description: "Please enter some text", variant: "destructive" });
          return;
        }
        onContentReady(textContent, "text", { language: selectedLanguage });
        break;

      case "upload":
        if (!file) {
          toast({ title: "No file", description: "Please upload a file", variant: "destructive" });
          return;
        }
        // For text files, read content directly
        if (file.type === "text/plain") {
          const text = await file.text();
          onContentReady(text, "upload", { file, language: selectedLanguage });
        } else {
          // For other files, pass the file for processing
          onContentReady("", "upload", { file, language: selectedLanguage });
        }
        break;

      case "youtube":
        const videoId = extractVideoId(youtubeUrl);
        if (!videoId) {
          toast({ title: "Invalid URL", description: "Please enter a valid YouTube URL", variant: "destructive" });
          return;
        }
        onContentReady(youtubeUrl, "youtube", { videoId, language: selectedLanguage });
        break;

      case "recording":
        if (!audioBlob && !audioFile) {
          toast({ title: "No audio", description: "Please record or upload audio first", variant: "destructive" });
          return;
        }
        // Convert to base64 for processing
        setIsTranscribing(true);
        try {
          const audioSource = audioFile || audioBlob;
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => {
              const result = (reader.result as string).split(",")[1];
              resolve(result);
            };
            reader.readAsDataURL(audioSource!);
          });
          onContentReady(base64, "recording", { language: selectedLanguage });
        } finally {
          setIsTranscribing(false);
        }
        break;
    }
  };

  const clearFile = () => {
    setFile(null);
    setImagePreview(null);
  };
  
  const clearAudio = () => {
    setAudioBlob(null);
    setAudioFile(null);
    setAudioUrl(null);
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum audio file size is 25MB",
        variant: "destructive",
      });
      return;
    }
    
    setAudioFile(file);
    setAudioBlob(null);
    setAudioUrl(URL.createObjectURL(file));
    
    // Reset input value to allow re-uploading same file
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }
  };

  const videoId = extractVideoId(youtubeUrl);

  const isReady = () => {
    switch (activeTab) {
      case "text": return textContent.trim().length > 0;
      case "upload": return file !== null;
      case "youtube": return extractVideoId(youtubeUrl) !== null;
      case "recording": return audioBlob !== null || audioFile !== null;
      default: return false;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tab Selector and Language Dropdown */}
      <div className="flex flex-col gap-4">
        {/* Horizontal Tab Bar */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-muted/30 border border-border gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs font-medium transition-all duration-200 min-w-[70px] sm:min-w-[90px]",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <tab.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-[11px] sm:text-xs font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language Selector - Centered */}
        {showLanguageSelector && (
          <div className="flex justify-center">
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[180px] sm:w-[200px] bg-background border-border">
                <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      {lang.name}
                      {lang.code === preferences.language && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Content Areas */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div className="space-y-3 sm:space-y-4">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-4 sm:p-8 text-center cursor-pointer transition-all duration-200",
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                )}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="flex flex-col items-center gap-3 sm:gap-4">
                    {/* Image Preview */}
                    {imagePreview && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative max-w-[200px] sm:max-w-xs max-h-40 sm:max-h-48 rounded-lg overflow-hidden border border-border shadow-sm"
                      >
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-contain bg-muted/50"
                        />
                      </motion.div>
                    )}
                    
                    {/* File Info */}
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <File className="h-8 w-8 sm:h-10 sm:w-10 text-primary flex-shrink-0" />
                      <div className="text-left min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate max-w-[180px] sm:max-w-none">{file.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); clearFile(); }}
                        className="ml-1 sm:ml-2 h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-center gap-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
                        <Play className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10">
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/10">
                        <File className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                      </div>
                    </div>
                    <p className="font-medium text-sm sm:text-base">
                      {isDragActive ? "Drop the file here" : "Drag and drop your file here"}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground px-2">
                      Supported: {supportedFormats}
                    </p>
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleSubmit}
                disabled={!isReady() || isProcessing}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Process File
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Recording Tab */}
          {activeTab === "recording" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col items-center gap-4 sm:gap-6 py-6 sm:py-8 border-2 border-dashed rounded-xl border-border bg-muted/20">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!!audioFile}
                  className={cn(
                    "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-colors",
                    isRecording
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground",
                    audioFile && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isRecording ? (
                    <Square className="h-8 w-8 sm:h-10 sm:w-10" />
                  ) : (
                    <Mic className="h-8 w-8 sm:h-10 sm:w-10" />
                  )}
                </motion.button>

                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isRecording ? "Recording... Click to stop" : "Click to start recording"}
                </p>

                {/* Waveform Visualization during recording */}
                {isRecording && (
                  <div className="w-full max-w-sm">
                    <AudioWaveformVisualizer
                      waveformData={waveformData}
                      isActive={isWaveformActive}
                      variant="recording"
                    />
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="flex items-center justify-center gap-2 text-destructive text-sm mt-2"
                    >
                      <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-destructive" />
                      Recording
                    </motion.div>
                  </div>
                )}

                {/* Divider */}
                {!isRecording && !audioUrl && (
                  <div className="flex items-center gap-3 w-full max-w-xs px-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}

                {/* Upload Audio Button */}
                {!isRecording && !audioUrl && (
                  <div className="flex flex-col items-center gap-2">
                    <input
                      ref={audioInputRef}
                      id="audio-upload-input"
                      type="file"
                      accept="audio/*,.mp3,.wav,.webm,.m4a,.ogg,.flac"
                      onChange={handleAudioFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => audioInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Audio File
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      MP3, WAV, M4A, WEBM, FLAC • Max 25MB
                    </p>
                  </div>
                )}
              </div>

              {/* Audio Preview with Waveform */}
              {audioUrl && (
                <div className="space-y-3 p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0" onClick={togglePlayback}>
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      className="hidden"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {audioFile?.name || "Recording ready"}
                      </p>
                      {audioFile && (
                        <p className="text-xs text-muted-foreground">
                          {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={clearAudio}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Playback Waveform */}
                  <StaticWaveformVisualizer 
                    progress={isPlaying ? playbackProgress : 0} 
                    className="w-full"
                  />
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!isReady() || isProcessing || isTranscribing}
                className="w-full bg-gradient-to-r from-primary to-primary/80"
                size="lg"
              >
                {isProcessing || isTranscribing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isTranscribing ? "Preparing..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Process Audio
                  </>
                )}
              </Button>
            </div>
          )}

          {/* YouTube Tab */}
          {activeTab === "youtube" && (
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-3">
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="h-11 sm:h-12 text-sm"
                />
                
                {videoId && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="aspect-video rounded-lg overflow-hidden bg-black"
                  >
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      className="w-full h-full"
                      allowFullScreen
                      title="YouTube video"
                    />
                  </motion.div>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!isReady() || isProcessing}
                className="w-full bg-gradient-to-r from-primary to-primary/80"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Youtube className="h-4 w-4 mr-2" />
                    Process Video
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Text Tab */}
          {activeTab === "text" && (
            <div className="space-y-3 sm:space-y-4">
              <Textarea
                placeholder={placeholder}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={6}
                className="resize-none min-h-[150px] sm:min-h-[200px] text-sm"
              />
              
              <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                <span>{textContent.length.toLocaleString()} characters</span>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!isReady() || isProcessing}
                className="w-full bg-gradient-to-r from-primary to-primary/80"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Process Text
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
