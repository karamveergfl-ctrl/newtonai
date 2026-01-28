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
import { AdsterraNativeBanner } from "@/components/AdsterraNativeBanner";

const CheggComparison = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="NewtonAI vs Chegg 2026 - Better & Cheaper Alternative"
        description="Compare NewtonAI and Chegg. Get AI flashcards, embedded videos, podcasts, and homework help at nearly half the price. Free tier available."
        canonicalPath="/compare/chegg"
        keywords="Chegg alternative, NewtonAI vs Chegg, cheaper than Chegg, AI homework help, study app comparison"
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Compare", href: "/compare" },
          { name: "vs Chegg", href: "/compare/chegg" },
        ]}
      />
      <Header />

      <main>
        <CompareHero competitor="chegg" />

        <section className="py-16 container">
          <h2 className="text-3xl font-display font-bold text-center mb-8">
            Feature-by-Feature Comparison
          </h2>
          <ComparisonTable competitor="chegg" />
        </section>

        {/* Ad after comparison table */}
        <div className="container">
          <AdsterraNativeBanner instanceId="chegg-table" />
        </div>

        <FeatureParitySection competitor="chegg" />

        <PricingComparison competitor="chegg" />

        {/* Ad after pricing */}
        <div className="container">
          <AdsterraNativeBanner instanceId="chegg-pricing" />
        </div>

        <CompetitorTestimonials competitor="chegg" />

        <UniqueFeatures />

        <section className="py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-6">
              Why Students Switch from Chegg to NewtonAI
            </h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                Chegg recently launched AI Create for flashcards and practice tests, but students are discovering that NewtonAI offers a more comprehensive learning experience at nearly half the price. Here's why:
              </p>
              <h3>1. Videos Embedded in Your PDF Reader</h3>
              <p>
                NewtonAI's revolutionary feature lets you search any topic and watch educational videos directly in your PDF reader. Select text, search, and learn without switching tabs. Chegg doesn't offer anything like this.
              </p>
              <h3>2. AI Podcasts for Learning on the Go</h3>
              <p>
                Transform any document into an engaging audio podcast. Study during your commute or workout – a feature Chegg doesn't have despite their AI updates.
              </p>
              <h3>3. Handwriting OCR</h3>
              <p>
                Take photos of your handwritten notes and convert them to digital text instantly. Chegg has no handwriting recognition feature.
              </p>
              <h3>4. Free Tier with Optional Ads</h3>
              <p>
                Unlike Chegg's paywall, NewtonAI offers a generous free tier. Watch a short video ad to earn credits and access premium features without paying. No credit card required.
              </p>
              <h3>5. Nearly Half the Price</h3>
              <p>
                NewtonAI Pro starts at $8.49/month compared to Chegg's $15.95/month. You get unique features for less, with multi-currency support in 8 different currencies.
              </p>
            </div>
          </div>
        </section>

        <CTASection
          title="Ready to Switch from Chegg?"
          description="Join thousands of students who've upgraded to NewtonAI. Get started free today."
          primaryButtonText="Start Free Trial"
          primaryButtonLink="/auth"
        />
      </main>

      <Footer />
    </div>
  );
};

export default CheggComparison;
