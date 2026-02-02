import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, BookOpen, Sparkles, CheckCircle, ArrowRight, Calendar, TrendingUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { AdBanner } from "@/components/AdBanner";

const SpacedRepetitionGuide = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Guides", href: "/guides" },
    { name: "Spaced Repetition Guide", href: "/guides/spaced-repetition-guide" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="The Science of Spaced Repetition: Master Any Subject"
        description="Learn how spaced repetition helps you remember more with less effort. Discover the science-backed technique and how to implement it with AI flashcards."
        canonicalPath="/guides/spaced-repetition-guide"
        breadcrumbs={breadcrumbs}
        keywords="spaced repetition, flashcards, memory retention, study technique, active recall, learning science"
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
              <Badge variant="secondary">Study Techniques</Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                10 min read
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              The Science of Spaced Repetition: Master Any Subject
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Discover the scientifically-proven study technique that helps you remember more with less effort. 
              Learn how to implement spaced repetition and transform your learning efficiency.
            </p>
          </header>

          {/* Table of Contents */}
          <nav className="bg-muted/30 rounded-xl p-6 mb-12">
            <h2 className="font-semibold text-foreground mb-4">In This Guide</h2>
            <ul className="space-y-2 text-sm">
              <li><a href="#what-is-sr" className="text-primary hover:underline">What is Spaced Repetition?</a></li>
              <li><a href="#science" className="text-primary hover:underline">The Science Behind Memory</a></li>
              <li><a href="#forgetting-curve" className="text-primary hover:underline">The Forgetting Curve</a></li>
              <li><a href="#implementing" className="text-primary hover:underline">Implementing Spaced Repetition</a></li>
              <li><a href="#flashcards" className="text-primary hover:underline">Optimal Flashcard Design</a></li>
              <li><a href="#schedule" className="text-primary hover:underline">Creating Your Study Schedule</a></li>
            </ul>
          </nav>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            <section id="what-is-sr" className="mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                What is Spaced Repetition?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Spaced repetition is a learning technique that involves reviewing information at gradually 
                increasing intervals. Instead of cramming all your studying into one session, you spread 
                reviews over time, reviewing material just before you're likely to forget it.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The technique was first proposed by German psychologist Hermann Ebbinghaus in the 1880s 
                and has been refined through over a century of cognitive science research. Today, it's 
                considered one of the most effective study methods available, with studies showing it 
                can improve retention by 200% or more compared to traditional study methods.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The key insight is that reviewing information at the right moment—just as you're about 
                to forget it—creates the strongest memory reinforcement. Review too soon, and you waste 
                time on material you already know. Review too late, and you've forgotten too much, 
                essentially starting over. Spaced repetition optimizes the timing of each review.
              </p>
            </section>

            <section id="science" className="mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
                The Science Behind Memory
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To understand why spaced repetition works, we need to understand how memory works. When 
                you learn something new, your brain forms neural connections. These connections start 
                weak and become stronger each time you retrieve the information.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The critical factor is the "desirable difficulty" of retrieval. When you struggle slightly 
                to recall something, the act of retrieval strengthens the memory far more than easy recall 
                or re-reading. This is why testing yourself (active recall) is more effective than passive 
                review, and why waiting until you almost forget creates the strongest reinforcement.
              </p>
              
              <div className="bg-muted/30 rounded-xl p-6 my-8">
                <h4 className="font-semibold text-foreground mb-4">Key Memory Principles</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Active Recall:</strong> Testing yourself creates stronger memories than re-reading or highlighting.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Spacing Effect:</strong> Distributed practice over time beats concentrated cramming sessions.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Desirable Difficulty:</strong> Some struggle during recall strengthens memory more than easy recall.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Interleaving:</strong> Mixing different topics or problem types improves learning over blocked practice.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            <section id="forgetting-curve" className="mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-primary" />
                The Forgetting Curve
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Ebbinghaus discovered what he called the "forgetting curve"—a mathematical model of how 
                memory decays over time. Without review, we forget approximately 70% of new information 
                within 24 hours and up to 90% within a week.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                However, each time you successfully recall information, the forgetting curve becomes 
                less steep. After multiple reviews at optimal intervals, information can remain 
                accessible for months or even years with minimal additional review.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A typical spaced repetition schedule might look like this: Review new material after 
                1 day, then 3 days, then 7 days, then 14 days, then 30 days, and so on. If you fail 
                a review, the interval resets to a shorter period. If you succeed, the interval 
                increases. This adaptive scheduling is what makes spaced repetition so efficient.
              </p>
            </section>

            <section id="implementing" className="mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
                Implementing Spaced Repetition
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                There are several ways to implement spaced repetition, from low-tech paper systems 
                to sophisticated software algorithms:
              </p>
              
              <h3 className="font-display text-xl font-semibold text-foreground mb-4 mt-8">
                The Leitner Box System
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A physical system using boxes or sections. New cards start in Box 1 (reviewed daily). 
                If you answer correctly, the card moves to the next box (reviewed less frequently). 
                If you answer incorrectly, it returns to Box 1. Simple and effective for paper flashcards.
              </p>

              <h3 className="font-display text-xl font-semibold text-foreground mb-4 mt-8">
                Digital Spaced Repetition Software
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Modern apps like NewtonAI use algorithms that calculate optimal review intervals 
                based on your performance. They automatically schedule reviews, track progress, 
                and adjust difficulty based on your recall success. This automation makes spaced 
                repetition effortless to maintain.
              </p>

              <h3 className="font-display text-xl font-semibold text-foreground mb-4 mt-8">
                AI-Generated Flashcards
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                AI tools can automatically extract key concepts from your study materials and 
                create flashcards optimized for spaced repetition. This saves hours of manual 
                card creation while ensuring comprehensive coverage of your material.
              </p>
            </section>

            <section id="flashcards" className="mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
                Optimal Flashcard Design
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Not all flashcards are created equal. Well-designed cards lead to faster, more 
                durable learning. Here are principles for creating effective flashcards:
              </p>
              
              <div className="bg-muted/30 rounded-xl p-6 my-8">
                <h4 className="font-semibold text-foreground mb-4">Flashcard Best Practices</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">One Concept Per Card:</strong> Each card should test one atomic piece of information. Complex cards are harder to grade and lead to partial forgetting.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Clear Questions:</strong> The question should unambiguously point to one answer. Avoid vague prompts that could have multiple correct responses.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Concise Answers:</strong> Answers should be brief and memorable. If an answer requires a paragraph, break it into multiple cards.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Use Cloze Deletions:</strong> "The mitochondria is the _____ of the cell" often works better than "What is the mitochondria?" for factual recall.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">Add Context:</strong> Include enough context that the card makes sense in isolation but not so much that it gives away the answer.
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            <section id="schedule" className="mb-12">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-primary" />
                Creating Your Study Schedule
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Consistency is key to spaced repetition success. Here's how to build a sustainable 
                practice:
              </p>
              <ol className="list-decimal list-inside space-y-4 text-muted-foreground mb-6">
                <li className="leading-relaxed">
                  <strong className="text-foreground">Start Small:</strong> Begin with 10-20 new cards per day maximum. 
                  Each new card creates future reviews, and it's easy to become overwhelmed if you add 
                  too many cards too quickly.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-foreground">Daily Reviews First:</strong> Make it a habit to complete all due 
                  reviews before adding new material. Reviews compound, so staying current prevents a 
                  backlog from building up.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-foreground">Schedule Fixed Time:</strong> Review at the same time each day—
                  perhaps with morning coffee or during a commute. Habit formation makes consistency easier.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-foreground">Track Your Progress:</strong> Monitor metrics like retention rate 
                  and cards matured. Seeing improvement is motivating and helps you adjust your approach.
                </li>
                <li className="leading-relaxed">
                  <strong className="text-foreground">Plan for Exams:</strong> For exam preparation, ensure you complete 
                  all new card additions at least 2-3 weeks before the test, leaving time for reviews to 
                  consolidate the material.
                </li>
              </ol>
            </section>
          </div>

          {/* CTA Section */}
          <div className="bg-primary text-primary-foreground rounded-2xl p-8 text-center mt-12">
            <Sparkles className="w-8 h-8 mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold mb-4">
              Start Using Spaced Repetition Today
            </h3>
            <p className="opacity-90 mb-6 max-w-xl mx-auto">
              Generate AI-powered flashcards from your study materials and start building lasting knowledge with NewtonAI.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/tools/flashcards">
                Create Flashcards
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
            <Link to="/guides/responsible-ai-use" className="group">
              <div className="border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  Using AI Responsibly for Education
                </h3>
                <p className="text-sm text-muted-foreground">
                  Best practices for ethical and effective use of AI study tools.
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

export default SpacedRepetitionGuide;
