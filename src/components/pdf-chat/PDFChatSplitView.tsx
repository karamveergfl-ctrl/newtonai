import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Upload, 
  ArrowLeft, 
  ChevronDown,
  Brain,
  BookOpen,
  FileText,
  Network,
  Settings2,
  Podcast,
  MessageSquare,
  Lightbulb
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { PDFViewerWithHighlight } from './PDFViewerWithHighlight';
import { ChatPanel } from './ChatPanel';
import { PDFStudyToolsBar } from './PDFStudyToolsBar';
import { usePDFChat } from '@/hooks/usePDFChat';
import { usePDFDocument } from '@/hooks/usePDFDocument';
import { usePDFStudyTools, StudyToolType } from '@/hooks/usePDFStudyTools';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UniversalStudySettingsDialog, UniversalGenerationSettings } from '@/components/UniversalStudySettingsDialog';
import { TextSelectionToolbar } from '@/components/TextSelectionToolbar';
import { MobileTextSelectionDrawer } from '@/components/MobileTextSelectionDrawer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PDFChatSplitViewProps {
  initialFile?: File | null;
  onClose?: () => void;
}

interface HighlightInfo {
  pageNumber: number;
  text: string;
}

interface SelectionPosition {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export function PDFChatSplitView({ initialFile, onClose }: PDFChatSplitViewProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlight, setHighlight] = useState<HighlightInfo | null>(null);
  const [mobileTab, setMobileTab] = useState<'pdf' | 'chat'>('pdf');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState<SelectionPosition | null>(null);
  const [isSearchingVideos, setIsSearchingVideos] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);
  const extractedTextRef = useRef<string>('');

  const {
    document,
    sessionId,
    isProcessing,
    processingProgress,
    createDocument,
    processPages,
  } = usePDFDocument();

  const {
    messages,
    isLoading,
    contextMode,
    selectedText,
    streamingContent,
    isStreaming,
    sendMessage,
    cancelRequest,
    clearMessages,
    setContextMode,
    setCurrentPage: setChatCurrentPage,
    setSelectedText,
  } = usePDFChat({
    documentId: document?.id || null,
    sessionId,
  });

  const {
    isGenerating,
    activeToolDialog,
    generateStudyMaterial,
    openToolDialog,
    closeToolDialog,
  } = usePDFStudyTools({
    documentId: document?.id || null,
    extractedText: extractedTextRef.current,
    totalPages: document?.totalPages || 1,
    fileName: document?.fileName || file?.name || 'Document',
  });

  // Initialize document when file is provided
  useEffect(() => {
    if (initialFile && !document) {
      createDocument(initialFile.name);
    }
  }, [initialFile, document, createDocument]);

  // Update chat hook's current page
  useEffect(() => {
    setChatCurrentPage(currentPage);
  }, [currentPage, setChatCurrentPage]);

  // Show selection toolbar when text is selected
  useEffect(() => {
    if (selectedText) {
      // Capture selection position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionPosition({
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right,
        });
      }
      
      if (isMobile) {
        setShowMobileDrawer(true);
      } else {
        setShowSelectionToolbar(true);
      }
    } else {
      setShowSelectionToolbar(false);
      setShowMobileDrawer(false);
      setSelectionPosition(null);
    }
  }, [selectedText, isMobile]);

  const handleTextExtracted = useCallback(async (pages: Array<{ pageNumber: number; text: string }>) => {
    extractedTextRef.current = pages.map(p => p.text).join('\n\n');
    
    if (document?.id && pages.length > 0) {
      await processPages(document.id, pages);
    }
  }, [document?.id, processPages]);

  const handleTextSelected = useCallback((text: string | null) => {
    setSelectedText(text);
  }, [setSelectedText]);

  const handleCitationClick = useCallback((pageNumber: number, quote: string) => {
    setCurrentPage(pageNumber);
    setHighlight({ pageNumber, text: quote });
    if (isMobile) {
      setMobileTab('pdf');
    }
    setTimeout(() => setHighlight(null), 5000);
  }, [isMobile]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/dashboard');
    }
  };

  const handleNewFile = () => {
    setFile(null);
    extractedTextRef.current = '';
    clearMessages();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      await createDocument(uploadedFile.name);
    }
  };

  const handleToolGenerate = useCallback((tool: StudyToolType) => {
    // Open settings dialog for all tools except podcast
    if (tool === 'podcast') {
      generateStudyMaterial(tool);
    } else {
      openToolDialog(tool);
    }
  }, [openToolDialog, generateStudyMaterial]);

  const handleSettingsConfirm = useCallback((settings: UniversalGenerationSettings) => {
    if (activeToolDialog) {
      generateStudyMaterial(activeToolDialog, settings);
      closeToolDialog();
    }
  }, [activeToolDialog, generateStudyMaterial, closeToolDialog]);

  // PDF-specific Ask/Explain handlers
  const handleAskAboutSelection = useCallback((text: string) => {
    setContextMode('selected_text');
    sendMessage(`What does this mean: "${text}"`);
    setShowSelectionToolbar(false);
    setShowMobileDrawer(false);
    if (isMobile) {
      setMobileTab('chat');
    }
  }, [setContextMode, sendMessage, isMobile]);

  const handleExplainSelection = useCallback((text: string) => {
    setContextMode('selected_text');
    sendMessage(`Explain this in simple terms: "${text}"`);
    setShowSelectionToolbar(false);
    setShowMobileDrawer(false);
    if (isMobile) {
      setMobileTab('chat');
    }
  }, [setContextMode, sendMessage, isMobile]);

  const handleCloseSelectionToolbar = useCallback(() => {
    setShowSelectionToolbar(false);
    setShowMobileDrawer(false);
    setSelectedText(null);
  }, [setSelectedText]);

  // Video search handler for selected text
  const handleSearchVideos = useCallback(async () => {
    if (!selectedText) return;
    
    setIsSearchingVideos(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-videos', {
        body: { query: selectedText.slice(0, 200) }
      });
      
      if (error) throw error;
      
      // Store results and navigate
      sessionStorage.setItem('pdf_video_search', JSON.stringify({
        query: selectedText.slice(0, 100),
        videos: data?.videos || [],
        source: document?.fileName || 'PDF',
      }));
      
      navigate('/dashboard', { state: { showVideoResults: true } });
    } catch (error: any) {
      console.error('Video search error:', error);
      toast({
        title: 'Search Failed',
        description: error.message || 'Failed to search for videos',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingVideos(false);
      setShowSelectionToolbar(false);
      setShowMobileDrawer(false);
    }
  }, [selectedText, document?.fileName, navigate, toast]);

  // Study tool generation handlers for selected text
  const handleGenerateQuiz = useCallback(async (text: string, settings?: UniversalGenerationSettings) => {
    setIsGeneratingQuiz(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          content: text,
          sourceType: 'text',
          count: settings?.count || 10,
          difficulty: settings?.difficulty || 'medium',
          title: document?.fileName || 'Selected Text',
        }
      });
      
      if (error) throw error;
      
      sessionStorage.setItem('pdf_quiz_result', JSON.stringify({
        data,
        source: document?.fileName || 'PDF',
        sourceType: 'pdf',
      }));
      
      navigate('/tools/quiz', { state: { fromPDF: true, result: data } });
    } catch (error: any) {
      console.error('Quiz generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate quiz',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  }, [document?.fileName, navigate, toast]);

  const handleGenerateFlashcards = useCallback(async (text: string, settings?: UniversalGenerationSettings) => {
    setIsGeneratingFlashcards(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: {
          content: text,
          sourceType: 'text',
          count: settings?.count || 10,
          title: document?.fileName || 'Selected Text',
        }
      });
      
      if (error) throw error;
      
      sessionStorage.setItem('pdf_flashcards_result', JSON.stringify({
        data,
        source: document?.fileName || 'PDF',
        sourceType: 'pdf',
      }));
      
      navigate('/tools/flashcards', { state: { fromPDF: true, result: data } });
    } catch (error: any) {
      console.error('Flashcards generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate flashcards',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingFlashcards(false);
    }
  }, [document?.fileName, navigate, toast]);

  const handleGenerateSummary = useCallback(async (text: string, settings?: UniversalGenerationSettings) => {
    setIsGeneratingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: {
          content: text,
          sourceType: 'text',
          detailLevel: settings?.detailLevel || 'standard',
          format: settings?.summaryFormat || 'concise',
          title: document?.fileName || 'Selected Text',
        }
      });
      
      if (error) throw error;
      
      sessionStorage.setItem('pdf_summary_result', JSON.stringify({
        data,
        source: document?.fileName || 'PDF',
        sourceType: 'pdf',
      }));
      
      navigate('/tools/summarizer', { state: { fromPDF: true, result: data } });
    } catch (error: any) {
      console.error('Summary generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate summary',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [document?.fileName, navigate, toast]);

  const handleGenerateMindMap = useCallback(async (text: string, settings?: UniversalGenerationSettings) => {
    setIsGeneratingMindMap(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-mindmap', {
        body: {
          content: text,
          sourceType: 'text',
          style: settings?.mindMapStyle || 'radial',
          title: document?.fileName || 'Selected Text',
        }
      });
      
      if (error) throw error;
      
      sessionStorage.setItem('pdf_mindmap_result', JSON.stringify({
        data,
        source: document?.fileName || 'PDF',
        sourceType: 'pdf',
      }));
      
      navigate('/tools/mind-map', { state: { fromPDF: true, result: data } });
    } catch (error: any) {
      console.error('Mind map generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate mind map',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingMindMap(false);
    }
  }, [document?.fileName, navigate, toast]);

  const isDocumentReady = document?.processingStatus === 'completed' || processingProgress >= 50;

  // No file uploaded yet
  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background p-8">
        <div className="text-center max-w-md">
          <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Upload a PDF to chat</h2>
          <p className="text-muted-foreground mb-6">
            Upload a PDF document and ask questions about its content. 
            Generate quizzes, flashcards, summaries, and mind maps.
          </p>
          <label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button asChild>
              <span>Choose PDF</span>
            </Button>
          </label>
        </div>
      </div>
    );
  }

  // Mobile layout with tabs
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Mobile Text Selection Drawer */}
        <MobileTextSelectionDrawer
          open={showMobileDrawer}
          onOpenChange={setShowMobileDrawer}
          selectedText={selectedText || ''}
          onSearchVideos={handleSearchVideos}
          onGenerateQuiz={handleGenerateQuiz}
          onGenerateFlashcards={handleGenerateFlashcards}
          onGenerateSummary={handleGenerateSummary}
          onGenerateMindMap={handleGenerateMindMap}
          isSearching={isSearchingVideos}
          isGeneratingQuiz={isGeneratingQuiz}
          isGeneratingFlashcards={isGeneratingFlashcards}
          isGeneratingSummary={isGeneratingSummary}
          isGeneratingMindMap={isGeneratingMindMap}
        />

        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b bg-background gap-2">
          <Button variant="ghost" size="sm" onClick={handleNewFile} className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">New</span>
          </Button>
          
          <h1 className="font-semibold text-sm truncate flex-1 px-2 text-center">
            {document?.fileName || file.name}
          </h1>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Settings2 className="w-4 h-4" />
                <span className="text-xs">Study</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleToolGenerate('quiz')} disabled={!isDocumentReady || isGenerating}>
                <Brain className="w-4 h-4 mr-2 text-primary" />
                Generate Quiz
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToolGenerate('flashcards')} disabled={!isDocumentReady || isGenerating}>
                <BookOpen className="w-4 h-4 mr-2 text-violet-500" />
                Generate Flashcards
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToolGenerate('summary')} disabled={!isDocumentReady || isGenerating}>
                <FileText className="w-4 h-4 mr-2 text-amber-500" />
                Generate Summary
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToolGenerate('mind_map')} disabled={!isDocumentReady || isGenerating}>
                <Network className="w-4 h-4 mr-2 text-rose-500" />
                Generate Mind Map
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as 'pdf' | 'chat')} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf">PDF</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
          <TabsContent value="pdf" className="flex-1 m-0">
            <PDFViewerWithHighlight
              file={file}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onTextExtracted={handleTextExtracted}
              onTextSelected={handleTextSelected}
              highlight={highlight}
            />
          </TabsContent>
          <TabsContent value="chat" className="flex-1 m-0">
            <ChatPanel
              messages={messages}
              isLoading={isLoading}
              contextMode={contextMode}
              selectedText={selectedText}
              onSendMessage={sendMessage}
              onCancelRequest={cancelRequest}
              onContextModeChange={setContextMode}
              onCitationClick={handleCitationClick}
              onClearMessages={clearMessages}
              processingStatus={document?.processingStatus}
              processingProgress={processingProgress}
              streamingContent={streamingContent}
              isStreaming={isStreaming}
            />
          </TabsContent>
        </Tabs>

        {/* Settings Dialog - Universal for all tools */}
        {activeToolDialog && activeToolDialog !== 'podcast' && (
          <UniversalStudySettingsDialog
            open={!!activeToolDialog}
            onOpenChange={(open) => !open && closeToolDialog()}
            type={activeToolDialog === 'mind_map' ? 'mindmap' : activeToolDialog}
            contentTitle={document?.fileName || file?.name}
            contentType="pdf"
            totalPages={document?.totalPages || 1}
            onGenerate={handleSettingsConfirm}
          />
        )}
      </div>
    );
  }

  // Desktop layout with split view
  return (
    <div className="flex flex-col h-full">
      {/* Selection Toolbar - Full study tools + Ask/Explain */}
      {showSelectionToolbar && selectedText && (
        <TextSelectionToolbar
          selectedText={selectedText}
          onDismiss={handleCloseSelectionToolbar}
          onSearchVideos={handleSearchVideos}
          onGenerateQuiz={handleGenerateQuiz}
          onGenerateFlashcards={handleGenerateFlashcards}
          onGenerateSummary={handleGenerateSummary}
          onGenerateMindMap={handleGenerateMindMap}
          isSearching={isSearchingVideos}
          isGeneratingQuiz={isGeneratingQuiz}
          isGeneratingFlashcards={isGeneratingFlashcards}
          isGeneratingSummary={isGeneratingSummary}
          isGeneratingMindMap={isGeneratingMindMap}
          selectionPosition={selectionPosition}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b bg-background gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleNewFile} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>New File</span>
          </Button>
          
          <span className="text-muted-foreground">|</span>
          
          <h1 className="font-semibold truncate max-w-[300px]">
            {document?.fileName || file.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Settings2 className="w-4 h-4" />
                Study
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleToolGenerate('quiz')} disabled={!isDocumentReady || isGenerating}>
                <Brain className="w-4 h-4 mr-2 text-primary" />
                Generate Quiz
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToolGenerate('flashcards')} disabled={!isDocumentReady || isGenerating}>
                <BookOpen className="w-4 h-4 mr-2 text-violet-500" />
                Generate Flashcards
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToolGenerate('summary')} disabled={!isDocumentReady || isGenerating}>
                <FileText className="w-4 h-4 mr-2 text-amber-500" />
                Generate Summary
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToolGenerate('mind_map')} disabled={!isDocumentReady || isGenerating}>
                <Network className="w-4 h-4 mr-2 text-rose-500" />
                Generate Mind Map
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Study Tools Toolbar */}
      <PDFStudyToolsBar
        onGenerateQuiz={() => handleToolGenerate('quiz')}
        onGenerateFlashcards={() => handleToolGenerate('flashcards')}
        onGeneratePodcast={() => handleToolGenerate('podcast')}
        onGenerateSummary={() => handleToolGenerate('summary')}
        onGenerateMindMap={() => handleToolGenerate('mind_map')}
        isGenerating={isGenerating}
        disabled={!isDocumentReady}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Split View */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={55} minSize={30}>
          <PDFViewerWithHighlight
            file={file}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onTextExtracted={handleTextExtracted}
            onTextSelected={handleTextSelected}
            highlight={highlight}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={45} minSize={25}>
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            contextMode={contextMode}
            selectedText={selectedText}
            onSendMessage={sendMessage}
            onCancelRequest={cancelRequest}
            onContextModeChange={setContextMode}
            onCitationClick={handleCitationClick}
            onClearMessages={clearMessages}
            processingStatus={document?.processingStatus}
            processingProgress={processingProgress}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Settings Dialog - Universal for all tools */}
      {activeToolDialog && activeToolDialog !== 'podcast' && (
        <UniversalStudySettingsDialog
          open={!!activeToolDialog}
          onOpenChange={(open) => !open && closeToolDialog()}
          type={activeToolDialog === 'mind_map' ? 'mindmap' : activeToolDialog}
          contentTitle={document?.fileName || file?.name}
          contentType="pdf"
          totalPages={document?.totalPages || 1}
          onGenerate={handleSettingsConfirm}
        />
      )}
    </div>
  );
}