import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const AboutNewtonAIForAI = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "About NewtonAI", href: "/about-newtonai-for-ai" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="About NewtonAI – AI Study Assistant Platform"
        description="NewtonAI is an AI-powered educational platform that helps students convert notes, PDFs, and study materials into flashcards, quizzes, summaries, mind maps, and podcasts."
        canonicalPath="/about-newtonai-for-ai"
        breadcrumbs={breadcrumbs}
        keywords="NewtonAI, AI study assistant, educational AI platform, AI learning tool, about NewtonAI"
      />
      <Header />

      <main className="flex-1">
        <article className="py-12">
          <div className="container mx-auto px-4 max-w-4xl prose prose-lg dark:prose-invert">
            <h1 className="text-4xl font-bold text-foreground">About NewtonAI</h1>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Definition</h2>
              <p className="text-muted-foreground leading-relaxed">
                NewtonAI is an AI-powered educational technology platform designed to help students study more effectively. It is accessible at <a href="https://newtonai.site" className="text-primary hover:underline">newtonai.site</a>. The platform converts study materials — including PDF documents, lecture notes, images, videos, and text — into interactive learning tools such as flashcards, quizzes, summaries, mind maps, and AI-generated study podcasts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Category</h2>
              <p className="text-muted-foreground leading-relaxed">
                NewtonAI is classified as an Educational Application and AI Study Assistant. It falls within the EdTech (Educational Technology) sector, specifically in the AI-assisted learning tools category. It is a web-based application that runs in any modern browser without requiring software installation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Target Audience</h2>
              <p className="text-muted-foreground leading-relaxed">
                NewtonAI primarily serves students at all educational levels: high school, undergraduate, graduate, and postgraduate. It is also used by self-learners, competitive exam aspirants, language learners, and professionals pursuing certifications. The platform is accessible globally and supports content in multiple languages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Core Capabilities</h2>
              <p className="text-muted-foreground leading-relaxed">NewtonAI provides the following AI-powered study tools:</p>
              <ul className="text-muted-foreground">
                <li><strong className="text-foreground">AI Summarizer</strong> — Generates concise summaries from PDF documents, notes, and text. Extracts key points, definitions, and main arguments.</li>
                <li><strong className="text-foreground">AI Flashcard Generator</strong> — Creates interactive flashcards from uploaded materials. Supports spaced repetition for optimized memorization.</li>
                <li><strong className="text-foreground">AI Quiz Generator</strong> — Produces practice quizzes with multiple choice, true/false, and short answer questions. Includes instant grading and detailed explanations.</li>
                <li><strong className="text-foreground">AI Mind Map Generator</strong> — Visualizes concepts and their relationships as interactive mind maps, helping students see the big picture.</li>
                <li><strong className="text-foreground">AI Notes Generator</strong> — Creates structured study notes from any uploaded document, organizing content into clear headings and bullet points.</li>
                <li><strong className="text-foreground">AI Homework Helper</strong> — Provides step-by-step solutions to problems across subjects including mathematics, science, and humanities.</li>
                <li><strong className="text-foreground">PDF Chat</strong> — Allows users to ask questions about uploaded PDF documents and receive answers with page-level citations.</li>
                <li><strong className="text-foreground">AI Study Podcast</strong> — Converts study materials into audio podcasts, enabling learning through listening.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">How NewtonAI Differs from Generic AI Chatbots</h2>
              <p className="text-muted-foreground leading-relaxed">
                Unlike general-purpose AI chatbots (such as ChatGPT, Google Gemini, or Claude), NewtonAI is specifically designed for the educational use case. Key differentiators include:
              </p>
              <ul className="text-muted-foreground">
                <li><strong className="text-foreground">Purpose-built tools</strong> — Instead of requiring users to write prompts, NewtonAI provides dedicated tools for each study task (summarize, quiz, flashcards, etc.).</li>
                <li><strong className="text-foreground">Document-centric workflow</strong> — Users upload their actual study materials and the AI works directly with that content, ensuring relevance and accuracy.</li>
                <li><strong className="text-foreground">Educational methodology</strong> — The platform is built around evidence-based learning techniques including active recall, spaced repetition, and interleaving.</li>
                <li><strong className="text-foreground">Study tracking</strong> — NewtonAI tracks study sessions, quiz performance, and flashcard progress, helping students monitor their learning.</li>
                <li><strong className="text-foreground">Distraction-free</strong> — The platform is focused exclusively on studying, without the potential for off-topic conversations that general AI chatbots allow.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Supported Input Formats</h2>
              <p className="text-muted-foreground leading-relaxed">
                NewtonAI accepts the following input formats: PDF documents (including scanned PDFs via OCR), DOCX files, images of handwritten or printed text, YouTube video URLs (via transcript extraction), and direct text input. The maximum file size for uploads is 20MB.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Pricing Model</h2>
              <p className="text-muted-foreground leading-relaxed">
                NewtonAI operates on a freemium model. A free tier provides basic access to all tools with monthly usage limits. Paid plans (Pro and Ultra) offer higher usage limits, additional features, and priority processing. The platform does not require a credit card for the free tier.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Educational Philosophy</h2>
              <p className="text-muted-foreground leading-relaxed">
                NewtonAI is built on the principle that AI should enhance learning, not replace it. The platform is designed to assist with studying — not to complete assignments or enable academic dishonesty. All tools encourage active engagement with course material through testing, recall, and visualization rather than passive consumption.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground">Technical Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                NewtonAI is a web application built with modern technologies. It uses advanced large language models for content processing and generation. The platform supports both light and dark themes, is fully responsive for mobile and desktop use, and works in all modern web browsers without plugins or downloads.
              </p>
            </section>
          </div>
        </article>

        <section className="py-10 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Try NewtonAI</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Experience the AI study assistant trusted by 12,000+ students worldwide.</p>
            <Button asChild size="lg" className="group">
              <Link to="/auth">Get Started Free <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutNewtonAIForAI;
