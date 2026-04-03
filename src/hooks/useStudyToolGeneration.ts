import { useState, useCallback } from "react";
import { getAuthHeaders } from "@/lib/getAuthHeaders";
import { useToast } from "@/hooks/use-toast";
import type { ProcessingPhase } from "@/hooks/useProcessingState";

export interface VideoGenerationSettings {
  count?: number;
  difficulty?: string;
  detailLevel?: string;
  summaryFormat?: string;
  includeComparison?: boolean;
}

export interface GenerationSettings extends VideoGenerationSettings {
  classId?: string;
}

export interface UniversalGenerationSettings extends VideoGenerationSettings {}

interface StudyToolResult {
  type: "quiz" | "flashcards" | "summary" | "mindmap";
  data: any;
  title: string;
}

interface UseStudyToolGenerationProps {
  pdfText: string;
  fileData: { name: string; isPdf?: boolean; ocrText?: string } | null;
  trySpendCredits: (feature: string) => Promise<boolean>;
  startVideoThinking: () => void;
  startVideoWriting: () => void;
  completeVideoProcessing: () => void;
  resetVideoProcessing: () => void;
  setVideoProcessingMessage: (msg: string) => void;
  setPendingVideoResult: (result: StudyToolResult | null) => void;
}

// Fetch video transcript helper
async function fetchVideoTranscript(videoId: string, videoTitle: string): Promise<string> {
  const { headers } = await getAuthHeaders();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-transcript`,
    { method: "POST", headers, body: JSON.stringify({ videoId, videoTitle }) }
  );
  if (!response.ok) return `Educational video about: ${videoTitle}`;
  const data = await response.json();
  return data.transcript || `Educational video about: ${videoTitle}`;
}

// Generic generator for edge functions
async function callEdgeFunction(
  functionName: string,
  body: Record<string, any>
): Promise<any> {
  const { headers } = await getAuthHeaders();
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
    { method: "POST", headers, body: JSON.stringify(body) }
  );
  if (!response.ok) throw new Error(`Failed to call ${functionName}`);
  return response.json();
}

export function useStudyToolGeneration({
  pdfText,
  fileData,
  trySpendCredits,
  startVideoThinking,
  startVideoWriting,
  completeVideoProcessing,
  resetVideoProcessing,
  setVideoProcessingMessage,
  setPendingVideoResult,
}: UseStudyToolGenerationProps) {
  const { toast } = useToast();
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);
  const [activeGenerating, setActiveGenerating] = useState<"quiz" | "flashcards" | "summary" | "mindmap" | null>(null);

  const resetGenerating = useCallback(() => {
    setIsGeneratingFlashcards(false);
    setIsGeneratingQuiz(false);
    setIsGeneratingSummary(false);
    setIsGeneratingMindMap(false);
    setActiveGenerating(null);
  }, []);

  // Wraps the common pattern: check credits → animate → fetch transcript (if video) → call function → store result
  const generate = useCallback(
    async (opts: {
      creditFeature: string;
      type: "quiz" | "flashcards" | "summary" | "mindmap";
      message: string;
      edgeFunction: string;
      body: Record<string, any>;
      title: string;
      videoId?: string;
      videoTitle?: string;
      transformResult?: (data: any) => any;
    }) => {
      const allowed = await trySpendCredits(opts.creditFeature);
      if (!allowed) return;

      setVideoProcessingMessage(opts.message);
      startVideoThinking();
      setActiveGenerating(opts.type);

      const setGenerating = {
        flashcards: setIsGeneratingFlashcards,
        quiz: setIsGeneratingQuiz,
        summary: setIsGeneratingSummary,
        mindmap: setIsGeneratingMindMap,
      }[opts.type];
      setGenerating(true);

      try {
        let body = { ...opts.body };

        // If video, fetch transcript during thinking phase
        if (opts.videoId && opts.videoTitle) {
          const transcript = await fetchVideoTranscript(opts.videoId, opts.videoTitle);
          body.content = transcript.slice(0, opts.type === "summary" ? 10000 : 8000);
        }

        startVideoWriting();
        const data = await callEdgeFunction(opts.edgeFunction, body);

        const result = opts.transformResult ? opts.transformResult(data) : data;
        setPendingVideoResult({ type: opts.type, data: result, title: opts.title });
        completeVideoProcessing();
      } catch (error) {
        console.error(`Error generating ${opts.type}:`, error);
        resetVideoProcessing();
        setGenerating(false);
        setActiveGenerating(null);
        toast({ title: "Error", description: `Failed to generate ${opts.type}`, variant: "destructive" });
      }
    },
    [trySpendCredits, startVideoThinking, startVideoWriting, completeVideoProcessing, resetVideoProcessing, setVideoProcessingMessage, setPendingVideoResult, toast]
  );

  // ---- Video-based generators ----

  const handleGenerateFlashcardsFromVideo = useCallback(
    (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) =>
      generate({
        creditFeature: "flashcards", type: "flashcards",
        message: "Generating flashcards from video...",
        edgeFunction: "generate-flashcards",
        body: { type: "video", videoTitle, settings: settings ? { count: settings.count, difficulty: settings.difficulty } : undefined },
        title: videoTitle, videoId, videoTitle,
      }),
    [generate]
  );

  const handleGenerateQuizFromVideo = useCallback(
    (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) =>
      generate({
        creditFeature: "quiz", type: "quiz",
        message: "Generating quiz from video...",
        edgeFunction: "generate-quiz",
        body: { type: "video", title: videoTitle, settings: settings ? { count: settings.count, difficulty: settings.difficulty } : undefined },
        title: videoTitle, videoId, videoTitle,
      }),
    [generate]
  );

  const handleGenerateSummaryFromVideo = useCallback(
    (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) =>
      generate({
        creditFeature: "summary", type: "summary",
        message: "Generating summary from video...",
        edgeFunction: "generate-summary",
        body: { detailLevel: settings?.detailLevel || "standard", format: settings?.summaryFormat || "concise", includeComparison: settings?.includeComparison ?? true },
        title: videoTitle, videoId, videoTitle,
      }),
    [generate]
  );

  const handleGenerateMindMapFromVideo = useCallback(
    (videoId: string, videoTitle: string, settings?: VideoGenerationSettings) =>
      generate({
        creditFeature: "mind_map", type: "mindmap",
        message: "Generating mind map from video...",
        edgeFunction: "generate-mindmap",
        body: { detailLevel: settings?.detailLevel },
        title: videoTitle, videoId, videoTitle,
        transformResult: (data) => ({ mindMap: data.mindMap, mindMapData: data.mindMapData }),
      }),
    [generate]
  );

  // ---- Content-based generators (from uploaded document) ----

  const getContent = useCallback(() => pdfText || fileData?.ocrText || "", [pdfText, fileData]);

  const handleGenerateFlashcardsFromContent = useCallback(
    (settings?: GenerationSettings) => {
      const content = getContent();
      if (!content) { toast({ title: "No content", description: "Please upload a document first", variant: "destructive" }); return; }
      return generate({
        creditFeature: "flashcards", type: "flashcards",
        message: "Generating flashcards from document...",
        edgeFunction: "generate-flashcards",
        body: { type: fileData?.isPdf ? "pdf" : "image", content: content.slice(0, 8000), settings },
        title: fileData?.name || "Document Flashcards",
      });
    },
    [generate, getContent, fileData, toast]
  );

  const handleGenerateQuizFromContent = useCallback(
    async (settings?: GenerationSettings) => {
      const content = getContent();
      if (!content) { toast({ title: "No content", description: "Please upload a document first", variant: "destructive" }); return; }

      const allowed = await trySpendCredits("quiz");
      if (!allowed) return;

      setVideoProcessingMessage("Generating quiz from document...");
      startVideoThinking();
      setActiveGenerating("quiz");
      setIsGeneratingQuiz(true);

      try {
        startVideoWriting();
        const data = await callEdgeFunction("generate-quiz", {
          type: fileData?.isPdf ? "pdf" : "image",
          content: content.slice(0, 8000),
          title: fileData?.name,
          settings,
        });

        // If classId provided, create assignment
        if (settings?.classId) {
          try {
            const { supabase } = await import("@/integrations/supabase/client");
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const questionsWithAnswers = (data.questions || []).map((q: any) => ({
                ...q,
                correct_answer: q.options?.[q.correctIndex] || "",
              }));
              const { error: assignmentError } = await supabase.from("assignments").insert({
                class_id: settings.classId,
                teacher_id: user.id,
                title: (fileData?.name || "Document") + " Quiz",
                assignment_type: "quiz",
                content: { questions: questionsWithAnswers } as any,
                is_published: true,
                max_score: questionsWithAnswers.length,
              });
              if (!assignmentError) {
                const { data: classData } = await supabase.from("classes").select("name").eq("id", settings.classId).single();
                toast({ title: "Quiz assigned! 🎓", description: `Published to ${classData?.name || "class"}` });
              }
            }
          } catch (err) {
            console.error("Error creating assignment:", err);
          }
        }

        setPendingVideoResult({ type: "quiz", data, title: fileData?.name || "Document Quiz" });
        completeVideoProcessing();
      } catch (error) {
        console.error("Error generating quiz:", error);
        resetVideoProcessing();
        setIsGeneratingQuiz(false);
        setActiveGenerating(null);
        toast({ title: "Error", description: "Failed to generate quiz", variant: "destructive" });
      }
    },
    [getContent, fileData, trySpendCredits, startVideoThinking, startVideoWriting, completeVideoProcessing, resetVideoProcessing, setVideoProcessingMessage, setPendingVideoResult, toast]
  );

  const handleGenerateSummary = useCallback(
    () => {
      const content = getContent();
      if (!content) { toast({ title: "No content", description: "Please upload a document first", variant: "destructive" }); return; }
      return generate({
        creditFeature: "summary", type: "summary",
        message: "Generating notes from document...",
        edgeFunction: "generate-summary",
        body: { content: content.slice(0, 10000) },
        title: fileData?.name || "Document Notes",
      });
    },
    [generate, getContent, fileData, toast]
  );

  const handleGenerateMindMap = useCallback(
    () => {
      const content = getContent();
      if (!content) { toast({ title: "No content", description: "Please upload a document first", variant: "destructive" }); return; }
      return generate({
        creditFeature: "mind_map", type: "mindmap",
        message: "Generating mind map from document...",
        edgeFunction: "generate-mindmap",
        body: { content: content.slice(0, 8000) },
        title: fileData?.name || "Document Mind Map",
        transformResult: (data) => ({ mindMap: data.mindMap, mindMapData: data.mindMapData }),
      });
    },
    [generate, getContent, fileData, toast]
  );

  // ---- Text-selection-based generators ----

  const handleGenerateQuizFromText = useCallback(
    (selectedText: string, settings?: UniversalGenerationSettings) => {
      const text = selectedText?.trim();
      if (!text) { toast({ title: "No text selected", description: "Please select some text to generate a quiz", variant: "destructive" }); return; }
      return generate({
        creditFeature: "quiz", type: "quiz",
        message: "Generating quiz from selected text...",
        edgeFunction: "generate-quiz",
        body: { type: "text", content: text, title: "Selected Text Quiz", settings: settings ? { count: settings.count, difficulty: settings.difficulty } : undefined },
        title: "Quiz from Selected Text",
      });
    },
    [generate, toast]
  );

  const handleGenerateFlashcardsFromText = useCallback(
    (selectedText: string, settings?: UniversalGenerationSettings) => {
      const text = selectedText?.trim();
      if (!text) { toast({ title: "No text selected", description: "Please select some text to generate flashcards", variant: "destructive" }); return; }
      return generate({
        creditFeature: "flashcards", type: "flashcards",
        message: "Generating flashcards from selected text...",
        edgeFunction: "generate-flashcards",
        body: { type: "text", content: text, title: "Selected Text", settings: settings ? { count: settings.count, difficulty: settings.difficulty } : undefined },
        title: "Flashcards from Selected Text",
      });
    },
    [generate, toast]
  );

  const handleGenerateSummaryFromText = useCallback(
    (selectedText: string, settings?: UniversalGenerationSettings) => {
      const text = selectedText?.trim();
      if (!text) { toast({ title: "No text selected", description: "Please select some text to generate notes", variant: "destructive" }); return; }
      return generate({
        creditFeature: "summary", type: "summary",
        message: "Generating summary from selected text...",
        edgeFunction: "generate-summary",
        body: { content: text, detailLevel: settings?.detailLevel || "standard", format: settings?.summaryFormat || "concise", includeComparison: settings?.includeComparison ?? true },
        title: "Summary from Selected Text",
      });
    },
    [generate, toast]
  );

  const handleGenerateMindMapFromText = useCallback(
    (selectedText: string, settings?: UniversalGenerationSettings) => {
      const text = selectedText?.trim();
      if (!text) { toast({ title: "No text selected", description: "Please select some text to generate a mind map", variant: "destructive" }); return; }
      return generate({
        creditFeature: "mind_map", type: "mindmap",
        message: "Generating mind map from selected text...",
        edgeFunction: "generate-mindmap",
        body: { content: text, detailLevel: settings?.detailLevel },
        title: "Mind Map from Selected Text",
        transformResult: (data) => ({ mindMap: data.mindMap, mindMapData: data.mindMapData }),
      });
    },
    [generate, toast]
  );

  return {
    isGeneratingFlashcards,
    isGeneratingQuiz,
    isGeneratingSummary,
    isGeneratingMindMap,
    activeGenerating,
    resetGenerating,
    // Video-based
    handleGenerateFlashcardsFromVideo,
    handleGenerateQuizFromVideo,
    handleGenerateSummaryFromVideo,
    handleGenerateMindMapFromVideo,
    // Content-based
    handleGenerateFlashcardsFromContent,
    handleGenerateQuizFromContent,
    handleGenerateSummary,
    handleGenerateMindMap,
    // Text-selection-based
    handleGenerateQuizFromText,
    handleGenerateFlashcardsFromText,
    handleGenerateSummaryFromText,
    handleGenerateMindMapFromText,
  };
}
