import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import CompareHero from "@/components/compare/CompareHero";
import ComparisonTable from "@/components/compare/ComparisonTable";
import PricingComparison from "@/components/compare/PricingComparison";
import UniqueFeatures from "@/components/compare/UniqueFeatures";
import CompetitorTestimonials from "@/components/compare/CompetitorTestimonials";
import { CTASection } from "@/components/CTASection";

const StudyFetchComparison = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="NewtonAI vs StudyFetch 2026 - Save 55% with Better Features"
        description="Compare NewtonAI and StudyFetch. Get 7 AI study tools, embedded videos, and podcasts at less than half the price. Free tier available."
        canonicalPath="/compare/studyfetch"
        keywords="StudyFetch alternative, NewtonAI vs StudyFetch, cheaper than StudyFetch, AI study app comparison"
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Compare", href: "/compare" },
          { name: "vs StudyFetch", href: "/compare/studyfetch" },
        ]}
      />
      <Header />

      <main>
        <CompareHero competitor="studyfetch" />

        <section className="py-16 container">
          <h2 className="text-3xl font-display font-bold text-center mb-8">
            Feature-by-Feature Comparison
          </h2>
          <ComparisonTable competitor="studyfetch" />
        </section>

        <PricingComparison competitor="studyfetch" />
        <CompetitorTestimonials competitor="studyfetch" />
        <UniqueFeatures />

        <section className="py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-6">
              Why Students Switch from StudyFetch to NewtonAI
            </h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                StudyFetch offers AI tutoring at $19/month, but NewtonAI delivers more features at less than half the cost. Here's why students are making the switch:
              </p>
              <h3>1. Save 55% on Your Subscription</h3>
              <p>
                NewtonAI Pro costs $8.49/month compared to StudyFetch's $19/month. That's over $120 saved per year while getting more features.
              </p>
              <h3>2. Videos Inside Your PDF Reader</h3>
              <p>
                NewtonAI's revolutionary feature lets you search topics and watch videos directly in your PDF reader. StudyFetch has no video integration.
              </p>
              <h3>3. AI Podcast Generation</h3>
              <p>
                Turn any document into an engaging audio podcast. Perfect for studying during commutes or workouts - a feature StudyFetch doesn't offer.
              </p>
              <h3>4. True Free Tier</h3>
              <p>
                NewtonAI offers a generous free tier with all features accessible through video ads. No credit card required to get started.
              </p>
            </div>
          </div>
        </section>

        <CTASection
          title="Ready to Save 55% vs StudyFetch?"
          description="Join thousands of students who upgraded to NewtonAI. Start free today."
          primaryButtonText="Start Free Trial"
          primaryButtonLink="/auth"
        />
      </main>

      <Footer />
    </div>
  );
};

export default StudyFetchComparison;
