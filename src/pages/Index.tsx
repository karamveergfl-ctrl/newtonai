import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UploadZone } from "@/components/UploadZone";
import { LectureRecorder } from "@/components/LectureRecorder";
import { WelcomeModal } from "@/components/WelcomeModal";
import { NewUserWelcomeModal } from "@/components/NewUserWelcomeModal";
import { PDFReader } from "@/components/PDFReader";
import { ImageViewer } from "@/components/ImageViewer";
import { VideoPanel } from "@/components/VideoPanel";
import { VideoPlayer } from "@/components/VideoPlayer";
import { GlobalSearchBox } from "@/components/GlobalSearchBox";
import { SolutionPanel } from "@/components/SolutionPanel";
import { StudyTracker } from "@/components/StudyTracker";
import { PDFChat } from "@/components/PDFChat";
import { OCRSplitView } from "@/components/OCRSplitView";
import { FlashcardDeck } from "@/components/FlashcardDeck";
import { QuizMode } from "@/components/QuizMode";
import { StudyToolsBar } from "@/components/StudyToolsBar";
import { FullScreenStudyTool } from "@/components/FullScreenStudyTool";
import { VisualMindMap } from "@/components/VisualMindMap";
import { GamificationBadge } from "@/components/GamificationBadge";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";
import { CreditModal } from "@/components/CreditModal";
import { FEATURE_COSTS, FEATURE_NAMES } from "@/lib/creditConfig";
import { Session } from "@supabase/supabase-js";
import { useProcessingState } from "@/hooks/useProcessingState";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";

// Extracted hooks
import { useVideoSearch } from "@/hooks/useVideoSearch";
import { useSolutionActions } from "@/hooks/useSolutionActions";
import { useStudyToolGeneration } from "@/hooks/useStudyToolGeneration";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const materialConsumedRef = useRef(false);

  // ---- Auth & Profile ----
  const [session, setSession] = useState<Session | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "pro" | "ultra">("free");
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [showNewUserWelcome, setShowNewUserWelcome] = useState(false);
  const [newUserName, setNewUserName] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      supabase.from("profiles").select("full_name, subscription_tier, onboarding_completed")
        .eq("id", session.user.id).single()
        .then(({ data }) => {
          if (data?.full_name) setNewUserName(data.full_name);
          if (data?.subscription_tier) setSubscriptionTier(data.subscription_tier as any);
          if (data && !data.onboarding_completed) navigate("/onboarding");
          setSubscriptionLoading(false);
        });
    }
  }, [session?.user?.id, navigate]);

  useEffect(() => {
    const isNewSignup = localStorage.getItem("newtonai_new_signup");
    if (isNewSignup === "true") {
      const timer = setTimeout(() => { setShowNewUserWelcome(true); localStorage.removeItem("newtonai_new_signup"); }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // ---- Credits ----
  const { credits, hasEnoughCredits, spendCredits, isPremium: isPremiumCredits, loading: creditsLoading } = useCredits();
  const isPremium = isPremiumCredits || subscriptionTier === "ultra" || subscriptionTier === "pro";
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState("");

  const trySpendCredits = useCallback(async (feature: string): Promise<boolean> => {
    if (isPremium) return true;
    if (creditsLoading || subscriptionLoading) return true;
    if (!hasEnoughCredits(feature)) { setBlockedFeature(feature); setShowCreditModal(true); return false; }
    const success = await spendCredits(feature);
    if (success) toast({ title: `${FEATURE_COSTS[feature]} credits used`, description: FEATURE_NAMES[feature] });
    return success;
  }, [isPremium, creditsLoading, subscriptionLoading, hasEnoughCredits, spendCredits, toast]);

  // ---- File State ----
  const [fileData, setFileData] = useState<{ url: string; name: string; isPdf: boolean; isHandwritten?: boolean; ocrText?: string } | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState(10);
  const [triggerScreenshot, setTriggerScreenshot] = useState(false);

  // ---- OCR ----
  const [showOCRView, setShowOCRView] = useState(false);
  const [ocrFile, setOcrFile] = useState<File | null>(null);

  // ---- Lecture Notes ----
  const [lectureNotes, setLectureNotes] = useState("");
  const [lectureNotesTitle, setLectureNotesTitle] = useState("");

  // ---- XP ----
  const [totalXP, setTotalXP] = useState(() => {
    const saved = localStorage.getItem("smartreader_xp");
    return saved ? parseInt(saved, 10) : 0;
  });

  // ---- Processing Animation ----
  const { phase: videoProcessingPhase, isProcessing: isVideoProcessing, startThinking: startVideoThinking, startWriting: startVideoWriting, complete: completeVideoProcessing, reset: resetVideoProcessing } = useProcessingState();
  const [videoProcessingMessage, setVideoProcessingMessage] = useState("");
  const [pendingVideoResult, setPendingVideoResult] = useState<{ type: "quiz" | "flashcards" | "summary" | "mindmap"; data: any; title: string } | null>(null);

  // ---- Study Tool Screens ----
  const [flashcards, setFlashcards] = useState<{ id: string; front: string; back: string }[]>([]);
  const [flashcardTitle, setFlashcardTitle] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<{ id: string; question: string; options: string[]; correctIndex: number; explanation: string }[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [showFlashcardsScreen, setShowFlashcardsScreen] = useState(false);
  const [showQuizScreen, setShowQuizScreen] = useState(false);
  const [showVideoSummaryScreen, setShowVideoSummaryScreen] = useState(false);
  const [showVideoMindMapScreen, setShowVideoMindMapScreen] = useState(false);
  const [videoStudyToolTitle, setVideoStudyToolTitle] = useState("");
  const [videoSummary, setVideoSummary] = useState("");
  const [videoMindMap, setVideoMindMap] = useState("");
  const [videoMindMapData, setVideoMindMapData] = useState<any>(null);
  const [fullScreenMindMapTitle, setFullScreenMindMapTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [mindMap, setMindMap] = useState("");
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [showFullScreenMindMap, setShowFullScreenMindMap] = useState(false);

  // ---- Extracted Hooks ----
  const videoSearch = useVideoSearch();
  const solutionActions = useSolutionActions(videoSearch.solutionData, videoSearch.setSolutionData, videoSearch.searchQuery);

  const studyTools = useStudyToolGeneration({
    pdfText,
    fileData,
    trySpendCredits,
    startVideoThinking,
    startVideoWriting,
    completeVideoProcessing,
    resetVideoProcessing,
    setVideoProcessingMessage,
    setPendingVideoResult,
  });

  // Handle pending video tool results after Newton animation completes
  useEffect(() => {
    if (videoProcessingPhase === "idle" && pendingVideoResult) {
      const { type, data, title } = pendingVideoResult;
      switch (type) {
        case "quiz": setQuizQuestions(data.questions); setQuizTitle(title); setShowQuizScreen(true); break;
        case "flashcards": setFlashcards(data.flashcards); setFlashcardTitle(title); setShowFlashcardsScreen(true); break;
        case "summary": setVideoSummary(data.summary); setVideoStudyToolTitle(title); setShowVideoSummaryScreen(true); break;
        case "mindmap":
          setVideoMindMap(data.mindMap);
          if (data.mindMapData) setVideoMindMapData(data.mindMapData);
          setFullScreenMindMapTitle(title);
          setShowVideoMindMapScreen(true);
          break;
      }
      setPendingVideoResult(null);
      studyTools.resetGenerating();
    }
  }, [videoProcessingPhase, pendingVideoResult, studyTools]);

  // ---- Auto-load class material from navigation state ----
  useEffect(() => {
    const state = location.state as { materialUrl?: string; materialName?: string; materialVideoUrl?: string; returnTo?: string; isPdf?: boolean } | null;
    if (materialConsumedRef.current) return;
    if (state?.materialUrl) {
      materialConsumedRef.current = true;
      const name = state.materialName || "Class Material";
      const isPdf = state.isPdf || name.toLowerCase().endsWith(".pdf") || state.materialUrl.toLowerCase().includes(".pdf");
      const pdfName = isPdf && !name.toLowerCase().endsWith(".pdf") ? name + ".pdf" : name;
      handleUploadComplete({ pdfUrl: state.materialUrl, pdfName });
      if (state.returnTo) setReturnTo(state.returnTo);
      window.history.replaceState({}, document.title);
    } else if (state?.materialVideoUrl) {
      materialConsumedRef.current = true;
      const ytMatch = state.materialVideoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch?.[1]) { videoSearch.handleVideoClick(ytMatch[1]); }
      if (state.returnTo) setReturnTo(state.returnTo);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // ---- Handlers ----
  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/auth"); };

  const handleUploadComplete = async (data: { pdfUrl: string; pdfName: string; isHandwritten?: boolean; ocrText?: string }) => {
    const isPdf = data.pdfName.toLowerCase().endsWith(".pdf");
    setFileData({ url: data.pdfUrl, name: data.pdfName, isPdf, isHandwritten: data.isHandwritten, ocrText: data.ocrText });
    videoSearch.resetSearch();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: session } = await supabase.from("study_sessions").insert({ user_id: user.id, pdf_name: data.pdfName }).select().single();
        setCurrentSessionId(session?.id || null);
      }
    } catch (error) { console.error("Error tracking session:", error); }
  };

  const handleTextSelect = (selectedText: string) => videoSearch.handleSearch(selectedText);
  const handleImageCapture = (imageData: string) => videoSearch.handleSearch("", imageData);

  const handleReset = () => {
    if (fileData?.url) URL.revokeObjectURL(fileData.url);
    setFileData(null);
    videoSearch.resetSearch();
    setPdfText("");
  };

  const handleOCRUpload = () => {
    if (fileData) {
      fetch(fileData.url).then(res => res.blob()).then(blob => {
        const mimeType = fileData.isPdf ? "application/pdf" : "image/png";
        const file = new File([blob], fileData.name, { type: mimeType });
        setOcrFile(file);
        setShowOCRView(true);
      }).catch(error => {
        console.error("Error loading file for OCR:", error);
        toast({ title: "Error", description: "Failed to load file for OCR processing", variant: "destructive" });
      });
    } else {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,application/pdf";
      input.onchange = e => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) { setOcrFile(file); setShowOCRView(true); }
      };
      input.click();
    }
  };

  const handleCloseFlashcards = () => { setShowFlashcardsScreen(false); setFlashcards([]); setFlashcardTitle(""); };
  const handleCloseQuiz = () => { setShowQuizScreen(false); setQuizQuestions([]); setQuizTitle(""); };

  const handleQuizComplete = (score: number, total: number, xpEarned: number) => {
    const newXP = totalXP + xpEarned;
    setTotalXP(newXP);
    localStorage.setItem("smartreader_xp", newXP.toString());
    toast({ title: `+${xpEarned} XP Earned! 🎮`, description: `Total XP: ${newXP}` });
  };

  const handleFindSimilarWithVideos = async () => {
    const data = await solutionActions.handleFindSimilar();
    if (data?.videos?.length > 0) {
      videoSearch.setExplanationVideos(data.videos);
      videoSearch.setAnimationVideos([]);
      videoSearch.setShowVideosPanel(true);
    }
  };

  const handleSidebarToolSelect = (tool: string) => {
    switch (tool) {
      case "flashcards": if (pdfText) studyTools.handleGenerateFlashcardsFromText(pdfText); break;
      case "quiz": if (pdfText) studyTools.handleGenerateQuizFromText(pdfText); break;
      case "summary": if (pdfText) studyTools.handleGenerateSummaryFromText(pdfText); break;
      case "mindmap": if (pdfText) studyTools.handleGenerateMindMapFromText(pdfText); break;
      default: break;
    }
  };

  // ---- Render ----
  if (!session) return null;

  const processingOverlay = isVideoProcessing && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <ProcessingOverlay isVisible={isVideoProcessing} message={videoProcessingMessage} variant="card" />
    </div>
  );

  const modals = (
    <>
      <CreditModal open={showCreditModal} onOpenChange={setShowCreditModal} featureName={FEATURE_NAMES[blockedFeature] || blockedFeature} requiredCredits={FEATURE_COSTS[blockedFeature] || 0} currentCredits={credits} />
      <NewUserWelcomeModal isOpen={showNewUserWelcome} onClose={() => setShowNewUserWelcome(false)} userName={newUserName} />
    </>
  );

  const fullscreenOverlays = (
    <>
      {videoSearch.selectedVideoId && <VideoPlayer videoId={videoSearch.selectedVideoId} onClose={videoSearch.handleClosePlayer} />}
      {showOCRView && ocrFile && <OCRSplitView file={ocrFile} onClose={() => { setShowOCRView(false); setOcrFile(null); }} onTextSelect={videoSearch.handleSearch} />}
      {lectureNotes && <FullScreenStudyTool type="summary" title={lectureNotesTitle || "Lecture Notes"} content={lectureNotes} onClose={() => { setLectureNotes(""); setLectureNotesTitle(""); }} />}
      {(showFlashcardsScreen || flashcards.length > 0) && <FlashcardDeck flashcards={flashcards} title={flashcardTitle} onClose={handleCloseFlashcards} isLoading={studyTools.isGeneratingFlashcards} />}
      {(showQuizScreen || quizQuestions.length > 0) && <QuizMode questions={quizQuestions} title={quizTitle} onClose={handleCloseQuiz} onComplete={handleQuizComplete} isLoading={studyTools.isGeneratingQuiz} />}
      {(showVideoSummaryScreen || videoSummary) && <FullScreenStudyTool type="summary" title={videoStudyToolTitle || "Video Summary"} content={videoSummary} onClose={() => { setShowVideoSummaryScreen(false); setVideoSummary(""); }} isLoading={studyTools.isGeneratingSummary} loadingMessage="Analyzing video content and creating summary..." />}
      {(showVideoMindMapScreen || videoMindMap) && (
        studyTools.isGeneratingMindMap
          ? <FullScreenStudyTool type="mindmap" title={videoStudyToolTitle || "Video Mind Map"} content="" onClose={() => { setShowVideoMindMapScreen(false); setVideoMindMap(""); setVideoMindMapData(null); }} isLoading={true} loadingMessage="Analyzing video content and creating mind map..." />
          : videoMindMapData
            ? <VisualMindMap data={videoMindMapData} title={fullScreenMindMapTitle || "Video Mind Map"} onClose={() => { setShowVideoMindMapScreen(false); setVideoMindMap(""); setVideoMindMapData(null); }} showVideoSlide={videoSearch.showVideosPanel} />
            : videoMindMap
              ? <FullScreenStudyTool type="mindmap" title={fullScreenMindMapTitle || "Video Mind Map"} content={videoMindMap} onClose={() => { setShowVideoMindMapScreen(false); setVideoMindMap(""); }} showVideoSlide={videoSearch.showVideosPanel} />
              : null
      )}
    </>
  );

  // ---- No file loaded: Home view ----
  if (!fileData) {
    const triggerUploadClick = () => (document.querySelector("[data-tutorial='upload-zone']") as HTMLElement)?.click();
    const triggerRecordClick = () => (document.querySelector("[data-action='record-lecture']") as HTMLElement)?.click();

    return (
      <>
        {processingOverlay}
        <AppLayout onToolSelect={handleSidebarToolSelect} onSignOut={handleSignOut}>
          <WelcomeModal onUploadClick={triggerUploadClick} onRecordClick={triggerRecordClick} />
          <div className="flex-1 bg-gradient-to-br from-background via-background to-primary/5 overflow-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
              <GlobalSearchBox onTopicSearch={videoSearch.handleTopicSearch} isSearching={videoSearch.isTopicSearching} />
              {videoSearch.showVideosPanel && (
                <div className="mt-8 animate-fade-in">
                  <VideoPanel
                    animationVideos={videoSearch.animationVideos} explanationVideos={videoSearch.explanationVideos}
                    searchQuery={videoSearch.searchQuery} onVideoClick={videoSearch.handleVideoClick}
                    onClose={videoSearch.handleCloseVideosPanel}
                    onGenerateFlashcards={studyTools.handleGenerateFlashcardsFromVideo}
                    onGenerateQuiz={studyTools.handleGenerateQuizFromVideo}
                    onGenerateSummary={studyTools.handleGenerateSummaryFromVideo}
                    onGenerateMindMap={studyTools.handleGenerateMindMapFromVideo}
                    isGenerating={studyTools.isGeneratingFlashcards || studyTools.isGeneratingQuiz || studyTools.isGeneratingSummary || studyTools.isGeneratingMindMap}
                    activeGenerating={studyTools.activeGenerating}
                    onLoadMore={videoSearch.handleLoadMoreVideos}
                    isLoadingMore={videoSearch.isLoadingMoreVideos}
                    hasMoreAnimation={!!videoSearch.animationNextPageToken}
                    hasMoreExplanation={!!videoSearch.explanationNextPageToken}
                  />
                </div>
              )}
              <div className="mt-8 space-y-6 my-[3px]">
                <StudyTracker />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UploadZone onUploadComplete={handleUploadComplete} />
                  <LectureRecorder onNotesGenerated={(notes, title) => { setLectureNotes(notes); setLectureNotesTitle(title); }} />
                </div>
              </div>
            </div>
            {fullscreenOverlays}
          </div>
        </AppLayout>
        {modals}
      </>
    );
  }

  // ---- File loaded: Document view ----
  const isAnyGenerating = studyTools.isGeneratingFlashcards || studyTools.isGeneratingQuiz || studyTools.isGeneratingSummary || studyTools.isGeneratingMindMap;

  return (
    <>
      {processingOverlay}
      <AppLayout onToolSelect={handleSidebarToolSelect} onSignOut={handleSignOut}>
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-gradient-to-br from-background via-background to-primary/5">
          {/* Compact Header */}
          <div className="p-2 md:p-3 border-b bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Button onClick={() => returnTo ? navigate(returnTo) : handleReset()} variant="ghost" size="sm" className="gap-1 h-8 shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">{returnTo ? "Back to Class" : "New File"}</span>
                </Button>
                <h1 className="text-sm md:text-base font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                  {fileData.name}
                </h1>
              </div>
              {videoSearch.isSearching && (
                <div className="flex items-center gap-2 text-primary shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Searching...</span>
                </div>
              )}
            </div>
          </div>

          {/* Study Tools Bar */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-card/80 to-card/40 border-b backdrop-blur-sm w-fit rounded-b-lg shadow-sm">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full">
              <span className="text-sm font-bold text-primary uppercase tracking-wide">Tools</span>
            </div>
            <StudyToolsBar
              onGenerateQuiz={studyTools.handleGenerateQuizFromContent}
              onGenerateFlashcards={studyTools.handleGenerateFlashcardsFromContent}
              onGenerateSummary={studyTools.handleGenerateSummary}
              onGenerateMindMap={studyTools.handleGenerateMindMap}
              onScreenshot={() => setTriggerScreenshot(true)}
              isGeneratingQuiz={studyTools.isGeneratingQuiz}
              isGeneratingFlashcards={studyTools.isGeneratingFlashcards}
              isGeneratingSummary={studyTools.isGeneratingSummary}
              isGeneratingMindMap={studyTools.isGeneratingMindMap}
              disabled={!pdfText && !fileData?.ocrText}
              totalPages={pdfPageCount}
              className="border-0 p-0 bg-transparent"
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {!videoSearch.showVideosPanel && !videoSearch.solutionData ? (
              <div className="flex-1 flex flex-col p-2 md:p-4 overflow-hidden animate-fade-in min-h-0">
                <div className="flex-1 overflow-hidden min-h-0">
                  {fileData.isPdf ? (
                    <PDFReader pdfUrl={fileData.url} onTextSelect={handleTextSelect} onImageCapture={handleImageCapture} onPdfTextExtracted={setPdfText}
                      triggerScreenshot={triggerScreenshot} onScreenshotTriggered={() => setTriggerScreenshot(false)}
                      onGenerateQuizFromText={studyTools.handleGenerateQuizFromText} onGenerateFlashcardsFromText={studyTools.handleGenerateFlashcardsFromText}
                      onGenerateSummaryFromText={studyTools.handleGenerateSummaryFromText} onGenerateMindMapFromText={studyTools.handleGenerateMindMapFromText}
                      isGeneratingQuiz={studyTools.isGeneratingQuiz} isGeneratingFlashcards={studyTools.isGeneratingFlashcards}
                      isGeneratingSummary={studyTools.isGeneratingSummary} isGeneratingMindMap={studyTools.isGeneratingMindMap}
                      isSearching={videoSearch.isSearching}
                    />
                  ) : (
                    <ImageViewer imageUrl={fileData.url} imageName={fileData.name} ocrText={fileData.ocrText}
                      onTextSelect={handleTextSelect} onImageCapture={handleImageCapture}
                      onGenerateQuizFromText={studyTools.handleGenerateQuizFromText} onGenerateFlashcardsFromText={studyTools.handleGenerateFlashcardsFromText}
                      onGenerateSummaryFromText={studyTools.handleGenerateSummaryFromText} onGenerateMindMapFromText={studyTools.handleGenerateMindMapFromText}
                      isGeneratingQuiz={studyTools.isGeneratingQuiz} isGeneratingFlashcards={studyTools.isGeneratingFlashcards}
                      isGeneratingSummary={studyTools.isGeneratingSummary} isGeneratingMindMap={studyTools.isGeneratingMindMap}
                      isSearching={videoSearch.isSearching}
                    />
                  )}
                </div>
                {fileData.isPdf && <PDFChat pdfText={pdfText} pdfName={fileData.name} />}
              </div>
            ) : (
              <ResizablePanelGroup direction="horizontal" className="flex-1 animate-fade-in">
                {videoSearch.solutionData && (
                  <>
                    <ResizablePanel defaultSize={50} minSize={20}>
                      <SolutionPanel
                        content={videoSearch.solutionData.content} isQuestion={videoSearch.solutionData.isQuestion}
                        onClose={() => videoSearch.setSolutionData(null)} capturedImage={videoSearch.solutionData.capturedImage}
                        isStreaming={videoSearch.solutionData.isStreaming}
                        onFollowUpQuestion={solutionActions.handleFollowUpQuestion} isAnswering={solutionActions.isAnsweringFollowUp}
                        onFindSimilar={handleFindSimilarWithVideos} isFindingSimilar={solutionActions.isFindingSimilar}
                        onGetDetailedSolution={solutionActions.handleGetDetailedSolution} isGettingDetailed={solutionActions.isGettingDetailed}
                        onSolveSimilar={solutionActions.handleSolveSimilar} isSolvingSimilar={solutionActions.isSolvingSimilar}
                      />
                    </ResizablePanel>
                    {videoSearch.showVideosPanel && <ResizableHandle withHandle />}
                  </>
                )}
                {videoSearch.showVideosPanel && (
                  <ResizablePanel defaultSize={videoSearch.solutionData ? 50 : 100} minSize={20}>
                    <div className="h-full bg-card/30 backdrop-blur-sm">
                      <VideoPanel
                        animationVideos={videoSearch.animationVideos} explanationVideos={videoSearch.explanationVideos}
                        searchQuery={videoSearch.searchQuery} onVideoClick={videoSearch.handleVideoClick}
                        onClose={videoSearch.handleCloseVideosPanel}
                        onGenerateFlashcards={studyTools.handleGenerateFlashcardsFromVideo}
                        onGenerateQuiz={studyTools.handleGenerateQuizFromVideo}
                        onGenerateSummary={studyTools.handleGenerateSummaryFromVideo}
                        onGenerateMindMap={studyTools.handleGenerateMindMapFromVideo}
                        isGenerating={isAnyGenerating} activeGenerating={studyTools.activeGenerating}
                        defaultTab="explanation"
                        onLoadMore={videoSearch.handleLoadMoreVideos} isLoadingMore={videoSearch.isLoadingMoreVideos}
                        hasMoreAnimation={!!videoSearch.animationNextPageToken} hasMoreExplanation={!!videoSearch.explanationNextPageToken}
                      />
                    </div>
                  </ResizablePanel>
                )}
              </ResizablePanelGroup>
            )}

            {fullscreenOverlays}
            {summary && <FullScreenStudyTool type="summary" title={fileData?.name || "Document Summary"} content={summary} onClose={() => setSummary("")} />}
            {mindMap && (mindMapData ? <VisualMindMap data={mindMapData} title={fileData?.name || "Document Mind Map"} onClose={() => { setMindMap(""); setMindMapData(null); }} /> : <FullScreenStudyTool type="mindmap" title={fileData?.name || "Document Mind Map"} content={mindMap} onClose={() => setMindMap("")} />)}
            {modals}
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default Index;
