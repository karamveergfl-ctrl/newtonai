import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { X, Upload } from 'lucide-react';
import { PDFViewerWithHighlight } from './PDFViewerWithHighlight';
import { ChatPanel } from './ChatPanel';
import { usePDFChat } from '@/hooks/usePDFChat';
import { usePDFDocument } from '@/hooks/usePDFDocument';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      navigate(-1);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      await createDocument(uploadedFile.name);
    }
  };

  // No file uploaded yet
  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background p-8">
        <div className="text-center max-w-md">
          <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Upload a PDF to chat</h2>
          <p className="text-muted-foreground mb-6">
            Upload a PDF document and ask questions about its content. 
            Answers will be grounded only in the document.
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
        <div className="flex items-center justify-between p-2 border-b bg-background">
          <h1 className="font-semibold text-sm truncate flex-1 px-2">
            {document?.fileName || file.name}
          </h1>
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
      </div>
    );
  }

  // Desktop layout with split view
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b bg-background">
        <h1 className="font-semibold truncate flex-1 px-2">
          {document?.fileName || file.name}
        </h1>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

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
    </div>
  );
}
