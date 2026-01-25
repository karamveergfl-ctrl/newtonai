import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mic, Download, Copy, Check, Volume2, VolumeX, Pencil, Eye, Highlighter,
  Upload, Youtube, FileText, Globe, Loader2, ArrowLeft, Sparkles, BookOpen, Clipboard, Star, ChevronDown, X
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { LectureRecorder } from "@/components/LectureRecorder";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { StudySectionRenderer } from "@/components/StudySectionRenderer";
import { useFeatureLimitGate, getFeatureDisplayName } from "@/hooks/useFeatureLimitGate";
import { UsageLimitModal } from "@/components/UsageLimitModal";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import { useWebSpeechTTS } from "@/hooks/useWebSpeechTTS";
import { cn } from "@/lib/utils";
import { ToolPagePromoSections } from "@/components/tool-sections";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { InlineRecents } from "@/components/InlineRecents";
import { AdBanner } from "@/components/AdBanner";
import { useDropzone } from "react-dropzone";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { extractTextFromPDF, extractTextFromImage, getYouTubeTranscript, readTextFile } from "@/utils/contentProcessing";
import { useTemplatePreferences } from "@/hooks/useTemplatePreferences";

// Input tab types
type InputType = "upload" | "recording" | "youtube" | "text";
type TemplateType = "lecture" | "study-guide" | "research" | "project";

// Template definitions - COMPREHENSIVE note generation (not summaries!)
const templates: { id: TemplateType; name: string; description: string; icon: React.ElementType; structure: string[] }[] = [
  { 
    id: "lecture", 
    name: "Lecture Notes", 
    description: "Comprehensive notes with key concepts, definitions, examples, and study tips",
    icon: FileText,
    structure: ["Overview", "Key Concepts", "Detailed Notes", "Key Terms", "Takeaways"]
  },
  { 
    id: "study-guide", 
    name: "Study Guide", 
    description: "Detailed study material with chapters, glossary, and practice questions",
    icon: BookOpen,
    structure: ["Learning Objectives", "Chapters", "Glossary", "Practice Questions"]
  },
  { 
    id: "research", 
    name: "Research Summary", 
    description: "Academic format with in-depth analysis, findings, and implications",
    icon: BookOpen,
    structure: ["Abstract", "Topics", "Analysis", "Insights", "Implications"]
  },
  { 
    id: "project", 
    name: "Project Work Plan", 
    description: "Detailed problem analysis with step-by-step solutions and timeline",
    icon: Clipboard,
    structure: ["Problem Analysis", "Solution", "Timeline", "Success Metrics"]
  },
];

// Highlight colors for marking text
const HIGHLIGHT_COLORS = [
  { name: "Yellow", class: "bg-yellow-300/50 dark:bg-yellow-500/30" },
  { name: "Green", class: "bg-green-300/50 dark:bg-green-500/30" },
  { name: "Blue", class: "bg-blue-300/50 dark:bg-blue-500/30" },
  { name: "Pink", class: "bg-pink-300/50 dark:bg-pink-500/30" },
  { name: "Orange", class: "bg-orange-300/50 dark:bg-orange-500/30" },
];

const languages = [
  { code: "en-US", name: "English" },
  { code: "es-ES", name: "Spanish" },
  { code: "fr-FR", name: "French" },
  { code: "de-DE", name: "German" },
  { code: "it-IT", name: "Italian" },
  { code: "pt-BR", name: "Portuguese" },
  { code: "zh-CN", name: "Chinese" },
  { code: "ja-JP", name: "Japanese" },
  { code: "ko-KR", name: "Korean" },
  { code: "ar-SA", name: "Arabic" },
  { code: "hi-IN", name: "Hindi" },
  { code: "ru-RU", name: "Russian" },
];

// Strip markdown formatting for cleaner TTS
const stripMarkdown = (text: string): string => {
  return text
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/^\s*[-*+]\s/gm, '')
    .replace(/^\s*\d+\.\s/gm, '')
    .replace(/^\s*>/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/<mark[^>]*>/g, '')
    .replace(/<\/mark>/g, '')
    .trim();
};

// Extract YouTube video ID
const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const AILectureNotes = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Handle ?action= query param for quick actions
  const actionParam = searchParams.get("action");
  const defaultTabFromAction = useMemo(() => {
    if (actionParam === "record") return "recording" as const;
    return undefined;
  }, [actionParam]);
  
  // Clear the action param after using it
  useEffect(() => {
    if (actionParam) {
      const timer = setTimeout(() => {
        setSearchParams({}, { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [actionParam, setSearchParams]);
  
  // Tab state - use action param if provided
  const [activeTab, setActiveTab] = useState<InputType>(defaultTabFromAction || "recording");
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  
  // Notes state
  const [notes, setNotes] = useState("");
  const [notesTitle, setNotesTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [selectedHighlightColor, setSelectedHighlightColor] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [progress, setProgress] = useState(0);
  
  // Input state for non-recording tabs
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  
  // Template selection state for non-recording tabs
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [pendingContent, setPendingContent] = useState<string | null>(null);
  
  // Use persisted template preferences
  const { preferences, setLectureTemplate } = useTemplatePreferences();
  const selectedTemplate = preferences.lectureTemplate;
  const notesStyle = preferences.notesStyle;
  
  const { toast } = useToast();
  const { tryUseFeature, confirmUsage, feature, showLimitModal, setShowLimitModal, subscription } = useFeatureLimitGate("lecture_notes");
  const { incrementUsage } = useFeatureUsage();
  const { speak, cancel, isSpeaking, isSupported, voices, getVoicesForLanguage, setPreferredVoice, getPreferredVoice } = useWebSpeechTTS();
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);

  // Load preferred voice when language changes
  useEffect(() => {
    const langCode = selectedLanguage.split("-")[0];
    const preferred = getPreferredVoice(langCode);
    setSelectedVoiceName(preferred);
  }, [selectedLanguage, getPreferredVoice, voices]);

  // Get voices for current language
  const availableVoices = getVoicesForLanguage(selectedLanguage.split("-")[0]);
  // Sync edited notes when notes change
  useEffect(() => {
    setEditedNotes(notes);
  }, [notes]);

  // File dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxSize: 25 * 1024 * 1024,
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setUploadedFile(acceptedFiles[0]);
      }
    },
    onDropRejected: (rejections) => {
      const error = rejections[0]?.errors[0];
      toast({
        title: "Upload failed",
        description: error?.message || "Invalid file",
        variant: "destructive",
      });
    },
  });

  const handleReadAloud = useCallback(async () => {
    if (isSpeaking) {
      cancel();
      return;
    }

    if (!notes) return;

    const cleanText = stripMarkdown(notes);
    
    // Extract language code (e.g., "en-US" → "en", "hi-IN" → "hi")
    const langCode = selectedLanguage.split("-")[0];
    
    try {
      await speak(cleanText, {
        language: langCode,
        voiceName: selectedVoiceName || undefined,
        onStart: () => {
          toast({
            title: "Reading aloud 🔊",
            description: "Tap again to stop",
          });
        },
        onError: (error) => {
          toast({
            title: "Speech Error",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      console.error("TTS error:", error);
    }
  }, [notes, isSpeaking, speak, cancel, toast, selectedLanguage]);

  const handleNotesGenerated = (generatedNotes: string, title: string) => {
    setNotes(generatedNotes);
    setNotesTitle(title);
    setIsEditing(false);
    setIsHighlightMode(false);
  };

  // Extract content from Upload/YouTube/Text tabs and show template selection
  const handleExtractContent = async () => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please sign in to continue");
      }

      let content = "";
      
      if (activeTab === "upload" && uploadedFile) {
        setProcessingStep("Extracting text from file...");
        setProgress(20);
        
        if (uploadedFile.type === "application/pdf") {
          content = await extractTextFromPDF(uploadedFile, session.access_token);
        } else if (uploadedFile.type.startsWith("image/")) {
          content = await extractTextFromImage(uploadedFile, session.access_token);
        } else {
          content = await readTextFile(uploadedFile);
        }
      } else if (activeTab === "youtube") {
        setProcessingStep("Fetching video transcript...");
        setProgress(20);
        
        const videoId = extractVideoId(youtubeUrl);
        if (!videoId) {
          throw new Error("Invalid YouTube URL");
        }
        content = await getYouTubeTranscript(videoId, session.access_token);
      } else if (activeTab === "text") {
        content = textContent;
      }

      if (!content || content.length < 20) {
        throw new Error("Not enough content to generate notes");
      }

      setProgress(100);
      // Store content and show template selection
      setPendingContent(content);
      setShowTemplateSelection(true);
    } catch (error) {
      console.error("Extraction failed:", error);
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Could not extract content",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
      setProgress(0);
    }
  };

  // Generate notes with selected template
  const handleGenerateWithTemplate = async () => {
    if (!pendingContent) return;
    
    setIsProcessing(true);
    setProgress(50);
    setProcessingStep("Generating notes...");
    
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      
      const { data: notesData, error: notesError } = await supabase.functions.invoke("generate-lecture-notes", {
        body: {
          transcription: pendingContent,
          template: selectedTemplate,
          templateStructure: template?.structure || ["Key Points", "Details", "Summary"],
          language: selectedLanguage,
          notesStyle: notesStyle,
        },
      });

      if (notesError || !notesData?.notes) {
        throw new Error(notesError?.message || "Failed to generate notes");
      }

      // Track usage
      await confirmUsage();

      setProgress(100);
      handleNotesGenerated(notesData.notes, notesData.title || template?.name || "Lecture Notes");
      
      // Reset state
      setUploadedFile(null);
      setYoutubeUrl("");
      setTextContent("");
      setShowTemplateSelection(false);
      setPendingContent(null);
    } catch (error) {
      console.error("Generation failed:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Could not generate notes",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
      setProgress(0);
    }
  };

  const handleBackFromTemplateSelection = () => {
    setShowTemplateSelection(false);
    setPendingContent(null);
  };

  const handleDownload = () => {
    const blob = new Blob([notes], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${notesTitle || "lecture-notes"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(notes);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Notes copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      setNotes(editedNotes);
      toast({
        title: "Changes saved ✓",
        description: "Your edits have been applied",
      });
    } else {
      setEditedNotes(notes);
    }
    setIsEditing(!isEditing);
    setIsHighlightMode(false);
  };

  const handleToggleHighlight = () => {
    setIsHighlightMode(!isHighlightMode);
    setIsEditing(false);
    if (!isHighlightMode) {
      toast({
        title: "Highlight mode enabled 🖍️",
        description: "Select text to highlight it",
      });
    }
  };

  const handleTextSelection = useCallback(() => {
    if (!isHighlightMode || !contentRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const range = selection.getRangeAt(0);
    
    if (!contentRef.current.contains(range.commonAncestorContainer)) return;

    const mark = document.createElement("mark");
    mark.className = cn(
      HIGHLIGHT_COLORS[selectedHighlightColor].class,
      "px-0.5 rounded transition-colors"
    );
    
    try {
      range.surroundContents(mark);
      selection.removeAllRanges();
      
      toast({
        title: "Text highlighted!",
        description: `Marked with ${HIGHLIGHT_COLORS[selectedHighlightColor].name}`,
      });
    } catch (e) {
      toast({
        title: "Can't highlight",
        description: "Try selecting text within a single paragraph",
        variant: "destructive",
      });
    }
  }, [isHighlightMode, selectedHighlightColor, toast]);

  useEffect(() => {
    if (isHighlightMode) {
      document.addEventListener("mouseup", handleTextSelection);
      return () => document.removeEventListener("mouseup", handleTextSelection);
    }
  }, [isHighlightMode, handleTextSelection]);

  const clearHighlights = () => {
    if (!contentRef.current) return;
    
    const marks = contentRef.current.querySelectorAll("mark");
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
      }
    });
    
    toast({
      title: "Highlights cleared",
      description: "All highlights have been removed",
    });
  };

  const isReadyToProcess = () => {
    if (activeTab === "upload") return !!uploadedFile;
    if (activeTab === "youtube") return !!extractVideoId(youtubeUrl);
    if (activeTab === "text") return textContent.length >= 20;
    return false;
  };

  const tabs = [
    { id: "upload" as InputType, label: "Upload", icon: Upload },
    { id: "recording" as InputType, label: "Recording", icon: Mic },
    { id: "youtube" as InputType, label: "Youtube", icon: Youtube },
    { id: "text" as InputType, label: "Text", icon: FileText },
  ];
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Tools", href: "/tools" },
    { name: "AI Lecture Notes", href: "/tools/lecture-notes" },
  ];

  return (
    <AppLayout>
      <SEOHead
        title="AI Lecture Notes"
        description="Transform lectures into organized notes instantly. Record audio, upload files, or paste content to generate comprehensive study notes with AI."
        canonicalPath="/tools/lecture-notes"
        breadcrumbs={breadcrumbs}
        keywords="lecture notes, AI note taking, transcription, study notes, audio to notes"
      />
      <div className="min-h-screen bg-background px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-4 sm:space-y-6"
        >
          <div className="relative text-center mb-4 sm:mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="absolute right-0 top-0 h-9 w-9 rounded-full hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="inline-flex items-center justify-center p-2 sm:p-3 rounded-xl bg-primary/10 mb-3 sm:mb-4">
              <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">AI Lecture Notes</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-sans px-2 sm:px-0">
              Record lectures, upload files, or paste content to get organized notes instantly
            </p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="pt-6">
              {/* Tab Bar */}
              <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                        activeTab === tab.id
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {activeTab !== "recording" && (
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="w-[140px] bg-card/80">
                      <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === "recording" ? (
                  <motion.div
                    key="recording"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <LectureRecorder onNotesGenerated={handleNotesGenerated} />
                  </motion.div>
                ) : isProcessing ? (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 space-y-4"
                  >
                    <Loader2 className="w-16 h-16 text-primary animate-spin" />
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground mb-2">
                        {processingStep}
                      </p>
                      <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {progress}% complete
                      </p>
                    </div>
                  </motion.div>
                ) : showTemplateSelection ? (
                  <motion.div
                    key="template-selection"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={handleBackFromTemplateSelection}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <h3 className="text-lg font-semibold">Select a template to summarize</h3>
                    </div>
                    
                    {/* 2x2 Grid of Template Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {templates.map((template) => {
                        const TemplateIcon = template.icon;
                        return (
                          <button
                            key={template.id}
                            onClick={() => setLectureTemplate(template.id)}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all hover:shadow-md",
                              selectedTemplate === template.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                selectedTemplate === template.id ? "bg-primary/20" : "bg-muted"
                              )}>
                                <TemplateIcon className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">{template.name}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Language Selector */}
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger className="flex-1 bg-card/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Generate Button */}
                    <Button onClick={handleGenerateWithTemplate} className="w-full gap-2">
                      <Sparkles className="h-4 w-4" />
                      Generate {templates.find(t => t.id === selectedTemplate)?.name}
                    </Button>
                  </motion.div>
                ) : activeTab === "upload" ? (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div
                      {...getRootProps()}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all min-h-[200px] flex flex-col items-center justify-center",
                        isDragActive
                          ? "border-primary bg-primary/5"
                          : uploadedFile
                          ? "border-green-500 bg-green-500/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <input {...getInputProps()} />
                      {uploadedFile ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                            <Check className="w-6 h-6 text-green-500" />
                          </div>
                          <p className="font-medium text-foreground">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedFile(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-primary" />
                          </div>
                          <p className="font-medium text-foreground">
                            {isDragActive ? "Drop file here" : "Drag & drop or click to upload"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Supports PDF, TXT, and images • Max 25MB
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full mt-4"
                      disabled={!uploadedFile}
                      onClick={handleExtractContent}
                    >
                      Continue
                    </Button>
                  </motion.div>
                ) : activeTab === "youtube" ? (
                  <motion.div
                    key="youtube"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">YouTube URL</label>
                      <Input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="bg-card"
                      />
                    </div>

                    {extractVideoId(youtubeUrl) && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <iframe
                          src={`https://www.youtube.com/embed/${extractVideoId(youtubeUrl)}`}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    )}

                    <Button
                      className="w-full"
                      disabled={!extractVideoId(youtubeUrl)}
                      onClick={handleExtractContent}
                    >
                      Continue
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="text"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">
                          Paste your content
                        </label>
                        <span className="text-xs text-muted-foreground">
                          {textContent.length} characters
                        </span>
                      </div>
                      <Textarea
                        placeholder="Paste lecture transcript, article, or any text content here..."
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        className="min-h-[200px] bg-card resize-y"
                      />
                    </div>

                    <Button
                      className="w-full"
                      disabled={textContent.length < 20}
                      onClick={handleExtractContent}
                    >
                      Continue
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
          
          {/* Inline recents - show when no notes yet */}
          {!notes && !isProcessing && !showTemplateSelection && (
            <InlineRecents toolId="notes" className="mt-0 pt-0 border-t-0" />
          )}
          
          {/* Banner Ad for Free Users - show when no notes yet */}
          {!notes && !isProcessing && !showTemplateSelection && (
            <AdBanner placement="inline" />
          )}
          
          {/* Promotional sections - show when no notes yet */}
          {!notes && !isProcessing && !showTemplateSelection && (
            <ToolPagePromoSections toolId="notes" />
          )}

          {notes && (
            <motion.div
              ref={notesRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onAnimationComplete={() => {
                notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <Card className="border-border/50 shadow-lg overflow-hidden">
                <CardHeader className="flex flex-col gap-3 border-b border-border/50 bg-muted/30">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle className="font-display font-semibold text-lg sm:text-xl">
                      {notesTitle || "Lecture Notes"}
                    </CardTitle>
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                      <Button 
                        variant={isEditing ? "default" : "ghost"} 
                        size="sm" 
                        onClick={handleToggleEdit}
                        className={cn(
                          "flex-1 sm:flex-none",
                          isEditing && "bg-primary text-primary-foreground"
                        )}
                      >
                        {isEditing ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <Pencil className="h-4 w-4" />
                        )}
                        <span className="ml-2 sm:hidden">{isEditing ? "Preview" : "Edit"}</span>
                      </Button>

                      <Button 
                        variant={isHighlightMode ? "default" : "ghost"} 
                        size="sm" 
                        onClick={handleToggleHighlight}
                        disabled={isEditing}
                        className={cn(
                          "flex-1 sm:flex-none",
                          isHighlightMode && "bg-primary text-primary-foreground"
                        )}
                      >
                        <Highlighter className="h-4 w-4" />
                        <span className="ml-2 sm:hidden">Highlight</span>
                      </Button>

                      {isSupported && (
                        <div className="flex items-center gap-0">
                          <Button 
                            variant={isSpeaking ? "default" : "ghost"} 
                            size="sm" 
                            onClick={handleReadAloud}
                            disabled={isEditing}
                            className={cn(
                              "flex-1 sm:flex-none rounded-r-none",
                              isSpeaking && "bg-primary text-primary-foreground"
                            )}
                          >
                            {isSpeaking ? (
                              <VolumeX className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                            <span className="ml-2 sm:hidden">{isSpeaking ? "Stop" : "Listen"}</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="rounded-l-none px-2"
                                disabled={isEditing}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto bg-popover z-50">
                              {availableVoices.length === 0 ? (
                                <DropdownMenuItem disabled>No voices available</DropdownMenuItem>
                              ) : (
                                availableVoices.map((voice) => (
                                  <DropdownMenuItem
                                    key={voice.name}
                                    onClick={() => {
                                      setSelectedVoiceName(voice.name);
                                      setPreferredVoice(voice.name, selectedLanguage.split("-")[0]);
                                    }}
                                    className={cn(
                                      "cursor-pointer",
                                      selectedVoiceName === voice.name && "bg-accent"
                                    )}
                                  >
                                    <span className="truncate max-w-[200px]">
                                      {voice.name.replace(/^(Microsoft|Google|Apple)\s+/i, "")}
                                    </span>
                                    {/neural|natural|premium|enhanced|wavenet/i.test(voice.name) && (
                                      <Star className="h-3 w-3 ml-1 text-primary shrink-0" />
                                    )}
                                  </DropdownMenuItem>
                                ))
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                      <Button variant="ghost" size="sm" onClick={handleCopy} className="flex-1 sm:flex-none">
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="ml-2 sm:hidden">Copy</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1 sm:flex-none">
                        <Download className="h-4 w-4 sm:mr-2" />
                        <span className="ml-2 sm:ml-0">Download</span>
                      </Button>
                    </div>
                  </div>

                  {isHighlightMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50"
                    >
                      <span className="text-sm text-muted-foreground">Color:</span>
                      <div className="flex gap-1.5">
                        {HIGHLIGHT_COLORS.map((color, index) => (
                          <button
                            key={color.name}
                            onClick={() => setSelectedHighlightColor(index)}
                            className={cn(
                              "w-6 h-6 rounded-full border-2 transition-all",
                              color.class,
                              selectedHighlightColor === index
                                ? "border-foreground scale-110"
                                : "border-transparent hover:scale-105"
                            )}
                            title={color.name}
                          />
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearHighlights}
                        className="ml-auto text-xs"
                      >
                        Clear all highlights
                      </Button>
                    </motion.div>
                  )}
                </CardHeader>
                <CardContent className="pt-6">
                  {isEditing ? (
                    <Textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      className="min-h-[400px] font-mono text-sm resize-y"
                      placeholder="Edit your notes here..."
                    />
                  ) : (
                    <div 
                      ref={contentRef}
                      className={cn(
                        "transition-all",
                        isHighlightMode && "cursor-text select-text"
                      )}
                    >
                      <StudySectionRenderer content={notes} type="lecture" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Newton Processing Overlay */}
      <ProcessingOverlay
        isVisible={isProcessing && activeTab !== "recording"}
        message={processingStep || "Generating lecture notes..."}
        subMessage="Newton is organizing your content"
        variant="overlay"
        progress={progress}
        isIndeterminate={progress === 0}
        skipDelayMs={300}
      />

      {/* Usage Limit Modal */}
      <UsageLimitModal
        open={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        featureName={getFeatureDisplayName("lecture_notes")}
        currentUsage={feature?.used || 0}
        limit={feature?.limit || 0}
        unit={feature?.unit}
        tier={subscription.tier}
        proLimit={20}
      />
    </AppLayout>
  );
};

export default AILectureNotes;
