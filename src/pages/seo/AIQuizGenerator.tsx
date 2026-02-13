import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ArrowRight, CheckCircle, Sparkles, BookOpen } from "lucide-react";

const AIQuizGenerator = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "AI Quiz Generator", href: "/ai-quiz-generator" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="AI Quiz Generator – Create Practice Tests Instantly"
        description="Generate practice quizzes and tests from any study material using AI. NewtonAI creates multiple choice, true/false, and short answer questions with instant grading and explanations."
        canonicalPath="/ai-quiz-generator"
        breadcrumbs={breadcrumbs}
        keywords="AI quiz generator, practice test maker, AI quiz maker, generate quiz from notes, exam practice questions, AI test generator, quiz from PDF"
      />
      <Header />

      <main className="flex-1">
        <section className="pt-24 pb-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" /> AI Testing
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              AI Quiz Generator: Practice Tests from Any Material
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Turn your notes, textbooks, and study materials into practice quizzes instantly. Test yourself with AI-generated questions and get detailed explanations for every answer.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6 group">
              <Link to="/auth">Generate a Quiz Free <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" /></Link>
            </Button>
          </div>
        </section>

        <article className="py-16">
          <div className="container mx-auto px-4 max-w-4xl prose prose-lg dark:prose-invert">
            <h2 className="text-3xl font-bold text-foreground">Why Self-Testing is the Most Effective Study Method</h2>
            <p className="text-muted-foreground leading-relaxed">
              Decades of cognitive science research have consistently shown that self-testing (also called retrieval practice) is one of the most powerful learning techniques available. When you test yourself on material, you strengthen the neural pathways associated with that knowledge, making it easier to recall during actual exams.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The challenge has always been creating good practice questions. Writing your own quiz questions is time-consuming and often results in questions that are too easy or don't cover the right material. NewtonAI solves this problem by using AI to generate high-quality, varied questions from your exact study materials.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">How NewtonAI's Quiz Generator Works</h2>
            <p className="text-muted-foreground leading-relaxed">
              Upload any study material — PDF textbook chapter, lecture notes, handwritten notes, or paste text directly. NewtonAI's AI analyzes the content and generates a comprehensive quiz covering all major topics. You can customize the quiz type: multiple choice questions for broad concept testing, true/false for quick fact checking, or short answer for deeper understanding.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Each question comes with a detailed explanation. When you get an answer wrong, you don't just see the correct answer — you understand why it's correct and why your answer was wrong. This immediate feedback loop accelerates learning by correcting misconceptions in real-time.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">Question Types and Difficulty Levels</h2>
            <p className="text-muted-foreground leading-relaxed">
              NewtonAI generates questions at varying difficulty levels to match your learning stage. For initial review, you'll get straightforward recall questions that test basic understanding. As you progress, the AI can generate application-level questions that require you to apply concepts to new scenarios, and analysis-level questions that test deeper understanding.
            </p>
            <ul className="space-y-3">
              {[
                "Multiple Choice Questions (MCQ) — 4 options with one correct answer, ideal for concept testing",
                "True/False Questions — Quick fact verification and common misconception testing",
                "Short Answer Questions — Open-ended responses that test deeper understanding",
                "Fill-in-the-blank — Tests recall of specific terms, formulas, and definitions",
                "Instant grading with detailed explanations for every question",
                "Quiz review mode to revisit incorrect answers and strengthen weak areas"
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-3xl font-bold text-foreground mt-12">Best Practices for Using AI Quizzes</h2>
            <p className="text-muted-foreground leading-relaxed">
              To maximize the benefit of AI-generated quizzes, follow these evidence-based strategies. First, take the quiz without looking at your notes — this forces genuine retrieval practice. Second, review all explanations, even for questions you got right, to reinforce your understanding. Third, retake quizzes after a few days to leverage the spacing effect. Fourth, generate new quizzes from the same material to test yourself on different aspects.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Studies show that students who regularly self-test perform 20-40% better on final exams compared to students who only re-read their materials. The key is consistency — taking a 10-minute quiz every day is more effective than a single marathon study session before the exam.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">AI Quiz Generator for Different Subjects</h2>
            <p className="text-muted-foreground leading-relaxed">
              NewtonAI's quiz generator adapts to the subject matter. For science subjects, it generates questions involving formulas, experimental procedures, and cause-effect relationships. For history and social sciences, it focuses on dates, events, key figures, and analytical questions. For language learning, it creates vocabulary, grammar, and comprehension questions. For mathematics, it generates problem-solving questions with step-by-step solutions.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Whether you're preparing for school exams, college midterms, competitive entrance tests, or professional certifications, NewtonAI creates relevant practice questions tailored to your study material.
            </p>
          </div>
        </article>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "How many questions does the AI generate per quiz?", a: "By default, NewtonAI generates 10-15 questions per quiz, but you can customize this. The AI ensures questions cover all major topics in your uploaded material." },
                { q: "Can I generate quizzes from YouTube videos?", a: "Yes! Paste a YouTube video URL and NewtonAI will transcribe the content and generate quiz questions based on the video material." },
                { q: "Are the quiz questions unique each time?", a: "Yes, the AI generates different questions each time you create a quiz from the same material, so you can practice multiple times without memorizing answers." },
                { q: "Can I share quizzes with classmates?", a: "Currently, quizzes are tied to your account. We're working on sharing features for collaborative study groups." },
                { q: "Does the quiz generator work for competitive exams?", a: "Absolutely. Students use NewtonAI to prepare for competitive exams like JEE, NEET, UPSC, GRE, GMAT, and more. The AI generates exam-style questions from your preparation materials." }
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
            <h2 className="text-3xl font-bold text-foreground mb-4">Test Yourself and Ace Your Exams</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Generate practice quizzes from any study material. Free to start, no credit card required.</p>
            <Button asChild size="lg" className="group">
              <Link to="/auth">Create Your First Quiz <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AIQuizGenerator;
