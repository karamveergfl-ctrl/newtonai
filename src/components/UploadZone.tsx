import { useCallback, useState } from "react";
import { Upload, FileText, Image, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UploadZoneProps {
  onUploadComplete: (data: { pdfUrl: string; pdfName: string; isHandwritten?: boolean; ocrText?: string }) => void;
}

export const UploadZone = ({ onUploadComplete }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetectingHandwriting, setIsDetectingHandwriting] = useState(false);
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const detectHandwriting = async (imageData: string): Promise<{ isHandwritten: boolean; ocrText?: string }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { isHandwritten: false };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-handwriting`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            imageData,
            detectOnly: true // Flag to detect handwriting and extract text
          }),
        }
      );

      if (!response.ok) {
        return { isHandwritten: false };
      }

      const data = await response.json();
      // If we got text back, assume it contains handwriting
      if (data.text && data.text.length > 20) {
        return { isHandwritten: true, ocrText: data.text };
      }
      return { isHandwritten: false };
    } catch (error) {
      console.error("Error detecting handwriting:", error);
      return { isHandwritten: false };
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    try {
      const isPDF = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");

      if (!isPDF && !isImage) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or image file",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Create object URL for viewer
      const fileUrl = URL.createObjectURL(file);
      
      // For images, detect handwriting
      if (isImage) {
        setIsDetectingHandwriting(true);
        const imageData = await fileToBase64(file);
        const { isHandwritten, ocrText } = await detectHandwriting(imageData);
        setIsDetectingHandwriting(false);
        
        onUploadComplete({ 
          pdfUrl: fileUrl,
          pdfName: file.name,
          isHandwritten,
          ocrText
        });
        
        if (isHandwritten) {
          toast({
            title: "Handwritten Content Detected!",
            description: "Text has been extracted. Select any text to search for videos.",
          });
        } else {
          toast({
            title: "Image Loaded!",
            description: "Use screenshot mode to capture areas for search",
          });
        }
      } else {
        // For PDFs, check first page for handwriting
        setIsDetectingHandwriting(true);
        
        // Convert first page to image for detection
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          const imageData = canvas.toDataURL('image/png');
          const { isHandwritten, ocrText } = await detectHandwriting(imageData);
          setIsDetectingHandwriting(false);
          
          onUploadComplete({ 
            pdfUrl: fileUrl,
            pdfName: file.name,
            isHandwritten,
            ocrText
          });
          
          if (isHandwritten) {
            toast({
              title: "Handwritten PDF Detected!",
              description: "Text extracted from handwriting. Select any text to search.",
            });
          } else {
            toast({
              title: "PDF Loaded!",
              description: "Select any text to find related videos",
            });
          }
        } else {
          setIsDetectingHandwriting(false);
          onUploadComplete({ 
            pdfUrl: fileUrl,
            pdfName: file.name 
          });
        }
      }
    } catch (error) {
      console.error("Error loading file:", error);
      toast({
        title: "Error",
        description: "Failed to load file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsDetectingHandwriting(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        processFile(files[0]);
      }
    },
    [toast]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center
          transition-all duration-300 backdrop-blur-sm
          ${
            isDragging
              ? "border-primary bg-primary/5 scale-105"
              : "border-border bg-card/50 hover:border-primary/50"
          }
          ${isProcessing ? "pointer-events-none" : "cursor-pointer"}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isProcessing && document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        {isProcessing ? (
          <div className="space-y-4 animate-fade-in">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
            <div>
              <p className="text-lg font-semibold text-foreground mb-2">
                {isDetectingHandwriting ? "Detecting Handwriting..." : `Processing ${fileName}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {isDetectingHandwriting 
                  ? "Analyzing content with AI..." 
                  : "Loading your file..."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isDragging ? (
              <FileText className="w-16 h-16 mx-auto text-primary animate-bounce" />
            ) : (
              <div className="flex justify-center gap-2">
                <Upload className="w-12 h-12 text-muted-foreground" />
                <Image className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-foreground mb-2">
                {isDragging ? "Drop your file here" : "Drop PDF or Image"}
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Supports PDFs and images (including handwritten content)
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-primary">
                <Sparkles className="w-4 h-4" />
                <span>AI detects handwriting automatically</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 text-center animate-fade-in">
        <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm">
          <div className="text-2xl font-bold text-primary mb-1">AI Powered</div>
          <div className="text-sm text-muted-foreground">Smart topic extraction</div>
        </div>
        <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm">
          <div className="text-2xl font-bold text-secondary mb-1">Handwriting</div>
          <div className="text-sm text-muted-foreground">OCR detection</div>
        </div>
        <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm">
          <div className="text-2xl font-bold text-accent mb-1">Instant</div>
          <div className="text-sm text-muted-foreground">Results in seconds</div>
        </div>
      </div>
    </div>
  );
};
