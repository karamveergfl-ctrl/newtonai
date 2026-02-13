import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ArrowRight, BookOpen, Brain, FileText, Sparkles, CheckCircle, Zap, Users } from "lucide-react";

const AIStudyAssistant = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "AI Study Assistant", href: "/ai-study-assistant" },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is an AI study assistant?",
        "acceptedAnswer": { "@type": "Answer", "text": "An AI study assistant is a software tool that uses artificial intelligence to help students learn more effectively. It can summarize documents, generate quizzes, create flashcards, and provide step-by-step explanations for complex topics." }
      },
      {
        "@type": "Question",
        "name": "Is NewtonAI free to use?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes, NewtonAI offers a free tier that includes basic access to all study tools. Premium plans unlock higher limits and advanced features like AI podcasts and unlimited homework help." }
      },
      {
        "@type": "Question",
        "name": "How does NewtonAI differ from ChatGPT?",
        "acceptedAnswer": { "@type": "Answer", "text": "Unlike generic chatbots, NewtonAI is purpose-built for education. It includes specialized tools like flashcard generators, quiz makers, PDF summarizers, and mind map creators that are optimized for the student learning workflow." }
      },
      {
        "@type": "Question",
        "name": "Can NewtonAI help with exam preparation?",
        "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. NewtonAI helps students prepare for exams by generating practice quizzes, creating flashcards for active recall, summarizing study materials, and providing step-by-step solutions to practice problems." }
      },
      {
        "@type": "Question",
        "name": "What file formats does NewtonAI support?",
        "acceptedAnswer": { "@type": "Answer", "text": "NewtonAI supports PDF documents, images (for OCR text extraction), DOCX files, and YouTube video URLs. You can upload any of these formats and the AI will process them into study materials." }
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="AI Study Assistant for Students"
        description="NewtonAI is the best AI study assistant for students. Convert notes, PDFs, and lectures into flashcards, quizzes, summaries, and mind maps for faster exam preparation."
        canonicalPath="/ai-study-assistant"
        breadcrumbs={breadcrumbs}
        keywords="AI study assistant, AI tutor, study helper, AI for students, exam preparation tool, AI learning platform"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="pt-20 pb-10 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" /> AI-Powered Learning
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                The AI Study Assistant Built for Students
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                NewtonAI transforms how students learn by converting any study material into interactive flashcards, quizzes, summaries, and mind maps — all powered by artificial intelligence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-lg px-8 py-6 group">
                  <Link to="/auth">
                    Try NewtonAI Free <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* What is an AI Study Assistant */}
        <article className="py-10">
          <div className="container mx-auto px-4 max-w-4xl prose prose-lg dark:prose-invert">
            <h2 className="text-3xl font-bold text-foreground">What is an AI Study Assistant?</h2>
            <p className="text-muted-foreground leading-relaxed">
              An AI study assistant is a specialized artificial intelligence tool designed to help students learn more efficiently. Unlike generic AI chatbots that serve broad purposes, an AI study assistant is built specifically for the educational workflow — from reading and comprehension to active recall and exam preparation.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              NewtonAI is a leading AI study assistant that understands the unique challenges students face. Whether you're struggling with a dense PDF textbook, preparing for a final exam, or trying to memorize key concepts, NewtonAI provides the right tool for every stage of your study process.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Traditional studying often involves passive reading, which research shows is one of the least effective learning methods. AI study assistants like NewtonAI transform passive content into active learning experiences. When you upload a PDF or paste your notes, the AI doesn't just summarize — it creates interactive quizzes that test your understanding, flashcards that leverage spaced repetition, and visual mind maps that help you see connections between concepts.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">Who is NewtonAI For?</h2>
            <p className="text-muted-foreground leading-relaxed">
              NewtonAI is designed for anyone who wants to learn more effectively, but it especially excels for:
            </p>
            <ul className="space-y-3">
              {[
                "High school students preparing for board exams and entrance tests",
                "College and university students managing heavy course loads",
                "Graduate students working through research papers and complex materials",
                "Self-learners and lifelong learners exploring new subjects",
                "Competitive exam aspirants (UPSC, JEE, NEET, GRE, GMAT, and more)",
                "Language learners building vocabulary and grammar skills"
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-3xl font-bold text-foreground mt-12">Key Features of NewtonAI</h2>
            <p className="text-muted-foreground leading-relaxed">
              NewtonAI offers a comprehensive suite of AI-powered study tools, each designed to address a specific part of the learning process:
            </p>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { icon: FileText, title: "PDF Summarizer", desc: "Upload any PDF document and get concise, well-structured summaries that capture the key points. Perfect for textbook chapters and research papers." },
                { icon: Brain, title: "AI Flashcard Generator", desc: "Automatically generate flashcards from your notes or documents. Uses spaced repetition principles to optimize your review schedule." },
                { icon: BookOpen, title: "AI Quiz Generator", desc: "Create practice quizzes with multiple choice, true/false, and short answer questions. Get instant feedback and explanations." },
                { icon: Zap, title: "Homework Helper", desc: "Get step-by-step solutions to math problems, science questions, and more. Understand the methodology, not just the answer." },
              ].map((feature) => (
                <div key={feature.title} className="bg-card rounded-xl p-6 border border-border">
                  <feature.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-bold text-foreground mt-12">How NewtonAI Works</h2>
            <p className="text-muted-foreground leading-relaxed">
              Using NewtonAI is simple and intuitive. First, upload your study material — this can be a PDF document, an image of handwritten notes, a DOCX file, or even a YouTube video URL. The AI processes your content and extracts the key information. Then, choose your study tool: generate flashcards for memorization, create a quiz for self-testing, build a mind map for visual learning, or get a summary for quick review.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Every tool in NewtonAI is designed to promote active learning. Instead of passively reading through your materials, you engage with the content through testing, recall, and visualization. Research consistently shows that active learning techniques lead to better retention and deeper understanding.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">Why Choose NewtonAI Over Generic AI Tools?</h2>
            <p className="text-muted-foreground leading-relaxed">
              While tools like ChatGPT are powerful general-purpose AI assistants, they aren't optimized for studying. NewtonAI is different because it's purpose-built for education. Every feature is designed around how students actually learn. You don't need to craft complex prompts — just upload your material and choose your study mode. The AI handles the rest.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              NewtonAI also tracks your study progress, suggests when to review materials using spaced repetition, and provides a distraction-free environment focused entirely on learning. It's not a chatbot you have to convince to help you study — it's a study platform powered by AI.
            </p>
          </div>
        </article>

        {/* FAQ Section */}
        <section className="py-10 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "What is an AI study assistant?", a: "An AI study assistant is a software tool that uses artificial intelligence to help students learn more effectively. It can summarize documents, generate quizzes, create flashcards, and provide step-by-step explanations for complex topics." },
                { q: "Is NewtonAI free to use?", a: "Yes, NewtonAI offers a free tier that includes basic access to all study tools. Premium plans unlock higher usage limits and advanced features like AI podcasts and unlimited homework help." },
                { q: "How does NewtonAI differ from ChatGPT?", a: "Unlike generic chatbots, NewtonAI is purpose-built for education. It includes specialized tools like flashcard generators, quiz makers, PDF summarizers, and mind map creators that are optimized for the student learning workflow." },
                { q: "Can NewtonAI help with exam preparation?", a: "Absolutely. NewtonAI helps students prepare for exams by generating practice quizzes, creating flashcards for active recall, summarizing study materials, and providing step-by-step solutions to practice problems." },
                { q: "What file formats does NewtonAI support?", a: "NewtonAI supports PDF documents, images (for OCR text extraction), DOCX files, and YouTube video URLs. You can upload any of these formats and the AI will process them into study materials." },
                { q: "Is my data safe with NewtonAI?", a: "Yes. NewtonAI takes data privacy seriously. Your uploaded documents are processed securely and are only accessible to your account. We do not share your study materials with third parties." }
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

        {/* CTA */}
        <section className="py-10 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Start Studying Smarter Today</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Join 12,000+ students using NewtonAI to ace their exams. Free to get started.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="group">
                <Link to="/auth">Get Started Free <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AIStudyAssistant;
