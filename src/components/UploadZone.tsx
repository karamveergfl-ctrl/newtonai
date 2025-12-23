import { useCallback, useState } from "react";
import { Upload, FileText, Image, Loader2, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadZoneProps {
  onUploadComplete: (data: { pdfUrl: string; pdfName: string }) => void;
}

export const UploadZone = ({ onUploadComplete }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
      
      // Directly load the file without OCR - use screenshot feature for analysis
      onUploadComplete({ 
        pdfUrl: fileUrl,
        pdfName: file.name 
      });
      
      toast({
        title: isImage ? "Image Loaded!" : "PDF Loaded!",
        description: "Use screenshot mode to capture areas and solve problems",
      });
    } catch (error) {
      console.error("Error loading file:", error);
      toast({
        title: "Error",
        description: "Failed to load file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
          transition-all duration-300 backdrop-blur-sm min-h-[320px] flex items-center justify-center
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
                Processing {fileName}
              </p>
              <p className="text-sm text-muted-foreground">
                Loading your file...
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
                Supports PDFs and images
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-primary">
                <Camera className="w-4 h-4" />
                <span>Screenshot to solve & find videos</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
