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
  Settings2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PDFViewerWithHighlight } from './PDFViewerWithHighlight';
import { ChatPanel } from './ChatPanel';
import { PDFStudyToolsBar } from './PDFStudyToolsBar';
import { usePDFChat } from '@/hooks/usePDFChat';
import { usePDFDocument } from '@/hooks/usePDFDocument';
import { usePDFStudyTools } from '@/hooks/usePDFStudyTools';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GenerationSettingsDialog, GenerationSettings } from '@/components/GenerationSettingsDialog';

interface PDFChatSplitViewProps {
  initialFile?: File | null;
  onClose?: () => void;
}

interface HighlightInfo {
  pageNumber: number;
  text: string;
}

export function PDFChatSplitView({ initialFile, onClose }: PDFChatSplitViewProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlight, setHighlight] = useState<HighlightInfo | null>(null);
  const [mobileTab, setMobileTab] = useState<'pdf' | 'chat'>('pdf');
  const [searchQuery, setSearchQuery] = useState('');
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
    sendMessage,
    cancelRequest,
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

  const handleTextExtracted = useCallback(async (pages: Array<{ pageNumber: number; text: string }>) => {
    // Store full extracted text for study tools
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
    // Clear highlight after 5 seconds
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
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      await createDocument(uploadedFile.name);
    }
  };

  const handleToolGenerate = useCallback((tool: 'quiz' | 'flashcards' | 'summary' | 'mind_map') => {
    if (tool === 'quiz' || tool === 'flashcards') {
      openToolDialog(tool);
    } else {
      generateStudyMaterial(tool);
    }
  }, [openToolDialog, generateStudyMaterial]);

  const handleSettingsConfirm = useCallback((settings: GenerationSettings) => {
    if (activeToolDialog) {
      generateStudyMaterial(activeToolDialog, settings);
      closeToolDialog();
    }
  }, [activeToolDialog, generateStudyMaterial, closeToolDialog]);

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
                <BookOpen className="w-4 h-4 mr-2 text-secondary" />
                Generate Flashcards
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToolGenerate('summary')} disabled={!isDocumentReady || isGenerating}>
                <FileText className="w-4 h-4 mr-2 text-accent" />
                Generate Summary
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToolGenerate('mind_map')} disabled={!isDocumentReady || isGenerating}>
                <Network className="w-4 h-4 mr-2 text-primary" />
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
              processingStatus={document?.processingStatus}
              processingProgress={processingProgress}
            />
          </TabsContent>
        </Tabs>

        {/* Settings Dialogs */}
        <GenerationSettingsDialog
          open={activeToolDialog === 'quiz'}
          onOpenChange={(open) => !open && closeToolDialog()}
          type="quiz"
          totalPages={document?.totalPages || 1}
          onGenerate={handleSettingsConfirm}
        />
        <GenerationSettingsDialog
          open={activeToolDialog === 'flashcards'}
          onOpenChange={(open) => !open && closeToolDialog()}
          type="flashcards"
          totalPages={document?.totalPages || 1}
          onGenerate={handleSettingsConfirm}
        />
      </div>
    );
  }

  // Desktop layout with split view
  return (
    <div className="flex flex-col h-full">
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
                <BookOpen className="w-4 h-4 mr-2 text-secondary" />
                Generate Flashcards
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToolGenerate('summary')} disabled={!isDocumentReady || isGenerating}>
                <FileText className="w-4 h-4 mr-2 text-accent" />
                Generate Summary
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToolGenerate('mind_map')} disabled={!isDocumentReady || isGenerating}>
                <Network className="w-4 h-4 mr-2 text-primary" />
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
            processingStatus={document?.processingStatus}
            processingProgress={processingProgress}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Settings Dialogs */}
      <GenerationSettingsDialog
        open={activeToolDialog === 'quiz'}
        onOpenChange={(open) => !open && closeToolDialog()}
        type="quiz"
        totalPages={document?.totalPages || 1}
        onGenerate={handleSettingsConfirm}
      />
      <GenerationSettingsDialog
        open={activeToolDialog === 'flashcards'}
        onOpenChange={(open) => !open && closeToolDialog()}
        type="flashcards"
        totalPages={document?.totalPages || 1}
        onGenerate={handleSettingsConfirm}
      />
    </div>
  );
}
