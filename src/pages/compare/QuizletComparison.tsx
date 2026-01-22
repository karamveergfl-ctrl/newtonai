import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import CompareHero from "@/components/compare/CompareHero";
import ComparisonTable from "@/components/compare/ComparisonTable";
import PricingComparison from "@/components/compare/PricingComparison";
import UniqueFeatures from "@/components/compare/UniqueFeatures";
import { CTASection } from "@/components/CTASection";

const QuizletComparison = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="NewtonAI vs Quizlet 2026 - AI-Powered Flashcard Alternative"
        description="Compare NewtonAI and Quizlet. Generate flashcards from any PDF, video, or notes with AI. Plus get quizzes, podcasts, and homework help."
        canonicalPath="/compare/quizlet"
        keywords="Quizlet alternative, NewtonAI vs Quizlet, AI flashcards, auto-generate flashcards, study app comparison"
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Compare", href: "/compare" },
          { name: "vs Quizlet", href: "/compare/quizlet" },
        ]}
      />
      <Header />

      <main>
        <CompareHero competitor="quizlet" />

        <section className="py-16 container">
          <h2 className="text-3xl font-display font-bold text-center mb-8">
            Feature-by-Feature Comparison
          </h2>
          <ComparisonTable competitor="quizlet" />
        </section>

        <PricingComparison competitor="quizlet" />

        <UniqueFeatures />

        <section className="py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-6">
              Why NewtonAI is the Next Evolution of Flashcards
            </h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                Quizlet pioneered digital flashcards, but NewtonAI takes study tools to the next level with AI-powered generation and multimedia integration. Here's the comparison:
              </p>
              <h3>1. AI Generates Flashcards FOR You</h3>
              <p>
                With Quizlet, you manually create flashcards or search for community sets that may not match your curriculum. NewtonAI's AI reads your PDF, YouTube transcript, or lecture notes and instantly generates perfect flashcards tailored to your content.
              </p>
              <h3>2. Beyond Flashcards: 7 Study Tools</h3>
              <p>
                Quizlet is primarily a flashcard platform. NewtonAI combines flashcards with AI quizzes, podcasts, mind maps, summaries, lecture notes, and homework help – all from the same source material.
              </p>
              <h3>3. Videos Integrated into Learning</h3>
              <p>
                NewtonAI embeds educational videos directly in your PDF reader. Highlight any concept and find relevant videos instantly. Quizlet has no video integration whatsoever.
              </p>
              <h3>4. Multi-Source Input</h3>
              <p>
                Upload PDFs, paste YouTube links, record voice lectures, or photograph handwritten notes. NewtonAI handles all input formats while Quizlet only supports manual text entry or importing from limited sources.
              </p>
              <h3>5. AI Podcast Learning</h3>
              <p>
                Transform any content into an engaging audio podcast for learning during commutes or workouts. This unique feature doesn't exist in Quizlet or any other study platform.
              </p>
            </div>
          </div>
        </section>

        <CTASection
          title="Upgrade from Quizlet Today"
          description="Experience AI-powered flashcards and 6 more study tools. Free to start, no credit card needed."
          primaryButtonText="Generate Free Flashcards"
          primaryButtonLink="/auth"
        />
      </main>

      <Footer />
    </div>
  );
};

export default QuizletComparison;
