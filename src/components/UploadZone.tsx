import { useCallback, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
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

  const processPDF = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    try {
      // Create object URL for PDF viewer
      const pdfUrl = URL.createObjectURL(file);
      
      onUploadComplete({ 
        pdfUrl,
        pdfName: file.name 
      });
      
      toast({
        title: "PDF Loaded!",
        description: "Select any text to find related videos",
      });
    } catch (error) {
      console.error("Error loading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to load PDF. Please try again.",
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
        if (files[0].type === "application/pdf") {
          processPDF(files[0]);
        } else {
          toast({
            title: "Invalid file type",
            description: "Please upload a PDF file",
            variant: "destructive",
          });
        }
      }
    },
    [toast]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      if (files[0].type === "application/pdf") {
        processPDF(files[0]);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            SmartReader Pro
          </h1>
          <p className="text-xl text-muted-foreground">
            Upload any PDF and discover educational videos for every topic
          </p>
        </div>

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
            accept="application/pdf"
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
                  Loading your PDF...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isDragging ? (
                <FileText className="w-16 h-16 mx-auto text-primary animate-bounce" />
              ) : (
                <Upload className="w-16 h-16 mx-auto text-muted-foreground transition-colors group-hover:text-primary" />
              )}
              <div>
                <p className="text-lg font-semibold text-foreground mb-2">
                  {isDragging ? "Drop your PDF here" : "Drop PDF or click to upload"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Select any text to instantly find related videos
                </p>
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
            <div className="text-2xl font-bold text-secondary mb-1">Curated</div>
            <div className="text-sm text-muted-foreground">Top educational channels</div>
          </div>
          <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm">
            <div className="text-2xl font-bold text-accent mb-1">Instant</div>
            <div className="text-sm text-muted-foreground">Results in seconds</div>
          </div>
        </div>
      </div>
    </div>
  );
};
