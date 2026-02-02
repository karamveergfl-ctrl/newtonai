import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Shield, Sparkles, CheckCircle, ArrowRight, AlertTriangle, BookOpen } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { AdBanner } from "@/components/AdBanner";

const ResponsibleAIUse = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Guides", href: "/guides" },
    { name: "Responsible AI Use", href: "/guides/responsible-ai-use" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Using AI Responsibly for Education: Best Practices Guide"
        description="Learn the best practices for using AI study tools ethically and effectively. Understand when to use AI, how to verify information, and how to ensure genuine learning."
        canonicalPath="/guides/responsible-ai-use"
        breadcrumbs={breadcrumbs}
        keywords="responsible AI use, AI ethics education, academic integrity, AI study tools, learning with AI"
      />
      
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Link */}
        <Link 
          to="/guides" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Guides
        </Link>

        {/* Article Header */}
        <article>
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">Best Practices</Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                8 min read
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              Using AI Responsibly for Education
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Learn the best practices for using AI study tools ethically and effectively. 
              Understand when to use AI assistance, how to verify information, and how to 
              ensure you're truly learning—not just getting answers.
            </p>
          </header>

          {/* Table of Contents */}
          <nav className="bg-muted/30 rounded-xl p-6 mb-12">
            <h2 className="font-semibold text-foreground mb-4">In This Guide</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#ai-as-tool" className="text-primary hover:underline">AI as a Learning Tool, Not a Shortcut</a></li>
              <li><a href="#when-to-use" className="text-primary hover:underline">When to Use AI Study Tools</a></li>
              <li><a href="#academic-integrity" className="text-primary hover:underline">Academic Integrity Considerations</a></li>
              <li><a href="#verifying" className="text-primary hover:underline">Verifying AI-Generated Content</a></li>
              <li><a href="#active-learning" className="text-primary hover:underline">Ensuring Active Learning</a></li>
              <li><a href="#best-practices" className="text-primary hover:underline">Summary of Best Practices</a></li>
            </ul>
          </nav>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            <section id="ai-as-tool" className="mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                AI as a Learning Tool, Not a Shortcut
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                AI study tools are powerful assistants that can dramatically enhance your learning when 
                used correctly. However, they can also become crutches that prevent genuine understanding 
                if misused. The key distinction is whether you're using AI to learn more effectively or 
                to avoid learning altogether.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Think of AI tools like having access to a brilliant tutor. A good tutor doesn't do your 
                work for you—they explain concepts, provide practice problems, offer feedback, and guide 
                you toward understanding. Used properly, AI tools do the same: they create study materials, 
                explain solutions step-by-step, and help you identify knowledge gaps.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The difference between productive AI use and problematic use often comes down to engagement. 
                Are you actively thinking, questioning, and testing your understanding? Or are you passively 
                consuming AI-generated content without effort? Your learning outcomes will directly reflect 
                how actively you engage with the material.
              </p>
            </section>

            <section id="when-to-use" className="mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
                When to Use AI Study Tools
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                AI tools are most beneficial in specific learning contexts. Understanding when they add 
                value—and when they might hinder learning—helps you make informed choices about their use.
              </p>
              
              <div className="bg-muted/30 rounded-xl p-6 my-8">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Excellent Uses for AI Study Tools
                </h4>
                <ul className="space-y-3 text-muted-foreground">
                  <li>• <strong className="text-foreground">Creating study materials:</strong> Generating flashcards, quizzes, and summaries from your course content saves time for actual learning.</li>
                  <li>• <strong className="text-foreground">Understanding solution methods:</strong> Step-by-step explanations teach you HOW to solve problems, not just answers.</li>
                  <li>• <strong className="text-foreground">Self-testing:</strong> AI quizzes help identify knowledge gaps before exams.</li>
                  <li>• <strong className="text-foreground">Alternative explanations:</strong> When textbook explanations don't click, AI can rephrase concepts differently.</li>
                  <li>• <strong className="text-foreground">Pre-reading overviews:</strong> Summaries help you understand structure before diving into complex material.</li>
                </ul>
              </div>

              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 my-8">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Problematic Uses to Avoid
                </h4>
                <ul className="space-y-3 text-muted-foreground">
                  <li>• <strong className="text-foreground">Copying homework answers:</strong> Using AI to complete assignments defeats the purpose of practice and violates academic integrity.</li>
                  <li>• <strong className="text-foreground">Replacing reading entirely:</strong> Summaries are supplements, not replacements for engaging with primary sources.</li>
                  <li>• <strong className="text-foreground">During exams or assessments:</strong> Unless explicitly allowed, using AI during tests is cheating.</li>
                  <li>• <strong className="text-foreground">Without verification:</strong> Blindly trusting AI output without checking accuracy is risky.</li>
                </ul>
              </div>
            </section>

            <section id="academic-integrity" className="mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
                Academic Integrity Considerations
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Academic institutions are actively developing policies around AI use. What's acceptable 
                varies widely between schools, courses, and assignments. Here's how to navigate this 
                evolving landscape:
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong className="text-foreground">Know your institution's policy:</strong> Many schools now have specific guidelines 
                about AI tool usage. Some prohibit all AI assistance, others allow it for study but 
                not assignments, and some embrace it as a learning aid. Find and understand your 
                school's current stance.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong className="text-foreground">Check individual assignment requirements:</strong> Even if your school allows AI use 
                generally, specific assignments may have different rules. Professors may prohibit AI 
                for certain work while encouraging it for others. When in doubt, ask.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong className="text-foreground">The "would I learn this" test:</strong> A useful personal standard: If using AI 
                would prevent you from developing the skill or understanding the assignment is meant 
                to teach, it's probably inappropriate use—even if not technically prohibited.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong className="text-foreground">Disclose when appropriate:</strong> If you've used AI tools significantly in 
                preparing work, disclosing this is often the ethical choice. Some instructors appreciate 
                transparency and may have guidance for future use.
              </p>
            </section>

            <section id="verifying" className="mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                Verifying AI-Generated Content
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                AI systems, including advanced ones, can make mistakes. They can generate plausible-sounding 
                but incorrect information, misinterpret content, or miss nuances. Verification is essential:
              </p>
              
              <ol className="list-decimal list-inside space-y-4 text-muted-foreground mb-6">
                <li className="leading-relaxed">
                  <strong className="text-foreground">Cross-reference with source materials:</strong> Check AI-generated 
                  flashcards and summaries against your original textbooks and notes. Look for any 
                  claims that seem inconsistent with what you've learned in class.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-foreground">Be skeptical of confident-sounding claims:</strong> AI often presents 
                  uncertain information with confident language. Just because something sounds 
                  authoritative doesn't mean it's accurate.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-foreground">Watch for common AI errors:</strong> These include mixing up similar 
                  concepts, providing outdated information, oversimplifying complex topics, and 
                  occasionally generating completely fabricated "facts."
                </li>
                <li className="leading-relaxed">
                  <strong className="text-foreground">Use verification as learning:</strong> The act of checking AI output 
                  against authoritative sources is itself a valuable learning activity that 
                  deepens your engagement with the material.
                </li>
              </ol>
            </section>

            <section id="active-learning" className="mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
                Ensuring Active Learning
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The biggest risk with AI tools is becoming passive—letting the AI do the thinking 
                while you simply consume output. Active engagement is essential for actual learning. 
                Here are strategies to stay actively involved:
              </p>
              
              <div className="bg-muted/30 rounded-xl p-6 my-8">
                <h4 className="font-semibold text-foreground mb-4">Strategies for Active Engagement</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Attempt before asking:</strong> Try solving problems or answering questions yourself before looking at AI-generated solutions. Compare your approach to the AI's.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Explain back in your own words:</strong> After reading an AI explanation, close it and explain the concept to yourself or a friend. If you can't, you haven't learned it.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Use practice tests honestly:</strong> Take AI-generated quizzes without peeking at answers. Grade yourself honestly to identify real knowledge gaps.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Create, don't just consume:</strong> Write your own notes, add your own flashcards alongside AI-generated ones, and annotate summaries with your own insights.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Apply to new problems:</strong> The true test of learning is applying concepts to problems you haven't seen before. Seek out practice problems beyond what AI has shown you.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            <section id="best-practices" className="mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
                Summary of Best Practices
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Following these guidelines will help you use AI study tools responsibly and effectively:
              </p>
              
              <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                <li className="leading-relaxed">
                  <strong className="text-foreground">Use AI to enhance, not replace, your own thinking.</strong> AI should 
                  be a tool that makes your studying more efficient, not a substitute for effort.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-foreground">Know and follow your institution's AI policies.</strong> Academic 
                  integrity matters, and policies are evolving rapidly.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-foreground">Always verify AI-generated content.</strong> Cross-check against 
                  authoritative sources and be alert to potential errors.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-foreground">Prioritize understanding over answers.</strong> Use step-by-step 
                  explanations to learn methods, not just to get homework done.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-foreground">Stay actively engaged.</strong> Test yourself, explain concepts aloud, 
                  and create your own materials alongside AI-generated content.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-foreground">Be honest with yourself.</strong> If you couldn't pass an exam without 
                  AI help, you haven't really learned the material.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-foreground">Use AI ethically.</strong> Consider whether your use would be 
                  acceptable if your instructor knew about it.
                </li>
              </ol>
            </section>
          </div>

          {/* CTA Section */}
          <div className="bg-primary text-primary-foreground rounded-2xl p-8 text-center mt-12">
            <Sparkles className="w-8 h-8 mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold mb-4">
              Ready to Learn Smarter—Responsibly?
            </h3>
            <p className="opacity-90 mb-6 max-w-xl mx-auto">
              Use NewtonAI's tools to create study materials, practice with quizzes, and understand 
              concepts deeply—the ethical way to enhance your education.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">
                Get Started Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </article>

        {/* Related Guides */}
        <section className="mt-16">
          <h2 className="font-display text-xl font-bold text-foreground mb-6">Related Guides</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link to="/guides/how-ai-learning-works" className="group">
              <div className="border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  How AI-Powered Learning Works
                </h3>
                <p className="text-sm text-muted-foreground">
                  Understand the technology behind AI study tools.
                </p>
              </div>
            </Link>
            <Link to="/guides/spaced-repetition-guide" className="group">
              <div className="border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  The Science of Spaced Repetition
                </h3>
                <p className="text-sm text-muted-foreground">
                  Master any subject with this proven study technique.
                </p>
              </div>
            </Link>
          </div>
        </section>
      </main>

      {/* Ad Banner */}
      <AdBanner className="container mx-auto" />

      <Footer />
    </div>
  );
};

export default ResponsibleAIUse;
