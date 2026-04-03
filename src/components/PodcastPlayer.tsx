import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Hand,
  Loader2,
  Mic,
  X,
  Maximize2,
  Minimize2,
  Volume1,
  Settings,
  Download,
  FileText,
  FileDown,
  Square,
  RotateCcw,
  Music,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePodcastAudioQueue, AudioSegment } from "@/hooks/usePodcastAudioQueue";
import { PodcastVoiceSettings } from "@/components/PodcastVoiceSettings";
import { PodcastSpeakingAvatar } from "@/components/PodcastSpeakingAvatar";
import { PodcastWaveform } from "@/components/PodcastWaveform";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AmbientSoundPicker } from "@/components/AmbientSoundPicker";
import DOMPurify from "dompurify";

export interface PodcastSegment {
  speaker: "host1" | "host2";
  name: string;
  text: string;
  emotion?: string;
  audio?: string;
  fallbackAudio?: boolean;
}

interface PodcastPlayerProps {
  title: string;
  segments: PodcastSegment[];
  onRaiseHand: () => void;
  isRaiseHandActive: boolean;
  onClose?: () => void;
  language?: string;
}

export function PodcastPlayer({ 
  title, 
  segments, 
  onRaiseHand, 
  isRaiseHandActive,
  onClose,
  language = "en"
}: PodcastPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Use the new audio queue hook with language for correct voice selection
  const {
    status,
    currentIndex,
    isPlaying,
    progress,
    toggle,
    seekToSegment,
    skipForward,
    skipBack,
    setVolume,
    setPlaybackRate,
    volume,
    playbackRate,
    usingFallback,
    pause,
  } = usePodcastAudioQueue({
    segments: segments as AudioSegment[],
    language, // Pass language for Hindi/multilingual voice support
    onSegmentChange: (index) => {
      // Scroll WITHIN transcript container only, not the whole page
      if (transcriptRef.current) {
        const segmentElement = transcriptRef.current.querySelector(`[data-segment="${index}"]`) as HTMLElement;
        if (segmentElement) {
          const container = transcriptRef.current;
          const elementTop = segmentElement.offsetTop;
          container.scrollTo({
            top: elementTop - container.clientHeight / 2 + segmentElement.clientHeight / 2,
            behavior: "smooth"
          });
        }
      }
    },
    onComplete: () => {
      console.log("Podcast playback complete");
    },
  });

  const currentSeg = segments[currentIndex];
  const isLoading = status === "loading" || status === "buffering";

  // Handle raise hand
  const handleRaiseHand = useCallback(() => {
    pause();
    onRaiseHand();
  }, [pause, onRaiseHand]);

  // Pause when raise hand is active
  useEffect(() => {
    if (isRaiseHandActive && isPlaying) {
      pause();
    }
  }, [isRaiseHandActive, isPlaying, pause]);

  // Handle mute
  useEffect(() => {
    setVolume(isMuted ? 0 : 1);
  }, [isMuted, setVolume]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Generate transcript text
  const generateTranscriptText = useCallback(() => {
    let text = `${title}\n`;
    text += `${"=".repeat(title.length)}\n\n`;
    
    segments.forEach((seg, idx) => {
      text += `[${seg.name}]:\n${seg.text}\n\n`;
    });
    
    return text;
  }, [title, segments]);

  // Download as TXT
  const downloadAsTxt = useCallback(() => {
    try {
      const text = generateTranscriptText();
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, "_")}_transcript.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Transcript downloaded as TXT");
    } catch (error) {
      console.error("Error downloading TXT:", error);
      toast.error("Failed to download transcript");
    }
  }, [title, generateTranscriptText]);

  // Download as PDF
  const downloadAsPdf = useCallback(async () => {
    try {
      toast.info("Generating PDF...");
      
      // Create a temporary container for rendering
      const container = document.createElement("div");
      container.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 800px;
        padding: 40px;
        background: white;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      
      // Build the HTML content
      // Helper function to escape HTML to prevent XSS
      const escapeHtml = (text: string): string => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      // Build HTML with escaped user content and sanitize with DOMPurify
      const htmlContent = `
        <div style="margin-bottom: 30px;">
          <h1 style="font-size: 24px; color: #1a1a1a; margin-bottom: 8px;">${escapeHtml(title)}</h1>
          <p style="font-size: 14px; color: #666;">Podcast Transcript • ${segments.length} segments</p>
        </div>
        <div style="border-top: 2px solid #e5e5e5; padding-top: 20px;">
          ${segments.map((seg) => `
            <div style="margin-bottom: 20px; page-break-inside: avoid;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="
                  display: inline-block;
                  padding: 4px 12px;
                  border-radius: 16px;
                  font-size: 12px;
                  font-weight: 600;
                  background: ${seg.speaker === "host1" ? "#e0f2fe" : "#fce7f3"};
                  color: ${seg.speaker === "host1" ? "#0369a1" : "#be185d"};
                ">${escapeHtml(seg.name)}</span>
              </div>
              <p style="font-size: 14px; line-height: 1.6; color: #374151; margin: 0;">${escapeHtml(seg.text)}</p>
            </div>
          `).join("")}
        </div>
      `;
      
      // Sanitize the final HTML to prevent any XSS attacks
      container.innerHTML = DOMPurify.sanitize(htmlContent, { 
        ALLOWED_TAGS: ['div', 'h1', 'p', 'span'], 
        ALLOWED_ATTR: ['style'] 
      });
      
      document.body.appendChild(container);
      
      // Capture with html2canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      
      document.body.removeChild(container);
      
      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;
      let page = 0;
      
      // Add pages as needed
      while (heightLeft > 0) {
        if (page > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(
          imgData,
          "PNG",
          10,
          position - (page * (pdfHeight - 20)),
          imgWidth,
          imgHeight
        );
        
        heightLeft -= (pdfHeight - 20);
        page++;
      }
      
      pdf.save(`${title.replace(/[^a-z0-9]/gi, "_")}_transcript.pdf`);
      toast.success("Transcript downloaded as PDF");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to generate PDF");
    }
  }, [title, segments]);

  // Download audio as MP3 (combines base64 segments)
  const downloadAudio = useCallback(async () => {
    const audioSegments = segments.filter(s => s.audio && typeof s.audio === 'string' && s.audio.length > 100);
    if (audioSegments.length === 0) {
      toast.error("No audio available to download. This podcast uses browser voice which cannot be exported.");
      return;
    }
    
    try {
      toast.info("Preparing audio download...");
      
      // Convert base64 segments to blobs and concatenate
      const audioBlobs: Blob[] = [];
      for (const seg of audioSegments) {
        const byteCharacters = atob(seg.audio!);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        audioBlobs.push(new Blob([byteArray], { type: "audio/mpeg" }));
      }
      
      const combinedBlob = new Blob(audioBlobs, { type: "audio/mpeg" });
      const url = URL.createObjectURL(combinedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, "_")}_podcast.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Audio downloaded as MP3");
    } catch (error) {
      console.error("Error downloading audio:", error);
      toast.error("Failed to download audio");
    }
  }, [segments, title]);

  // Check if browser supports speech synthesis
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const hasElevenLabsAudio = segments.some(s => s.audio && typeof s.audio === 'string' && s.audio.length > 100);

  // Stop playback entirely and reset to beginning
  const handleStop = useCallback(() => {
    pause();
    seekToSegment(0);
  }, [pause, seekToSegment]);

  // Restart from beginning
  const handleRestart = useCallback(() => {
    seekToSegment(0);
    // Small delay then play
    setTimeout(() => toggle(), 100);
  }, [seekToSegment, toggle]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "w-full",
        isFullscreen && "fixed inset-0 z-50 bg-background flex items-center justify-center p-4 sm:p-8"
      )}
    >
      <Card className={cn(
        "p-4 sm:p-6 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-border rounded-2xl",
        isFullscreen && "max-w-4xl w-full"
      )}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-bold text-foreground truncate">{title}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Segment {currentIndex + 1} of {segments.length}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {usingFallback && (
                <Badge variant="secondary" className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2">
                  <Volume1 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">Browser Voice</span>
                </Badge>
              )}
              {status === "buffering" && (
                <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2">
                  <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  <span className="hidden sm:inline">Buffering...</span>
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 justify-end flex-shrink-0">
            {/* Download Transcript Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" title="Download Transcript">
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadAsTxt} className="gap-2 cursor-pointer text-sm">
                  <FileText className="w-4 h-4" />
                  Download Transcript (TXT)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadAsPdf} className="gap-2 cursor-pointer text-sm">
                  <FileDown className="w-4 h-4" />
                  Download Transcript (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={downloadAudio} 
                  className="gap-2 cursor-pointer text-sm"
                  disabled={!hasElevenLabsAudio}
                >
                  <Music className="w-4 h-4" />
                  Download Audio (MP3)
                  {!hasElevenLabsAudio && <span className="text-xs text-muted-foreground ml-1">(unavailable)</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Ambient Sounds Picker */}
            <AmbientSoundPicker />
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => setShowVoiceSettings(true)}
              title="Voice Settings"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={onClose}>
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Speaker Avatars - NotebookLM Style with active glow */}
        <div className="flex justify-center items-end gap-6 sm:gap-12 mb-4 sm:mb-6">
          <div className={cn(
            "transition-all duration-300 rounded-full",
            isPlaying && currentSeg?.speaker === "host1" 
              ? "ring-4 ring-teal-500/30 shadow-lg shadow-teal-500/20" 
              : ""
          )}>
            <PodcastSpeakingAvatar
              speaker="host1"
              name="Alex"
              isActive={isPlaying && currentSeg?.speaker === "host1"}
              isLoading={isLoading && currentSeg?.speaker === "host1"}
              size="lg"
            />
          </div>
          <div className={cn(
            "transition-all duration-300 rounded-full",
            isPlaying && currentSeg?.speaker === "host2" 
              ? "ring-4 ring-indigo-500/30 shadow-lg shadow-indigo-500/20" 
              : ""
          )}>
            <PodcastSpeakingAvatar
              speaker="host2"
              name="Sarah"
              isActive={isPlaying && currentSeg?.speaker === "host2"}
              isLoading={isLoading && currentSeg?.speaker === "host2"}
              size="lg"
            />
          </div>
        </div>

        {/* Current Text Display */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-card/50 rounded-lg min-h-[60px] sm:min-h-[80px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-foreground/90 text-center text-sm sm:text-lg leading-relaxed"
            >
              {currentSeg?.text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Waveform Progress Bar */}
        <PodcastWaveform
          segments={segments}
          currentSegment={currentIndex}
          progress={progress}
          onSeekToSegment={seekToSegment}
          className="mb-4 sm:mb-6"
          isPlaying={isPlaying}
        />

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
          {/* Restart */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={handleRestart}
            title="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon"
            className="h-10 w-10 sm:h-11 sm:w-11"
            onClick={skipBack} 
            disabled={currentIndex === 0}
          >
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          
          <Button
            size="lg"
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
            onClick={toggle}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="h-10 w-10 sm:h-11 sm:w-11"
            onClick={skipForward}
            disabled={currentIndex === segments.length - 1}
          >
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Stop */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={handleStop}
            disabled={!isPlaying && currentIndex === 0}
            title="Stop"
          >
            <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
          {/* Volume - hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              onValueChange={([v]) => {
                const newVolume = v / 100;
                setVolume(newVolume);
                if (v > 0) setIsMuted(false);
              }}
              max={100}
              step={1}
              className="w-20 sm:w-24"
            />
          </div>

          {/* Speed */}
          <div className="flex items-center justify-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
              <Button
                key={speed}
                variant={playbackRate === speed ? "secondary" : "ghost"}
                size="sm"
                className="text-[10px] sm:text-xs px-2 sm:px-2.5 h-7 sm:h-8 shrink-0"
                onClick={() => setPlaybackRate(speed)}
              >
                {speed}x
              </Button>
            ))}
          </div>

          {/* Raise Hand */}
          <Button
            variant={isRaiseHandActive ? "secondary" : "outline"}
            size="sm"
            onClick={handleRaiseHand}
            className="gap-2 w-full sm:w-auto h-9 sm:h-8"
            disabled={isRaiseHandActive}
          >
            {isRaiseHandActive ? (
              <>
                <Mic className="w-4 h-4 animate-pulse text-destructive" />
                Listening...
              </>
            ) : (
              <>
                <Hand className="w-4 h-4" />
                Raise Hand
              </>
            )}
          </Button>
        </div>

        {/* Transcript Preview */}
        <div ref={transcriptRef} className="mt-4 sm:mt-6 max-h-32 sm:max-h-48 overflow-y-auto space-y-1.5 sm:space-y-2">
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Transcript</h3>
          {segments.map((seg, idx) => (
            <motion.div
              key={idx}
              data-segment={idx}
              className={cn(
                "p-1.5 sm:p-2 rounded text-xs sm:text-sm cursor-pointer transition-colors",
                idx === currentIndex 
                  ? "bg-primary/10 border-l-2 border-primary" 
                  : "hover:bg-muted/50"
              )}
              onClick={() => seekToSegment(idx)}
              initial={{ opacity: 0.5 }}
              animate={{ 
                opacity: idx === currentIndex ? 1 : 0.7,
                scale: idx === currentIndex ? 1.01 : 1,
              }}
            >
              <span className={cn(
                "font-medium mr-1.5 sm:mr-2",
                seg.speaker === "host1" ? "text-primary" : "text-secondary"
              )}>
                {seg.name}:
              </span>
              <span className="text-foreground/80">{seg.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Voice Settings Dialog */}
        <PodcastVoiceSettings
          isOpen={showVoiceSettings}
          onClose={() => setShowVoiceSettings(false)}
          onSave={() => {
            // Settings are stored in localStorage and will be used on next playback
          }}
        />
      </Card>
    </motion.div>
  );
}
