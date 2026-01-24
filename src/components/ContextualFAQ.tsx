import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

// Tool-specific FAQs organized by route
const toolFAQs: Record<string, FAQItem[]> = {
  "/tools/quiz": [
    {
      question: "How many quiz questions can I generate?",
      answer: "Free users can generate up to 10 questions per quiz, while Pro and Ultra users can generate up to 20 questions per quiz."
    },
    {
      question: "What content types are supported?",
      answer: "You can create quizzes from PDFs, images, YouTube videos, audio recordings, or plain text. Our AI analyzes your content and generates relevant multiple-choice questions."
    },
    {
      question: "Can I review my wrong answers?",
      answer: "Yes! After completing a quiz, you can enter Review Mode to see all questions you got wrong and retry them for better understanding."
    },
    {
      question: "How accurate are the AI-generated questions?",
      answer: "Our AI uses advanced language models to generate contextually accurate questions. Pro/Ultra users get access to more sophisticated question generation."
    }
  ],
  "/tools/flashcards": [
    {
      question: "How many flashcards can I create?",
      answer: "Free users can generate up to 10 flashcards per deck, while Pro and Ultra users can create up to 20 flashcards per deck."
    },
    {
      question: "What is the 'Mastered' feature?",
      answer: "When you feel confident about a flashcard, mark it as 'Mastered'. This helps you track your progress and focus on cards you haven't learned yet."
    },
    {
      question: "Can I shuffle my flashcards?",
      answer: "Yes! Use the shuffle feature to randomize your flashcard order for better retention and to avoid memorizing cards by position."
    },
    {
      question: "What content can I use to create flashcards?",
      answer: "Generate flashcards from PDFs, images, YouTube videos, audio recordings, or pasted text. Our AI extracts key concepts automatically."
    }
  ],
  "/tools/ai-podcast": [
    {
      question: "How long are generated podcasts?",
      answer: "Podcast length varies based on your content. Typically, podcasts range from 5-15 minutes depending on the complexity and amount of source material."
    },
    {
      question: "What is the 'Raise Hand' feature?",
      answer: "During podcast playback, you can 'raise your hand' to ask the AI hosts a question. They'll pause and address your question before continuing."
    },
    {
      question: "Can I choose different voice styles?",
      answer: "Yes! You can select from different podcast styles and voice presets. Pro users get access to premium ElevenLabs voices for more natural audio."
    },
    {
      question: "What are the usage limits?",
      answer: "Free users get 1 podcast per month, Pro users get 15 per month, and Ultra users have unlimited podcast generation."
    }
  ],
  "/tools/mind-map": [
    {
      question: "What mind map layouts are available?",
      answer: "Choose from 4 layouts: Radial (circular), Tree (hierarchical), Cluster (grouped), and Timeline (sequential). Each helps visualize information differently."
    },
    {
      question: "Can I zoom and navigate the mind map?",
      answer: "Yes! Use the zoom controls or pinch-to-zoom on mobile to explore your mind map. You can also drag to pan around larger diagrams."
    },
    {
      question: "What content works best for mind maps?",
      answer: "Mind maps work great for lecture notes, textbook chapters, research papers, or any content with multiple interconnected concepts."
    },
    {
      question: "How many mind maps can I create?",
      answer: "Free users get 3 mind maps per month, Pro users get 90 per month, and Ultra users have unlimited generation."
    }
  ],
  "/tools/lecture-notes": [
    {
      question: "What templates are available?",
      answer: "Choose from 4 templates: Lecture (class notes style), Study Guide (exam prep), Research (academic), and Project (organized sections)."
    },
    {
      question: "Can I edit the generated notes?",
      answer: "Yes! After generation, toggle edit mode to modify, add highlights, or customize your notes before downloading."
    },
    {
      question: "What formats can I download notes in?",
      answer: "You can copy your notes to clipboard or download them. Pro users get additional export options including PDF format."
    },
    {
      question: "Does it support audio recordings?",
      answer: "Yes! Record lectures directly or upload audio files. Our AI transcribes and organizes the content into structured notes."
    }
  ],
  "/tools/summarizer": [
    {
      question: "What summary formats are available?",
      answer: "Choose from Concise (brief overview), Detailed (comprehensive), Bullet Points (key takeaways), or Academic (formal style) formats."
    },
    {
      question: "Can I generate study tools from my summary?",
      answer: "Yes! After creating a summary, you can generate flashcards, quizzes, or mind maps directly from the summarized content."
    },
    {
      question: "What's the maximum document length?",
      answer: "Our AI can handle documents up to 100+ pages. For very long documents, summaries focus on the most important content."
    },
    {
      question: "Can I read summaries aloud?",
      answer: "Yes! Use the text-to-speech feature to have your summary read aloud. Choose from multiple voice options."
    }
  ],
  "/tools/homework-help": [
    {
      question: "What subjects are supported?",
      answer: "We support Math, Science, History, English, and more. Our AI provides step-by-step explanations for complex problems."
    },
    {
      question: "Can I upload photos of my homework?",
      answer: "Yes! Take a photo or screenshot of your problem. Our AI uses advanced OCR to read and solve it, including handwritten content."
    },
    {
      question: "Are solutions explained step-by-step?",
      answer: "Absolutely! Every solution includes detailed, step-by-step explanations so you understand the process, not just the answer."
    },
    {
      question: "What are the daily limits?",
      answer: "Free users get 5 homework help requests per day. Pro and Ultra users have unlimited access."
    }
  ],
  "/compare": [
    {
      question: "How does NewtonAI compare to Chegg?",
      answer: "NewtonAI offers similar homework help features at a fraction of the cost. Plus, we include AI podcasts, mind maps, and flashcards that Chegg doesn't offer."
    },
    {
      question: "Is NewtonAI cheaper than Course Hero?",
      answer: "Yes! Our Pro plan costs significantly less than Course Hero while offering more AI-powered study tools and no document unlock fees."
    },
    {
      question: "What makes NewtonAI different from ChatGPT?",
      answer: "NewtonAI is specifically designed for students with study tools like flashcards, quizzes, and podcasts. ChatGPT is a general-purpose AI assistant."
    },
    {
      question: "Can I try NewtonAI for free?",
      answer: "Yes! Start with our free tier to access all study tools with monthly limits. Upgrade anytime for unlimited access."
    }
  ]
};

// General FAQs for pages without specific content
const generalFAQs: FAQItem[] = [
  {
    question: "What is NewtonAI?",
    answer: "NewtonAI is an AI-powered study platform that helps students learn faster with tools like quizzes, flashcards, podcasts, mind maps, and homework help."
  },
  {
    question: "Is there a free plan?",
    answer: "Yes! Our free tier gives you access to all study tools with monthly limits. Upgrade to Pro or Ultra for unlimited access."
  },
  {
    question: "What content types are supported?",
    answer: "Upload PDFs, images, paste YouTube links, record audio, or type text. Our AI processes all formats to create study materials."
  },
  {
    question: "How do credits work?",
    answer: "Free users have monthly usage limits per tool. Pro and Ultra subscribers get increased limits or unlimited access depending on the tool."
  }
];

interface ContextualFAQProps {
  className?: string;
  maxItems?: number;
  showTitle?: boolean;
}

export function ContextualFAQ({ 
  className, 
  maxItems = 4,
  showTitle = true 
}: ContextualFAQProps) {
  const location = useLocation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Get FAQs for current route, fallback to general FAQs
  const currentFAQs = toolFAQs[location.pathname] || generalFAQs;
  const displayFAQs = currentFAQs.slice(0, maxItems);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className={cn("w-full", className)}>
      {showTitle && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <HelpCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Quick Help</h3>
            <p className="text-xs text-muted-foreground">Common questions</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {displayFAQs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-lg border border-border bg-card/50 overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="flex items-center justify-between w-full p-3 text-left hover:bg-accent/50 transition-colors"
            >
              <span className="text-sm font-medium text-foreground pr-2">
                {faq.question}
              </span>
              <motion.div
                animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {expandedIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-3 pb-3 text-sm text-muted-foreground border-t border-border pt-2">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* View all link */}
      {currentFAQs.length > maxItems && (
        <motion.a
          href="/faq"
          className="flex items-center justify-center gap-1 mt-3 text-xs text-primary hover:text-primary/80 transition-colors"
          whileHover={{ x: 2 }}
        >
          <Sparkles className="h-3 w-3" />
          View all FAQs
        </motion.a>
      )}
    </div>
  );
}

// Export FAQs for use in other components
export { toolFAQs, generalFAQs };
export type { FAQItem };
