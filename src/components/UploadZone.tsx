import { useCallback, useState } from "react";
import { Upload, FileText, Image, Loader2, Camera, Search, ArrowDown, MousePointerClick } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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


  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  const supportedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-powerpoint", // .ppt
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  ];

  const isFileSupported = (file: File) => {
    return supportedTypes.includes(file.type) || file.type.startsWith("image/");
  };

  const getFileTypeLabel = (file: File) => {
    if (file.type.startsWith("image/")) return "Image";
    if (file.type === "application/pdf") return "PDF";
    if (file.type.includes("word")) return "Document";
    if (file.type.includes("presentation") || file.type.includes("powerpoint")) return "Presentation";
    return "File";
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    try {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: "Maximum file size is 20MB",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Check file type
      if (!isFileSupported(file)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image, PDF, DOC, DOCX, PPT, or PPTX file",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Create object URL for viewer
      const fileUrl = URL.createObjectURL(file);
      const fileType = getFileTypeLabel(file);
      
      // Directly load the file without OCR - use screenshot feature for analysis
      onUploadComplete({ 
        pdfUrl: fileUrl,
        pdfName: file.name 
      });
      
      toast({
        title: `${fileType} Loaded!`,
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
    <div className="w-full h-full">
      <motion.div
        data-tutorial="upload-zone"
        className={`
          relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center
          transition-all duration-300 backdrop-blur-sm min-h-[320px] h-full flex items-center justify-center
          group
          ${
            isDragging
              ? "border-primary bg-primary/10 scale-[1.02] shadow-2xl shadow-primary/20"
              : "border-primary/40 bg-gradient-to-br from-card/80 via-card/60 to-primary/5 hover:border-primary hover:bg-primary/5 hover:shadow-xl hover:shadow-primary/10"
          }
          ${isProcessing ? "pointer-events-none" : "cursor-pointer"}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isProcessing && document.getElementById("file-input")?.click()}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={{ scale: isProcessing ? 1 : 1.01 }}
        whileTap={{ scale: isProcessing ? 1 : 0.99 }}
      >
        {/* Animated glow effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 pointer-events-none"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Corner sparkles */}
        {!isProcessing && (
          <>
            <motion.div
              className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary/60"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-primary/60"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            <motion.div
              className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-primary/40"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}
        
        <input
          id="file-input"
          type="file"
          accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={handleFileInput}
          className="hidden"
        />

        {isProcessing ? (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
            <div>
              <p className="text-lg font-semibold text-foreground mb-2">
                Processing {fileName}
              </p>
              <p className="text-sm text-muted-foreground">
                Loading your file...
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-5 relative z-10">
            {/* Floating click indicator badge */}
            <motion.div
              className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-lg flex items-center gap-1.5"
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              Click to upload
            </motion.div>
            
            {isDragging ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="pt-6"
              >
                <FileText className="w-14 h-14 mx-auto text-primary" />
              </motion.div>
            ) : (
              <motion.div 
                className="flex justify-center gap-4 pt-6"
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <motion.div
                  className="p-3 rounded-xl bg-primary/10 border border-primary/20"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  <Upload className="w-8 h-8 text-primary" />
                </motion.div>
                <motion.div
                  className="p-3 rounded-xl bg-primary/10 border border-primary/20"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Image className="w-8 h-8 text-primary" />
                </motion.div>
              </motion.div>
            )}
            
            {/* Animated arrow pointing down */}
            <motion.div
              className="flex justify-center"
              animate={{
                y: [0, 6, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ArrowDown className="w-5 h-5 text-primary/60" />
            </motion.div>
            
            <div>
              <p className="text-xl font-bold text-foreground mb-2">
                {isDragging ? "Drop your file here" : "Upload Document"}
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                <span className="font-medium text-foreground/80">Drop files here</span> or <span className="text-primary font-medium underline underline-offset-2 decoration-primary/50">click to browse</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Images, PDF, Doc, Docx, PPT, PPTX • Max 20MB
              </p>
              
              <div className="mt-5 pt-5 border-t border-border/40 space-y-3">
                <motion.div 
                  className="flex items-start gap-3 text-left p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <div className="p-2 rounded-lg bg-primary/15 border border-primary/20">
                    <Search className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Topic-Based Video Search</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Select text to find curated YouTube tutorials
                    </p>
                  </div>
                </motion.div>
                <motion.div 
                  className="flex items-start gap-3 text-left p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <div className="p-2 rounded-lg bg-primary/15 border border-primary/20">
                    <Camera className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Screenshot to Solve</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Capture problems for step-by-step AI solutions
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
