import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolId } from "./toolPromoData";
import { toolFAQs, generalFAQs, FAQItem } from "@/components/ContextualFAQ";


interface ToolPageFAQProps {
  toolId: ToolId;
  title?: string;
  className?: string;
}

// Map toolId to route path for FAQ lookup
const toolIdToRoute: Record<ToolId, string> = {
  "quiz": "/tools/quiz",
  "flashcards": "/tools/flashcards",
  "podcast": "/tools/ai-podcast",
  "mind-map": "/tools/mind-map",
  "notes": "/tools/lecture-notes",
  "summarizer": "/tools/summarizer",
  "homework-help": "/tools/homework-help",
  "pdf-chat": "/pdf-chat",
};

export function ToolPageFAQ({ 
  toolId, 
  title = "Frequently Asked Questions",
  className 
}: ToolPageFAQProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const routePath = toolIdToRoute[toolId];
  const faqs: FAQItem[] = toolFAQs[routePath] || generalFAQs;

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">Common questions about this tool</p>
        </div>
      </div>

      {/* FAQ Items */}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card/50 overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="flex items-center justify-between w-full p-4 text-left hover:bg-accent/50 transition-colors"
            >
              <span className="text-sm md:text-base font-medium text-foreground pr-4">
                {faq.question}
              </span>
              <div
                className={`shrink-0 transition-transform duration-200 ${expandedIndex === index ? 'rotate-180' : ''}`}
              >
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </div>
            </button>
            
            <AnimatePresence>
              {expandedIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border pt-3">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* View all link */}
      <a
        href="/faq"
        className="flex items-center justify-center gap-1.5 mt-6 text-sm text-primary hover:text-primary/80 transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        View all FAQs
      </a>
      
    </div>
  );
}
