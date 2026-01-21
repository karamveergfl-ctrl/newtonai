import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Download, Copy, Check, Volume2, VolumeX, Pencil, Eye, Highlighter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LectureRecorder } from "@/components/LectureRecorder";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useFeatureGate } from "@/components/FeatureGate";
import { useWebSpeechTTS } from "@/hooks/useWebSpeechTTS";
import { cn } from "@/lib/utils";

// Highlight colors for marking text
const HIGHLIGHT_COLORS = [
  { name: "Yellow", class: "bg-yellow-300/50 dark:bg-yellow-500/30" },
  { name: "Green", class: "bg-green-300/50 dark:bg-green-500/30" },
  { name: "Blue", class: "bg-blue-300/50 dark:bg-blue-500/30" },
  { name: "Pink", class: "bg-pink-300/50 dark:bg-pink-500/30" },
  { name: "Orange", class: "bg-orange-300/50 dark:bg-orange-500/30" },
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

const AILectureNotes = () => {
  const [notes, setNotes] = useState("");
  const [notesTitle, setNotesTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [selectedHighlightColor, setSelectedHighlightColor] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { modal } = useFeatureGate("lecture_notes");
  const { speak, cancel, isSpeaking, isSupported } = useWebSpeechTTS();

  // Sync edited notes when notes change
  useEffect(() => {
    setEditedNotes(notes);
  }, [notes]);

  const handleReadAloud = useCallback(async () => {
    if (isSpeaking) {
      cancel();
      return;
    }

    if (!notes) return;

    const cleanText = stripMarkdown(notes);
    
    try {
      await speak(cleanText, {
        rate: 1.0,
        pitch: 1.0,
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
  }, [notes, isSpeaking, speak, cancel, toast]);

  const handleNotesGenerated = (generatedNotes: string, title: string) => {
    setNotes(generatedNotes);
    setNotesTitle(title);
    setIsEditing(false);
    setIsHighlightMode(false);
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
      // Save changes
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
    
    // Check if selection is within our content
    if (!contentRef.current.contains(range.commonAncestorContainer)) return;

    // Create highlight mark
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
      // Can't surround if selection spans multiple elements
      toast({
        title: "Can't highlight",
        description: "Try selecting text within a single paragraph",
        variant: "destructive",
      });
    }
  }, [isHighlightMode, selectedHighlightColor, toast]);

  // Add mouseup listener for highlighting
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

  return (
    <AppLayout>
      <div className="min-h-screen bg-background px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-4 sm:space-y-6"
        >
          <div className="text-center mb-4 sm:mb-8">
            <div className="inline-flex items-center justify-center p-2 sm:p-3 rounded-xl bg-primary/10 mb-3 sm:mb-4">
              <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">AI Lecture Notes</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-sans px-2 sm:px-0">
              Record lectures or upload audio to get organized notes instantly
            </p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <LectureRecorder onNotesGenerated={handleNotesGenerated} />
            </CardContent>
          </Card>

          {notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 shadow-lg overflow-hidden">
                <CardHeader className="flex flex-col gap-3 border-b border-border/50 bg-muted/30">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <CardTitle className="font-display font-semibold text-lg sm:text-xl">
                      {notesTitle || "Lecture Notes"}
                    </CardTitle>
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                      {/* Edit/View Toggle */}
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

                      {/* Highlight Toggle */}
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
                        <Button 
                          variant={isSpeaking ? "default" : "ghost"} 
                          size="sm" 
                          onClick={handleReadAloud}
                          disabled={isEditing}
                          className={cn(
                            "flex-1 sm:flex-none",
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

                  {/* Highlight Color Picker */}
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
                      <MarkdownRenderer content={notes} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>

      {modal}
    </AppLayout>
  );
};

export default AILectureNotes;
