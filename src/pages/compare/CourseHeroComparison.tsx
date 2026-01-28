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
import { AdsterraBanner } from "@/components/AdsterraBanner";
import { AdsterraNativeBanner } from "@/components/AdsterraNativeBanner";

const CourseHeroComparison = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="NewtonAI vs Course Hero 2026 - Affordable Alternative"
        description="Compare NewtonAI and Course Hero. Get AI homework help, flashcards, and 5 more study tools at 43% lower cost. Free tier available."
        canonicalPath="/compare/course-hero"
        keywords="Course Hero alternative, NewtonAI vs Course Hero, cheaper study platform, AI homework help, tutor alternative"
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Compare", href: "/compare" },
          { name: "vs Course Hero", href: "/compare/course-hero" },
        ]}
      />
      <Header />

      <main>
        <CompareHero competitor="course-hero" />

        <section className="py-16 container">
          <h2 className="text-3xl font-display font-bold text-center mb-8">
            Feature-by-Feature Comparison
          </h2>
          <ComparisonTable competitor="course-hero" />
        </section>

        {/* Ad after comparison table */}
        <div className="container">
          <AdsterraBanner />
          <AdsterraNativeBanner instanceId="coursehero-table" />
        </div>

        <FeatureParitySection competitor="course-hero" />

        <PricingComparison competitor="course-hero" />

        {/* Ad after pricing */}
        <div className="container">
          <AdsterraBanner />
          <AdsterraNativeBanner instanceId="coursehero-pricing" />
        </div>

        <CompetitorTestimonials competitor="course-hero" />

        <UniqueFeatures />

        <section className="py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-6">
              Premium Features Without the Premium Price
            </h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                Course Hero charges $14.95/month for access to documents and limited tutor questions. NewtonAI delivers more value for $8.49/month. Here's the breakdown:
              </p>
              <h3>1. AI-Powered Content Creation</h3>
              <p>
                Course Hero gives you access to uploaded documents. NewtonAI's AI takes YOUR documents and creates flashcards, quizzes, summaries, mind maps, podcasts, and detailed homework solutions – all automatically.
              </p>
              <h3>2. Unlimited AI Homework Help</h3>
              <p>
                Course Hero limits tutor questions per month. NewtonAI's AI homework helper provides step-by-step solutions with detailed explanations, available anytime without per-question limits on Pro plans.
              </p>
              <h3>3. Video Integration</h3>
              <p>
                NewtonAI embeds educational videos directly in your PDF reader. Search any topic while studying and watch relevant videos without leaving the page. Course Hero has no comparable feature.
              </p>
              <h3>4. Audio Learning with AI Podcasts</h3>
              <p>
                Transform any textbook chapter, lecture notes, or YouTube video into an engaging audio podcast. Learn while commuting, exercising, or relaxing. Course Hero offers no audio learning options.
              </p>
              <h3>5. Actually Free Tier</h3>
              <p>
                Course Hero's "free" tier requires you to upload documents to unlock access. NewtonAI offers a genuine free tier with optional video ads to earn credits – no strings attached.
              </p>
              <h3>6. 43% Cost Savings</h3>
              <p>
                At $8.49/month vs $14.95/month, NewtonAI Pro saves you over $77 per year while providing more AI-powered study tools.
              </p>
            </div>
          </div>
        </section>

        <CTASection
          title="Get More for Less"
          description="Switch from Course Hero and save 43% while gaining access to 7 AI study tools."
          primaryButtonText="Start Free Today"
          primaryButtonLink="/auth"
        />
      </main>

      <Footer />
    </div>
  );
};

export default CourseHeroComparison;
