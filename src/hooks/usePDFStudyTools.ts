import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProcessingOverlay } from '@/contexts/ProcessingOverlayContext';
import { UniversalGenerationSettings } from '@/components/UniversalStudySettingsDialog';

export type StudyToolType = 'quiz' | 'flashcards' | 'summary' | 'mind_map' | 'podcast';

interface UsePDFStudyToolsOptions {
  documentId: string | null;
  extractedText: string;
  totalPages: number;
  fileName: string;
}

export function usePDFStudyTools({
  documentId,
  extractedText,
  totalPages,
  fileName,
}: UsePDFStudyToolsOptions) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showProcessing, hideProcessing, updateProgress, updateMessage } = useProcessingOverlay();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeToolDialog, setActiveToolDialog] = useState<StudyToolType | null>(null);

  const getToolLabel = (tool: StudyToolType) => {
    switch (tool) {
      case 'quiz': return 'Quiz';
      case 'flashcards': return 'Flashcards';
      case 'summary': return 'Summary';
      case 'mind_map': return 'Mind Map';
      case 'podcast': return 'Podcast';
    }
  };

  const generateStudyMaterial = useCallback(async (
    tool: StudyToolType,
    settings?: UniversalGenerationSettings
  ) => {
    if (!extractedText || isGenerating) {
      toast({
        title: 'No Content',
        description: 'Please wait for the PDF to finish loading.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    const toolLabel = getToolLabel(tool);

    showProcessing({
      message: `Generating ${toolLabel}...`,
      subMessage: `Newton is analyzing your document`,
      variant: 'overlay',
      canCancel: false,
    });

    try {
      let content = extractedText;
      
      // If settings have page range, slice the content (approximation)
      if (settings?.pageStart && settings?.pageEnd && totalPages > 1) {
        const startRatio = (settings.pageStart - 1) / totalPages;
        const endRatio = settings.pageEnd / totalPages;
        const startIdx = Math.floor(content.length * startRatio);
        const endIdx = Math.floor(content.length * endRatio);
        content = content.slice(startIdx, endIdx);
      }

      let endpoint = '';
      let body: Record<string, any> = {};

      switch (tool) {
        case 'quiz':
          endpoint = 'generate-quiz';
          body = {
            content,
            sourceType: 'pdf',
            count: settings?.count || 10,
            difficulty: settings?.difficulty || 'medium',
            title: fileName,
          };
          break;
        case 'flashcards':
          endpoint = 'generate-flashcards';
          body = {
            content,
            sourceType: 'pdf',
            count: settings?.count || 10,
            title: fileName,
          };
          break;
        case 'summary':
          endpoint = 'generate-summary';
          body = {
            content,
            sourceType: 'pdf',
            detailLevel: settings?.detailLevel || 'standard',
            format: settings?.summaryFormat || 'concise',
            includeComparison: settings?.includeComparison ?? true,
            title: fileName,
          };
          break;
        case 'mind_map':
          endpoint = 'generate-mindmap';
          body = {
            content,
            sourceType: 'pdf',
            style: settings?.mindMapStyle || 'radial',
            title: fileName,
          };
          break;
        case 'podcast':
          endpoint = 'generate-podcast-script';
          body = {
            content,
            title: fileName,
            language: 'en',
          };
          break;
      }

      updateMessage(`Generating ${toolLabel}...`, 'Processing content...');
      updateProgress(30, false);

      const { data, error } = await supabase.functions.invoke(endpoint, { body });

      if (error) throw error;

      updateProgress(100, false);
      hideProcessing();

      // Store result in sessionStorage and navigate to tool page
      const resultKey = `pdf_${tool}_result`;
      sessionStorage.setItem(resultKey, JSON.stringify({
        data,
        source: fileName,
        sourceType: 'pdf',
        documentId,
      }));

      toast({
        title: 'Success!',
        description: `${toolLabel} generated successfully.`,
      });

      // Navigate to the appropriate tool page
      switch (tool) {
        case 'quiz':
          navigate('/tools/quiz', { state: { fromPDF: true, result: data } });
          break;
        case 'flashcards':
          navigate('/tools/flashcards', { state: { fromPDF: true, result: data } });
          break;
        case 'summary':
          navigate('/tools/summarizer', { state: { fromPDF: true, result: data } });
          break;
        case 'mind_map':
          navigate('/tools/mind-map', { state: { fromPDF: true, result: data } });
          break;
        case 'podcast':
          navigate('/tools/podcast', { state: { fromPDF: true, result: data } });
          break;
      }

    } catch (error: any) {
      console.error(`Error generating ${tool}:`, error);
      hideProcessing();
      toast({
        title: 'Generation Failed',
        description: error.message || `Failed to generate ${toolLabel}`,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [extractedText, isGenerating, totalPages, fileName, documentId, navigate, toast, showProcessing, hideProcessing, updateProgress, updateMessage]);

  const openToolDialog = useCallback((tool: StudyToolType) => {
    setActiveToolDialog(tool);
  }, []);

  const closeToolDialog = useCallback(() => {
    setActiveToolDialog(null);
  }, []);

  return {
    isGenerating,
    activeToolDialog,
    generateStudyMaterial,
    openToolDialog,
    closeToolDialog,
  };
}
