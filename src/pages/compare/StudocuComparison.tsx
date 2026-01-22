import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import CompareHero from "@/components/compare/CompareHero";
import ComparisonTable from "@/components/compare/ComparisonTable";
import PricingComparison from "@/components/compare/PricingComparison";
import UniqueFeatures from "@/components/compare/UniqueFeatures";
import { CTASection } from "@/components/CTASection";

const StudocuComparison = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="NewtonAI vs Studocu 2026 - AI Study Tools Alternative"
        description="Compare NewtonAI and Studocu. Instead of searching for notes, generate your own AI flashcards, summaries, and podcasts from any document."
        canonicalPath="/compare/studocu"
        keywords="Studocu alternative, NewtonAI vs Studocu, AI study notes, document summarizer, study app comparison"
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Compare", href: "/compare" },
          { name: "vs Studocu", href: "/compare/studocu" },
        ]}
      />
      <Header />

      <main>
        <CompareHero competitor="studocu" />

        <section className="py-16 container">
          <h2 className="text-3xl font-display font-bold text-center mb-8">
            Feature-by-Feature Comparison
          </h2>
          <ComparisonTable competitor="studocu" />
        </section>

        <PricingComparison competitor="studocu" />

        <UniqueFeatures />

        <section className="py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-6">
              Create Your Own Study Materials Instead of Searching
            </h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                Studocu is a document-sharing platform where students upload notes. NewtonAI flips the script: you upload YOUR materials, and AI creates personalized study resources. Here's why that's better:
              </p>
              <h3>1. AI-Generated vs. Crowd-Sourced</h3>
              <p>
                Studocu relies on other students' notes, which may be incomplete, incorrect, or not match your syllabus. NewtonAI's AI analyzes YOUR textbooks and lectures to create accurate, personalized study materials every time.
              </p>
              <h3>2. Interactive Study Tools</h3>
              <p>
                Studocu offers static PDFs. NewtonAI transforms content into interactive flashcards with spaced repetition, self-grading quizzes, audio podcasts, and visual mind maps – all created automatically.
              </p>
              <h3>3. Videos Embedded in Reading</h3>
              <p>
                While reading your PDF in NewtonAI, select any concept to instantly find and watch related educational videos. This integrated learning experience doesn't exist in Studocu.
              </p>
              <h3>4. Multiple Input Formats</h3>
              <p>
                Beyond PDFs, NewtonAI accepts YouTube videos, voice recordings, typed notes, and even handwritten pages via OCR. Studocu only handles uploaded documents.
              </p>
              <h3>5. Free Tier with Ads</h3>
              <p>
                Studocu's free access is severely limited with upload requirements. NewtonAI offers a genuinely free tier where you can earn credits by watching optional video ads.
              </p>
            </div>
          </div>
        </section>

        <CTASection
          title="Stop Searching, Start Creating"
          description="Upload any document and let AI create your perfect study materials. No more hunting for notes."
          primaryButtonText="Try AI Study Tools Free"
          primaryButtonLink="/auth"
        />
      </main>

      <Footer />
    </div>
  );
};

export default StudocuComparison;
