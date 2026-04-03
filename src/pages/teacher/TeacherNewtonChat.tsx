import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Send, Bot, User, StopCircle } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const TeacherNewtonChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm Newton, your AI teaching assistant. I can help you with lesson planning, creating quiz questions, explaining concepts, or generating activity ideas. What would you like help with?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setLoading(true);
    setStreamingContent("");

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newton-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
            stream: true,
          }),
          signal: abortController.signal,
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setStreamingContent(accumulated);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: accumulated || "I couldn't generate a response. Please try again." }]);
      setStreamingContent("");
    } catch (err: any) {
      if (err.name === "AbortError") {
        // User cancelled — save what we have
        if (streamingContent) {
          setMessages(prev => [...prev, { role: "assistant", content: streamingContent }]);
          setStreamingContent("");
        }
      } else {
        console.error("Newton chat error:", err);
        toast.error(err.message || "Failed to get response");
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
      }
    } finally {
      setLoading(false);
      setStreamingContent("");
      abortRef.current = null;
    }
  };

  const renderContent = (content: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
        h2: ({ children }) => <h2 className="font-semibold text-sm mt-3 mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="font-semibold text-sm mt-2 mb-1">{children}</h3>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <pre className="bg-muted rounded-md p-2 overflow-x-auto text-xs my-2"><code>{children}</code></pre>
          ) : (
            <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>
          );
        },
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
  );

  return (
    <AppLayout>
      <SEOHead title="Newton Chat" description="AI teaching assistant" noIndex />
      <div className="container max-w-3xl mx-auto px-4 py-6 flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
        {/* Header */}
        <div className="text-center mb-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <MessageSquare className="h-6 w-6 text-primary" />
          </motion.div>
          <h1 className="text-xl font-display font-bold">Newton Chat</h1>
          <p className="text-xs text-muted-foreground">Your AI teaching assistant</p>
        </div>

        {/* Messages */}
        <Card className="flex-1 border-border/50 overflow-hidden flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "assistant" ? "bg-primary/10" : "bg-muted"
                }`}>
                  {msg.role === "assistant" ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 border border-border/50"
                }`}>
                  {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                </div>
              </motion.div>
            ))}

            {/* Streaming message */}
            {loading && streamingContent && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="max-w-[80%] bg-muted/50 border border-border/50 rounded-2xl px-4 py-2.5 text-sm leading-relaxed">
                  {renderContent(streamingContent)}
                </div>
              </div>
            )}

            {/* Loading indicator when no content yet */}
            {loading && !streamingContent && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-muted/50 border border-border/50 rounded-2xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about lesson plans, quiz ideas, activities..."
                disabled={loading}
                className="flex-1"
              />
              {loading ? (
                <Button type="button" size="icon" variant="outline" onClick={handleCancel} className="shrink-0">
                  <StopCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" size="icon" disabled={!input.trim()} className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </form>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TeacherNewtonChat;
