import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import CompareHero from "@/components/compare/CompareHero";
import ComparisonTable from "@/components/compare/ComparisonTable";
import PricingComparison from "@/components/compare/PricingComparison";
import UniqueFeatures from "@/components/compare/UniqueFeatures";
import CompetitorTestimonials from "@/components/compare/CompetitorTestimonials";
import FeatureParitySection from "@/components/compare/FeatureParitySection";
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


        <FeatureParitySection competitor="studocu" />

        <PricingComparison competitor="studocu" />


        <CompetitorTestimonials competitor="studocu" />

        <UniqueFeatures />

        <section className="py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-6">
              Create Your Own Study Materials Instead of Searching
            </h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                Studocu now has AI flashcards and quizzes, but it's still primarily a document-sharing platform. NewtonAI flips the script: you upload YOUR materials, and AI creates personalized study resources. Here's why that's better:
              </p>
              <h3>1. Videos Embedded in Your PDF Reader</h3>
              <p>
                NewtonAI's unique feature lets you search any topic and watch educational videos directly inside your PDF reader. Studocu doesn't have any video integration.
              </p>
              <h3>2. AI Podcast Generation</h3>
              <p>
                Transform any document into an engaging audio podcast for learning on the go. Study during your commute or workout – something Studocu can't offer.
              </p>
              <h3>3. Mind Map Generator</h3>
              <p>
                NewtonAI automatically creates visual mind maps from your content. Studocu doesn't have this feature.
              </p>
              <h3>4. Handwriting OCR</h3>
              <p>
                Take photos of your handwritten notes and convert them to digital text instantly. NewtonAI's Google Lens-style OCR is a feature Studocu doesn't have.
              </p>
              <h3>5. Personalized vs. Crowd-Sourced</h3>
              <p>
                Studocu relies on other students' notes, which may be incomplete or not match your syllabus. NewtonAI's AI analyzes YOUR textbooks and lectures to create accurate, personalized study materials.
              </p>
              <h3>6. Free Tier with Ads</h3>
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
