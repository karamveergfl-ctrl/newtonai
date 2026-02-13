import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ArrowRight, FileText, CheckCircle, Sparkles, BookOpen, Brain } from "lucide-react";

const PDFStudyTool = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "PDF Study Tool", href: "/pdf-study-tool" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="AI PDF Study Tool – Summarize, Chat & Learn from PDFs"
        description="Upload any PDF and use AI to summarize, create flashcards, generate quizzes, and chat with your documents. NewtonAI's PDF study tool makes textbook learning effortless."
        canonicalPath="/pdf-study-tool"
        breadcrumbs={breadcrumbs}
        keywords="PDF study tool, AI PDF summarizer, chat with PDF, PDF to flashcards, PDF quiz generator, study from PDF, AI PDF reader"
      />
      <Header />

      <main className="flex-1">
        <section className="pt-20 pb-10 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <FileText className="w-4 h-4" /> PDF Learning
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              AI PDF Study Tool: Learn from Any Document
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Transform dense PDF textbooks into interactive learning experiences. Summarize, quiz yourself, create flashcards, and even chat with your PDFs using AI.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6 group">
              <Link to="/auth">Upload Your First PDF <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" /></Link>
            </Button>
          </div>
        </section>

        <article className="py-10">
          <div className="container mx-auto px-4 max-w-4xl prose prose-lg dark:prose-invert">
            <h2 className="text-3xl font-bold text-foreground">Why Students Need a PDF Study Tool</h2>
            <p className="text-muted-foreground leading-relaxed">
              PDFs are the backbone of modern education. From digital textbooks and lecture slides to research papers and course handouts, students interact with PDF documents daily. Yet reading through a 50-page PDF chapter is time-consuming and often leads to passive learning — one of the least effective study strategies according to educational research.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              NewtonAI's PDF study tool changes this dynamic entirely. Instead of passively scrolling through pages, you can actively engage with your PDF content through AI-powered tools that transform static text into dynamic learning experiences.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">What Can You Do with NewtonAI's PDF Tools?</h2>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { icon: FileText, title: "Summarize PDFs", desc: "Get concise summaries of any PDF document. The AI identifies key points, main arguments, and critical information, saving you hours of reading time." },
                { icon: Brain, title: "Generate Flashcards from PDFs", desc: "Automatically create flashcards from your PDF content. Perfect for memorizing definitions, formulas, vocabulary, and key facts." },
                { icon: BookOpen, title: "Create Quizzes from PDFs", desc: "Turn any PDF chapter into a practice quiz. Test your understanding with AI-generated multiple choice and short answer questions." },
                { icon: Sparkles, title: "Chat with Your PDFs", desc: "Ask questions about your PDF content and get instant, accurate answers with page citations. Like having a tutor who has read your entire textbook." },
              ].map((feature) => (
                <div key={feature.title} className="bg-card rounded-xl p-6 border border-border">
                  <feature.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-bold text-foreground mt-12">How the PDF Study Tool Works</h2>
            <p className="text-muted-foreground leading-relaxed">
              Using NewtonAI's PDF study tool is effortless. Upload your PDF document — it can be a textbook chapter, research paper, lecture handout, or any academic document. The AI processes the document, understanding its structure, headings, and content hierarchy.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Once processed, you have multiple options. Generate a summary to quickly understand the main ideas. Create flashcards to build your memorization deck. Generate a quiz to test your comprehension. Or open the PDF Chat feature to have a conversation with your document — ask specific questions and get answers with exact page references.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The PDF Chat feature is particularly powerful for research and studying. Instead of searching through pages manually, you can ask questions like "What are the three main causes discussed in chapter 4?" or "Explain the formula on page 23" and get precise answers instantly.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">Supported PDF Types</h2>
            <p className="text-muted-foreground leading-relaxed">
              NewtonAI works with virtually any PDF document. This includes digitally created PDFs (from Word, LaTeX, or any document editor), scanned PDFs (using built-in OCR technology to extract text from images), and PDFs with complex formatting including tables, charts, and multi-column layouts.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Whether you're studying from a modern digital textbook or a scanned copy of an older publication, NewtonAI can process and help you learn from it. The AI is particularly adept at handling academic PDFs with mathematical notation, scientific diagrams, and technical terminology.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">PDF Study Strategies with AI</h2>
            <p className="text-muted-foreground leading-relaxed">
              To get the most out of NewtonAI's PDF tools, consider this study workflow: First, generate a summary to get an overview of the chapter. Second, read through the full PDF with the summary as a guide. Third, generate flashcards for key terms and concepts. Fourth, create a quiz to test your understanding. Finally, use PDF Chat to clarify any confusing sections.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This multi-modal approach engages different aspects of learning — reading for comprehension, active recall through flashcards, self-testing through quizzes, and elaborative interrogation through chat. Research shows that combining multiple study techniques leads to significantly better retention than any single method alone.
            </p>
          </div>
        </article>

        {/* FAQ */}
        <section className="py-10 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "What's the maximum PDF file size?", a: "NewtonAI supports PDF files up to 20MB. For larger documents, we recommend splitting them into chapters or sections for optimal processing." },
                { q: "Can NewtonAI read scanned PDFs?", a: "Yes! NewtonAI includes OCR (Optical Character Recognition) technology that can extract text from scanned documents and images within PDFs." },
                { q: "How accurate is the PDF Chat feature?", a: "The PDF Chat feature uses advanced AI to provide accurate answers based on your document content. It includes page citations so you can verify the information directly." },
                { q: "Can I use the PDF tool for research papers?", a: "Absolutely. The PDF study tool is excellent for processing research papers. It can summarize findings, extract methodology details, and help you quickly assess a paper's relevance." },
                { q: "Does it work with textbooks that have images and diagrams?", a: "Yes, NewtonAI processes the text content of PDFs including captions and descriptions. For diagram-heavy content, the AI can explain concepts referenced in the text." }
              ].map((faq) => (
                <details key={faq.q} className="bg-card rounded-lg border border-border p-4 group">
                  <summary className="font-semibold text-foreground cursor-pointer list-none flex items-center justify-between">
                    {faq.q}
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Start Learning from Your PDFs Today</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Upload any PDF and transform it into flashcards, quizzes, and summaries in seconds.</p>
            <Button asChild size="lg" className="group">
              <Link to="/auth">Try Free <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PDFStudyTool;
