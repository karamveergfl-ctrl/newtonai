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

const ChatGPTComparison = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="NewtonAI vs ChatGPT for Studying 2026 - Purpose-Built Alternative"
        description="Compare NewtonAI and ChatGPT for students. While ChatGPT is a general AI, NewtonAI is built for learning with flashcards, quizzes, podcasts, and more."
        canonicalPath="/compare/chatgpt"
        keywords="ChatGPT for studying, NewtonAI vs ChatGPT, AI study app, ChatGPT alternative students, study with AI"
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Compare", href: "/compare" },
          { name: "vs ChatGPT", href: "/compare/chatgpt" },
        ]}
      />
      <Header />

      <main>
        <CompareHero competitor="chatgpt" />

        <section className="py-16 container">
          <h2 className="text-3xl font-display font-bold text-center mb-8">
            Feature-by-Feature Comparison
          </h2>
          <ComparisonTable competitor="chatgpt" />
        </section>

        {/* Ad after comparison table */}
        <div className="container">
          <AdsterraBanner />
          <AdsterraNativeBanner instanceId="chatgpt-table" />
        </div>

        <FeatureParitySection competitor="chatgpt" />

        <PricingComparison competitor="chatgpt" />

        {/* Ad after pricing */}
        <div className="container">
          <AdsterraBanner />
          <AdsterraNativeBanner instanceId="chatgpt-pricing" />
        </div>

        <CompetitorTestimonials competitor="chatgpt" />

        <UniqueFeatures />

        <section className="py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-6">
              General AI vs. Purpose-Built Study Platform
            </h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                ChatGPT now has Study Mode with Socratic tutoring and flashcard quizzes, but it's still a general-purpose AI. NewtonAI is built from the ground up for students. Here's why that matters:
              </p>
              <h3>1. Videos Embedded in Your PDF Reader</h3>
              <p>
                NewtonAI's unique feature lets you search any topic and watch educational videos directly inside your PDF reader. ChatGPT has no document reader or video integration.
              </p>
              <h3>2. AI Podcast Generation</h3>
              <p>
                Transform any content into an engaging audio podcast with multiple voice styles. ChatGPT can generate text scripts but cannot produce actual audio content.
              </p>
              <h3>3. Automatic Mind Maps</h3>
              <p>
                NewtonAI creates visual mind maps automatically from your content. In ChatGPT, you'd need to manually prompt and format this yourself.
              </p>
              <h3>4. Handwriting OCR</h3>
              <p>
                Take photos of your handwritten notes and convert them to digital text. ChatGPT doesn't have this feature.
              </p>
              <h3>5. Document-First Workflow</h3>
              <p>
                Copy-pasting content into ChatGPT is tedious. NewtonAI accepts PDF uploads, YouTube links, voice recordings, and images directly. Upload once, generate all study materials automatically.
              </p>
              <h3>6. Progress Tracking</h3>
              <p>
                NewtonAI tracks your study sessions, quiz scores, flashcard progress, and learning streaks. ChatGPT's Study Mode doesn't have learning analytics or progress metrics.
              </p>
              <h3>7. Less Than Half the Price</h3>
              <p>
                ChatGPT Plus costs $20/month. NewtonAI Pro costs $8.49/month and includes unique features like video-in-PDF, podcasts, and handwriting OCR that ChatGPT doesn't have.
              </p>
            </div>
          </div>
        </section>

        <CTASection
          title="Study Smarter, Not Harder"
          description="ChatGPT is great for many things. For studying, NewtonAI is built specifically for you."
          primaryButtonText="Try Purpose-Built AI Study Tools"
          primaryButtonLink="/auth"
        />
      </main>

      <Footer />
    </div>
  );
};

export default ChatGPTComparison;
