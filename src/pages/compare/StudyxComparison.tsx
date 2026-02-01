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
import { SmartBanner } from "@/components/SmartBanner";

const StudyxComparison = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="NewtonAI vs Studyx 2026 - Better AI Study Platform"
        description="Compare NewtonAI and Studyx. Get embedded videos in PDFs, AI podcasts, and 7 study tools. Better features at the same price point."
        canonicalPath="/compare/studyx"
        keywords="Studyx alternative, NewtonAI vs Studyx, AI homework help comparison, study app comparison"
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Compare", href: "/compare" },
          { name: "vs Studyx", href: "/compare/studyx" },
        ]}
      />
      <Header />

      <main>
        <CompareHero competitor="studyx" />

        <section className="py-16 container">
          <h2 className="text-3xl font-display font-bold text-center mb-8">
            Feature-by-Feature Comparison
          </h2>
          <ComparisonTable competitor="studyx" />
        </section>

        {/* Banner Ad Placement A - After Comparison Table */}
        <SmartBanner placement="A" className="container" />

        <FeatureParitySection competitor="studyx" />

        <PricingComparison competitor="studyx" />


        <CompetitorTestimonials competitor="studyx" />
        <UniqueFeatures />

        <section className="py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-6">
              Why Students Choose NewtonAI Over Studyx
            </h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                Studyx offers solid AI homework help with a video summarizer and PDF tools at a competitive price. Here's where NewtonAI provides additional value:
              </p>
              <h3>1. Videos Embedded IN Your PDF Reader</h3>
              <p>
                While Studyx has a separate video summarizer, NewtonAI embeds videos directly inside your PDF reader. Search any topic and watch educational videos without switching tabs or apps.
              </p>
              <h3>2. AI Podcast Generation</h3>
              <p>
                Transform any document into an engaging audio podcast for learning on the go. Study during your commute or workout – something Studyx can't offer.
              </p>
              <h3>3. Mind Map Generator</h3>
              <p>
                NewtonAI automatically creates visual mind maps from your content to help you understand relationships between concepts. Studyx doesn't have this feature.
              </p>
              <h3>4. Handwriting OCR</h3>
              <p>
                Take photos of your handwritten notes and convert them to digital text instantly. NewtonAI's Google Lens-style OCR is a feature Studyx doesn't have.
              </p>
              <h3>5. Free Tier Available</h3>
              <p>
                NewtonAI offers a complete free tier with usage limits, giving students access to all tools. Studyx has more limited free access.
              </p>
            </div>
          </div>
        </section>

        {/* Banner Ad Placement C - Before CTA */}
        <SmartBanner placement="C" className="container" />

        <CTASection
          title="Ready to Upgrade from Studyx?"
          description="Join thousands of students who study smarter with NewtonAI. Get started free today."
          primaryButtonText="Start Free Trial"
          primaryButtonLink="/auth"
        />
      </main>

      <Footer />
    </div>
  );
};

export default StudyxComparison;
