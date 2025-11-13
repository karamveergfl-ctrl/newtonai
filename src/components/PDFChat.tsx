import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, Loader2, Mic, Volume2, Maximize2, Minimize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AudioRecorder, blobToBase64 } from "@/utils/audioRecorder";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PDFChatProps {
  pdfText: string;
  pdfName: string;
}

export const PDFChat = ({ pdfText, pdfName }: PDFChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRecorder = useRef<AudioRecorder>(new AudioRecorder());
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: textToSend }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-with-pdf", {
        body: {
          question: textToSend,
          pdfContext: pdfText.slice(0, 10000),
          pdfName,
          conversationHistory: messages.slice(-4),
        },
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
    } catch (error) {
      console.error("Error chatting with PDF:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      try {
        const audioBlob = await audioRecorder.current.stop();
        setIsRecording(false);
        
        const base64Audio = await blobToBase64(audioBlob);
        
        const { data, error } = await supabase.functions.invoke("transcribe-audio", {
          body: { audio: base64Audio },
        });

        if (error) throw error;
        
        if (data.text) {
          await handleSend(data.text);
        }
      } catch (error) {
        console.error("Error transcribing audio:", error);
        toast({
          title: "Error",
          description: "Failed to transcribe audio.",
          variant: "destructive",
        });
      }
    } else {
      try {
        await audioRecorder.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error starting recording:", error);
        toast({
          title: "Error",
          description: "Failed to access microphone.",
          variant: "destructive",
        });
      }
    }
  };

  const handlePlayAudio = async (text: string) => {
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setIsPlayingAudio(true);
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text },
      });

      if (error) throw error;

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
        { type: "audio/mp3" }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current.src = audioUrl;
      audioRef.current.onended = () => setIsPlayingAudio(false);
      await audioRef.current.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlayingAudio(false);
      toast({
        title: "Error",
        description: "Failed to play audio.",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  const containerClass = isFullScreen
    ? "fixed inset-0 bg-background flex flex-col z-50 animate-fade-in"
    : "fixed bottom-4 right-4 w-96 h-[500px] bg-card border rounded-lg shadow-2xl flex flex-col z-50 animate-fade-in";

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between p-3 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Chat with PDF</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsFullScreen(!isFullScreen)} 
            className="h-8 w-8"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            Ask questions about "{pdfName}"
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex items-start gap-2 max-w-[80%]">
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePlayAudio(msg.content)}
                      className="h-8 w-8 shrink-0"
                    >
                      <Volume2 className={`w-4 h-4 ${isPlayingAudio ? "text-primary" : ""}`} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t flex gap-2">
        <Button
          onClick={handleVoiceRecord}
          disabled={isLoading}
          size="icon"
          variant={isRecording ? "destructive" : "outline"}
        >
          <Mic className={`w-4 h-4 ${isRecording ? "animate-pulse" : ""}`} />
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask a question or use voice..."
          disabled={isLoading || isRecording}
          className="flex-1"
        />
        <Button onClick={() => handleSend()} disabled={isLoading || !input.trim() || isRecording} size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
