import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PDFChatSplitView } from "@/components/pdf-chat";
import { SEOHead } from "@/components/SEOHead";
import { ToolAuthGate } from "@/components/ToolAuthGate";
import { ContentDisclaimer } from "@/components/ContentDisclaimer";
import { ToolPagePromoSections } from "@/components/tool-sections";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MessageSquare, FileText, Search, BookOpen, Zap, Brain } from "lucide-react";

export default function PDFChat() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Tools", href: "/tools" },
    { name: "Chat with PDF", href: "/pdf-chat" },
  ];

  // Authenticated users get the full-screen split view experience
  if (isAuthenticated === true) {
    return (
      <>
        <SEOHead
          title="Chat with PDF | NewtonAI"
          description="Upload a PDF and ask questions about its content. Get accurate, AI-grounded answers with page citations using retrieval-augmented generation."
          canonicalPath="/pdf-chat"
          breadcrumbs={breadcrumbs}
          keywords="chat with PDF, PDF AI, document AI, PDF question answering, RAG, study PDF"
        />
        <div className="h-[calc(100vh-4rem)]">
          <PDFChatSplitView />
        </div>
      </>
    );
  }

  // Loading state
  if (isAuthenticated === null) {
    return null;
  }

  // Unauthenticated: show educational content for crawlers + sign-in CTA
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Chat with PDF | NewtonAI"
        description="Upload a PDF and ask questions about its content. Get accurate, AI-grounded answers with page citations using retrieval-augmented generation."
        canonicalPath="/pdf-chat"
        breadcrumbs={breadcrumbs}
        keywords="chat with PDF, PDF AI, document AI, PDF question answering, RAG, study PDF"
      />
      <Header />

      <main className="container mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground mb-4">
            Chat with Any PDF Using AI
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Upload any PDF — textbook, research paper, lecture slides, or report — and ask questions in natural language. NewtonAI uses retrieval-augmented generation (RAG) to find the most relevant passages and provide accurate, cited answers grounded in your document.
          </p>
        </div>

        {/* Sign in CTA */}
        <ToolAuthGate>
          <div />
        </ToolAuthGate>

        {/* Educational Content — visible to crawlers */}
        <section className="max-w-4xl mx-auto mt-12 mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 font-display">How PDF Chat Works</h2>
          <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-5">
            <p>
              Traditional PDF reading is a passive experience. You scroll through pages, highlight text, and hope the important details stick. But research consistently shows that passive reading leads to shallow understanding. <strong className="text-foreground">Active engagement</strong> — asking questions, seeking connections, and testing comprehension — is what transforms reading into genuine learning.
            </p>
            <p>
              NewtonAI's PDF Chat bridges this gap by turning every document into an interactive conversation. When you upload a PDF, the system processes the entire document using a technique called <strong className="text-foreground">retrieval-augmented generation (RAG)</strong>. The document is split into semantically meaningful chunks, each embedded as a high-dimensional vector. When you ask a question, the AI searches these vectors to find the most relevant passages, then generates a precise answer grounded in the actual text — complete with page-number citations so you can verify every claim.
            </p>
            <p>
              This approach solves two critical problems with general-purpose AI chatbots: <strong className="text-foreground">hallucination</strong> (making up information) and <strong className="text-foreground">context loss</strong> (forgetting what was discussed). Because every answer is anchored to specific passages in your document, you get factually accurate responses that you can trace back to the source. And because the system maintains your conversation history, you can ask follow-up questions that build on previous answers — just like talking to a knowledgeable tutor who has read your entire textbook.
            </p>

            <h3 className="text-xl font-semibold text-foreground">What You Can Do</h3>
            <ul>
              <li><strong className="text-foreground">Ask conceptual questions:</strong> "What is the difference between mitosis and meiosis according to Chapter 4?"</li>
              <li><strong className="text-foreground">Request summaries:</strong> "Summarise the key findings from the methodology section."</li>
              <li><strong className="text-foreground">Find specific information:</strong> "What does the author say about inflation rates in the 2024 data?"</li>
              <li><strong className="text-foreground">Test your understanding:</strong> "Quiz me on the main concepts from pages 15–30."</li>
              <li><strong className="text-foreground">Generate study materials:</strong> "Create flashcards from Chapter 7" or "Write a practice quiz on this section."</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground">Supported Documents</h3>
            <p>
              PDF Chat works with virtually any PDF document: textbooks, research papers, journal articles, lecture slides, technical manuals, legal documents, financial reports, and more. The AI handles both text-based and scanned PDFs (using OCR for image-based documents), so even older or handwritten materials can be processed. Documents up to hundreds of pages are supported, with the RAG system ensuring that even very large files are searchable and responsive.
            </p>

            <h3 className="text-xl font-semibold text-foreground">Why Students Prefer PDF Chat Over General AI</h3>
            <p>
              General AI chatbots like ChatGPT work from their training data — they can discuss topics broadly but cannot read your specific textbook or reference your exact lecture slides. PDF Chat is different: it reads <em>your</em> document and answers based on what's actually written there. This means you get answers that are relevant to your course, your edition of the textbook, and your professor's specific material. No more generic responses that don't quite match what you're studying.
            </p>
          </div>
        </section>

        {/* Feature highlights */}
        <section className="max-w-4xl mx-auto mb-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Search, title: "Semantic Search", desc: "Find answers by meaning, not just keywords. Ask questions in natural language." },
              { icon: FileText, title: "Page Citations", desc: "Every answer includes page numbers so you can verify and cross-reference." },
              { icon: Brain, title: "RAG-Powered Accuracy", desc: "Retrieval-augmented generation ensures answers come from your document, not hallucinations." },
              { icon: BookOpen, title: "Study Tool Generation", desc: "Generate flashcards, quizzes, and summaries directly from your PDF content." },
              { icon: Zap, title: "Instant Processing", desc: "Upload and start chatting in seconds, even with 100+ page documents." },
              { icon: MessageSquare, title: "Conversational Follow-ups", desc: "Ask follow-up questions that build on previous answers for deeper understanding." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
                <f.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <ContentDisclaimer />
        <ToolPagePromoSections toolId="pdf-chat" />
      </main>

      <Footer />
    </div>
  );
}
