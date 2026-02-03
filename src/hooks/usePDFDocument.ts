import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PDFDocument {
  id: string;
  fileName: string;
  totalPages: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  isScanned: boolean;
}

interface PageData {
  pageNumber: number;
  text: string;
}

export function usePDFDocument() {
  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  const createDocument = useCallback(async (fileName: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pdf_documents')
        .insert({
          user_id: user.id,
          file_name: fileName,
          processing_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      setDocument({
        id: data.id,
        fileName: data.file_name,
        totalPages: data.total_pages,
        processingStatus: data.processing_status as PDFDocument['processingStatus'],
        isScanned: data.is_scanned,
      });

      // Create chat session
      const { data: session, error: sessionError } = await supabase
        .from('pdf_chat_sessions')
        .insert({
          document_id: data.id,
          user_id: user.id,
        })
        .select()
        .single();

      if (!sessionError && session) {
        setSessionId(session.id);
      }

      return data.id;
    } catch (error: any) {
      console.error('Error creating document:', error);
      toast({
        title: 'Error',
        description: 'Failed to create document record',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const processPages = useCallback(async (documentId: string, pages: PageData[]) => {
    if (!documentId || pages.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Mark as processing immediately so chat can be enabled
    setDocument(prev => prev ? { ...prev, processingStatus: 'processing' } : null);

    try {
      // Process in batches of 20 pages
      const BATCH_SIZE = 20;
      const totalBatches = Math.ceil(pages.length / BATCH_SIZE);

      for (let i = 0; i < pages.length; i += BATCH_SIZE) {
        const batch = pages.slice(i, i + BATCH_SIZE);
        
        const { error } = await supabase.functions.invoke('process-pdf-chunks', {
          body: {
            documentId,
            pages: batch,
          },
        });

        if (error) {
          console.error('Batch processing error:', error);
        }

        const progress = Math.round(((i + batch.length) / pages.length) * 100);
        setProcessingProgress(progress);
      }

      // Update local state
      setDocument(prev => prev ? { ...prev, processingStatus: 'completed', totalPages: pages.length } : null);
      setProcessingProgress(100);
    } catch (error: any) {
      console.error('Error processing pages:', error);
      setDocument(prev => prev ? { ...prev, processingStatus: 'failed' } : null);
      toast({
        title: 'Processing Error',
        description: 'Failed to process PDF for chat. You can still read the document.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const loadExistingDocument = useCallback(async (documentId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('pdf_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;

      setDocument({
        id: data.id,
        fileName: data.file_name,
        totalPages: data.total_pages,
        processingStatus: data.processing_status as PDFDocument['processingStatus'],
        isScanned: data.is_scanned,
      });

      // Get existing session or create new one
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: sessions } = await supabase
        .from('pdf_chat_sessions')
        .select('id')
        .eq('document_id', documentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        setSessionId(sessions[0].id);
      } else {
        const { data: newSession } = await supabase
          .from('pdf_chat_sessions')
          .insert({ document_id: documentId, user_id: user.id })
          .select()
          .single();
        
        if (newSession) setSessionId(newSession.id);
      }

      // Fetch existing chunks to get the extracted text
      const { data: chunks, error: chunksError } = await supabase
        .from('document_chunks')
        .select('content, page_number')
        .eq('document_id', documentId)
        .order('page_number', { ascending: true })
        .order('chunk_index', { ascending: true });

      if (chunksError) {
        console.error('Error loading chunks:', chunksError);
        return null;
      }

      if (chunks && chunks.length > 0) {
        const extractedText = chunks.map(c => c.content).join('\n\n');
        return extractedText;
      }

      return null;
    } catch (error) {
      console.error('Error loading document:', error);
      return null;
    }
  }, []);

  return {
    document,
    sessionId,
    isProcessing,
    processingProgress,
    createDocument,
    processPages,
    loadExistingDocument,
  };
}
