import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Send, Bot, User } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("newton-chat", {
        body: {
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context: "teacher-assistant",
        },
      });

      if (error) throw error;

      const reply = data?.reply || data?.content || "I'm sorry, I couldn't generate a response. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Newton chat error:", err);
      toast.error("Failed to get response");
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

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
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {loading && (
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
              <Button type="submit" size="icon" disabled={!input.trim() || loading} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TeacherNewtonChat;
