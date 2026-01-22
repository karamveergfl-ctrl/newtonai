import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import CompareHero from "@/components/compare/CompareHero";
import ComparisonTable from "@/components/compare/ComparisonTable";
import PricingComparison from "@/components/compare/PricingComparison";
import UniqueFeatures from "@/components/compare/UniqueFeatures";
import { CTASection } from "@/components/CTASection";

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

        <PricingComparison competitor="chatgpt" />

        <UniqueFeatures />

        <section className="py-16 bg-muted/30">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-display font-bold mb-6">
              General AI vs. Purpose-Built Study Platform
            </h2>
            <div className="prose prose-lg dark:prose-invert">
              <p>
                ChatGPT is an incredible general-purpose AI, but it wasn't designed for studying. NewtonAI is built from the ground up for students. Here's why that matters:
              </p>
              <h3>1. Structured Study Tools</h3>
              <p>
                ChatGPT gives you text responses. NewtonAI gives you structured flashcard decks with spaced repetition, graded quizzes with explanations, visual mind maps, and organized summaries – all in purpose-built interfaces.
              </p>
              <h3>2. Document-First Workflow</h3>
              <p>
                Copy-pasting content into ChatGPT is tedious. NewtonAI accepts PDF uploads, YouTube links, voice recordings, and images directly. Upload once, generate all study materials automatically.
              </p>
              <h3>3. Integrated PDF Reader with Videos</h3>
              <p>
                NewtonAI's PDF reader lets you highlight text and instantly find related educational videos. You can't do this in ChatGPT – it has no document reader or video search integration.
              </p>
              <h3>4. Progress Tracking</h3>
              <p>
                NewtonAI tracks your study sessions, quiz scores, flashcard progress, and learning streaks. ChatGPT conversations are ephemeral with no learning analytics or progress metrics.
              </p>
              <h3>5. AI Podcasts</h3>
              <p>
                Transform any content into an engaging audio podcast with multiple voice styles. ChatGPT can generate text scripts but cannot produce actual audio content for passive learning.
              </p>
              <h3>6. Lower Price, More Features</h3>
              <p>
                ChatGPT Plus costs $20/month. NewtonAI Pro costs $8.49/month and includes purpose-built study tools that would take multiple prompts and manual formatting in ChatGPT.
              </p>
              <h3>7. Free Tier</h3>
              <p>
                While ChatGPT's free tier has rate limits during peak hours, NewtonAI's free tier lets you earn unlimited credits through optional video ads. Study anytime without hitting usage walls.
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
