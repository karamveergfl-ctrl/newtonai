import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ArrowRight, CheckCircle, Sparkles, Brain, FileText, BookOpen, Zap } from "lucide-react";

const ExamPreparationAI = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Exam Preparation AI", href: "/exam-preparation-ai" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="AI for Exam Preparation – Study Smarter, Score Higher"
        description="Prepare for any exam using AI-powered study tools. NewtonAI creates flashcards, practice quizzes, summaries, and study plans from your course materials for effective exam preparation."
        canonicalPath="/exam-preparation-ai"
        breadcrumbs={breadcrumbs}
        keywords="exam preparation AI, AI exam study, exam practice tool, AI study plan, exam revision tool, AI test prep, board exam preparation"
      />
      <Header />

      <main className="flex-1">
        <section className="pt-24 pb-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" /> Exam Ready
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              AI-Powered Exam Preparation: Study Smarter, Score Higher
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Whether it's board exams, entrance tests, or finals — NewtonAI helps you prepare efficiently with AI-generated quizzes, flashcards, summaries, and more.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6 group">
              <Link to="/auth">Start Exam Prep Free <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" /></Link>
            </Button>
          </div>
        </section>

        <article className="py-16">
          <div className="container mx-auto px-4 max-w-4xl prose prose-lg dark:prose-invert">
            <h2 className="text-3xl font-bold text-foreground">The Science of Effective Exam Preparation</h2>
            <p className="text-muted-foreground leading-relaxed">
              Successful exam preparation isn't about studying more — it's about studying smarter. Research in cognitive psychology has identified several key strategies that dramatically improve exam performance: spaced repetition, active recall, interleaving, and elaborative interrogation. NewtonAI integrates all of these evidence-based strategies into a single, easy-to-use platform.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Most students fall into the trap of passive studying — re-reading notes, highlighting textbooks, and watching lecture recordings. While these activities feel productive, research consistently shows they produce minimal long-term retention. NewtonAI transforms passive materials into active learning experiences that are proven to work.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">How NewtonAI Supercharges Your Exam Preparation</h2>

            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { icon: Brain, title: "Spaced Repetition Flashcards", desc: "Create flashcards from your study materials and review them at scientifically optimal intervals. The AI schedules your reviews to maximize retention with minimum study time." },
                { icon: BookOpen, title: "Practice Quizzes", desc: "Generate unlimited practice questions from your course materials. Test yourself regularly to identify weak areas and focus your study time where it matters most." },
                { icon: FileText, title: "Smart Summaries", desc: "Condense entire textbook chapters into focused summaries. Get quick overviews before diving deep, or use them as last-minute revision notes before exams." },
                { icon: Zap, title: "Step-by-Step Solutions", desc: "Stuck on a problem? Get detailed, step-by-step solutions that teach you the methodology. Understand how to solve problems, not just the answers." },
              ].map((feature) => (
                <div key={feature.title} className="bg-card rounded-xl p-6 border border-border">
                  <feature.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-3xl font-bold text-foreground mt-12">A Complete Exam Preparation Strategy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Here's how top-performing students use NewtonAI to prepare for exams effectively:
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Phase 1 — Understanding (4-6 weeks before exam):</strong> Upload your textbook chapters and generate summaries. Read through the summaries to build a high-level understanding of each topic. Use the mind map feature to visualize connections between concepts.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Phase 2 — Active Learning (2-4 weeks before exam):</strong> Generate flashcards from each chapter. Start your spaced repetition schedule. Take daily quizzes to test your understanding. Use the homework helper for practice problems you find difficult.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Phase 3 — Revision (1-2 weeks before exam):</strong> Focus on your weakest areas identified by quiz performance. Regenerate quizzes for topics where you scored below 80%. Review flashcards that you frequently get wrong. Re-read summaries for a final refresher.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Phase 4 — Final Review (day before exam):</strong> Do a quick run through all flashcards. Take one comprehensive practice quiz covering all topics. Review summaries of the most important chapters. Get a good night's sleep — your brain consolidates learning during sleep.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">Exams NewtonAI Helps You Prepare For</h2>
            <ul className="space-y-3">
              {[
                "School and board exams (CBSE, ICSE, state boards, GCSE, A-Levels)",
                "College entrance exams (JEE, NEET, SAT, ACT)",
                "University midterms and finals across all subjects",
                "Graduate entrance exams (GRE, GMAT, LSAT, MCAT)",
                "Government and competitive exams (UPSC, SSC, banking exams)",
                "Professional certifications (AWS, Google Cloud, PMP)",
                "Language proficiency tests (IELTS, TOEFL, DELF)"
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-3xl font-bold text-foreground mt-12">Why AI-Powered Exam Prep is the Future</h2>
            <p className="text-muted-foreground leading-relaxed">
              Traditional exam preparation relies on students creating their own study materials — a process that's time-consuming and often ineffective. AI changes this equation. With NewtonAI, the time you would spend creating flashcards and practice questions is now spent actually learning. The AI handles the preparation of study materials while you focus on understanding and retention.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Furthermore, AI-generated questions often cover angles that students might miss when creating their own practice tests. The AI is trained on diverse educational content and can generate questions that test application, analysis, and synthesis — the higher-order thinking skills that exams increasingly assess.
            </p>
          </div>
        </article>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "How far in advance should I start using NewtonAI for exam prep?", a: "Ideally, start 4-6 weeks before your exam. This gives enough time for spaced repetition to work effectively. However, even last-minute use for summary generation and quick quizzes can be beneficial." },
                { q: "Can NewtonAI replace a tutor?", a: "NewtonAI is a powerful complement to tutoring. It excels at content processing, practice generation, and self-testing. For personalized guidance on study strategies or complex concepts, a tutor can still be valuable." },
                { q: "Does it work for practical/lab-based exams?", a: "NewtonAI is most effective for theory-based exams. For practical exams, it can help you study the theoretical concepts, procedures, and safety protocols that are often tested alongside practical skills." },
                { q: "How does spaced repetition work?", a: "Spaced repetition is a learning technique that schedules reviews at increasing intervals. NewtonAI's flashcard system uses this principle — cards you find easy are shown less frequently, while difficult cards appear more often." },
                { q: "Can I study with friends on NewtonAI?", a: "Currently, NewtonAI is optimized for individual study. Group study features are planned for future updates. In the meantime, students often generate quizzes and test each other using the generated questions." }
              ].map((faq) => (
                <details key={faq.q} className="bg-card rounded-lg border border-border p-4 group">
                  <summary className="font-semibold text-foreground cursor-pointer list-none flex items-center justify-between">
                    {faq.q}
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Start Preparing for Your Next Exam</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Upload your study materials and let AI create your personalized exam preparation toolkit.</p>
            <Button asChild size="lg" className="group">
              <Link to="/auth">Get Started Free <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ExamPreparationAI;
