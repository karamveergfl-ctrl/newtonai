import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import CompareHero from "@/components/compare/CompareHero";
import ComparisonTable from "@/components/compare/ComparisonTable";
import PricingComparison from "@/components/compare/PricingComparison";
import UniqueFeatures from "@/components/compare/UniqueFeatures";
import CompetitorTestimonials from "@/components/compare/CompetitorTestimonials";
import { CTASection } from "@/components/CTASection";

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
                While Studyx offers AI homework help at a competitive price, NewtonAI provides unique features that make studying more effective and engaging.
              </p>
              <h3>1. Videos Embedded in Your PDF Reader</h3>
              <p>
                NewtonAI's unique feature lets you search any topic and watch educational videos directly inside your PDF reader. Studyx doesn't have any video integration.
              </p>
              <h3>2. AI Podcast Generation</h3>
              <p>
                Transform any document into an engaging audio podcast for learning on the go. Study during your commute or workout - something Studyx can't offer.
              </p>
              <h3>3. Generous Free Tier</h3>
              <p>
                NewtonAI offers a complete free tier with video ads, giving students full access without payment. Studyx limits free users to just 5 questions per day.
              </p>
              <h3>4. Handwriting OCR</h3>
              <p>
                Take photos of your handwritten notes and convert them to digital text instantly. NewtonAI's Google Lens-style OCR is a feature Studyx doesn't have.
              </p>
            </div>
          </div>
        </section>

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
