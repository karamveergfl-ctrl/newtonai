import { Link, useLocation } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ROUTE_META } from "@/seo/routeMeta";
import { buildFaqSchema, buildWebPageSchema } from "@/lib/structuredData";

interface ExamContent {
  intro: string;
  steps: string[];
  benefits: string[];
  cta: { label: string; to: string };
  related: { label: string; to: string }[];
  faqs: { q: string; a: string }[];
}

const CONTENT: Record<string, ExamContent> = {
  "/neet-flashcards-ai": {
    intro: "NEET rewards students who know NCERT line by line. NewtonAI turns your own NCERT Biology, Chemistry and Physics PDFs into flashcards and one-line quiz questions, so you revise from the source the exam is built on — not from random question banks.",
    steps: ["Upload your NCERT chapter PDF (or a photo of your notes).", "Choose Flashcards or Quiz.", "Revise with active recall and come back to the cards you got wrong."],
    benefits: ["Cards come only from the chapter you upload", "Works for Biology diagrams-heavy chapters and Chemistry reactions", "Quiz mode for quick one-liner practice", "Free plan to start, no card needed"],
    cta: { label: "Make NEET flashcards free", to: "/tools/flashcards" },
    related: [{ label: "AI Flashcard Generator", to: "/ai-flashcard-generator" }, { label: "AI Quiz Generator", to: "/ai-quiz-generator" }, { label: "Spaced repetition guide", to: "/guides/spaced-repetition-guide" }],
    faqs: [
      { q: "Can I make NEET flashcards from NCERT PDFs?", a: "Yes. Upload the NCERT chapter PDF and NewtonAI creates flashcards from that chapter's content." },
      { q: "Is it free?", a: "NewtonAI has a free plan with a monthly number of flashcard and quiz sets. Paid plans raise the limits." },
      { q: "Does it replace NCERT reading?", a: "No. It helps you test yourself on what you have read, which is how you remember it for the exam." },
    ],
  },
  "/jee-quiz-generator-ai": {
    intro: "Previous-year papers are great, but you also need practice on exactly what your coaching covered this week. NewtonAI turns your own JEE notes, coaching PDFs and lecture videos into quizzes, and its homework help explains numericals step by step.",
    steps: ["Upload your notes, coaching module PDF or a YouTube lecture link.", "Generate a quiz on that chapter.", "Check your answers and open step-by-step solutions for the ones you missed."],
    benefits: ["Quizzes from your own material, not generic banks", "Step-by-step help for Physics and Maths numericals", "Maths written in proper notation", "Free plan to start"],
    cta: { label: "Generate a JEE quiz free", to: "/tools/quiz" },
    related: [{ label: "AI Homework Help", to: "/tools/homework-help" }, { label: "How AI solves numericals faster", to: "/blog/how-ai-helps-solve-numericals-faster" }, { label: "Exam preparation with AI", to: "/exam-preparation-ai" }],
    faqs: [
      { q: "Can I make a quiz from my coaching notes?", a: "Yes. Upload a PDF, DOCX or photo of your notes and NewtonAI builds a quiz from it." },
      { q: "Does it solve JEE numericals?", a: "Homework Help gives step-by-step solutions so you can follow the method, not just the answer." },
      { q: "Is it a PYQ bank?", a: "No. It makes practice from the material you give it, which works well alongside PYQ practice." },
    ],
  },
  "/cbse-notes-ai": {
    intro: "Long CBSE chapters are hard to revise the night before. Upload your Class 9–12 textbook chapter and NewtonAI gives you a short summary, flashcards for key terms and a quiz to check yourself.",
    steps: ["Upload the chapter PDF or a photo of the textbook page.", "Pick Summary, Flashcards or Quiz.", "Revise the summary, then test yourself."],
    benefits: ["Summaries organised by headings", "Flashcards for definitions and key terms", "Quizzes to check before tests", "Mind maps to see the whole chapter at once"],
    cta: { label: "Summarize a chapter free", to: "/tools/summarizer" },
    related: [{ label: "AI Notes Generator", to: "/ai-notes-generator" }, { label: "AI Mind Map", to: "/tools/mind-map" }, { label: "Active recall guide", to: "/blog/active-recall-technique-guide" }],
    faqs: [
      { q: "Which classes does it work for?", a: "Any class. It works from the material you upload, so Class 9, 10, 11 and 12 chapters all work." },
      { q: "Can I use a photo of my textbook?", a: "Yes. NewtonAI reads text from images as well as PDFs and DOCX files." },
      { q: "Is it free?", a: "There is a free plan with monthly limits; paid plans raise them." },
    ],
  },
  "/youtube-lecture-to-notes": {
    intro: "One-shot lectures are long. Paste the YouTube link and NewtonAI turns the lecture into structured notes, then flashcards and a quiz, so you don't have to pause and write for hours.",
    steps: ["Copy the YouTube lecture link.", "Paste it into Lecture Notes.", "Get notes, then make flashcards or a quiz from them."],
    benefits: ["Works with long one-shot videos", "Notes organised by topic", "Turn the notes into flashcards or a quiz in one click", "Free plan to start"],
    cta: { label: "Turn a lecture into notes", to: "/tools/lecture-notes" },
    related: [{ label: "AI Notes Generator", to: "/ai-notes-generator" }, { label: "PDF vs video learning", to: "/blog/pdf-vs-video-learning-which-is-better" }, { label: "AI Podcast", to: "/tools/ai-podcast" }],
    faqs: [
      { q: "Which videos work?", a: "Public YouTube lecture videos. Paste the link and NewtonAI processes the lecture." },
      { q: "Can I make flashcards from the video?", a: "Yes. Once the notes are ready you can create flashcards or a quiz from them." },
      { q: "Is it free?", a: "There is a free plan with monthly limits; paid plans raise them." },
    ],
  },
};

const ExamLandingPage = () => {
  const { pathname } = useLocation();
  const meta = ROUTE_META.find((r) => r.path === pathname)!;
  const c = CONTENT[pathname];
  if (!meta || !c) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={meta.title.replace(/ \| NewtonAI$/, "")}
        description={meta.description}
        canonicalPath={pathname}
        breadcrumbs={[{ name: "Home", href: "/" }, { name: meta.h1, href: pathname }]}
        structuredData={[
          buildWebPageSchema({ name: meta.h1, description: meta.description, path: pathname }),
          buildFaqSchema(c.faqs),
        ]}
      />
      <Header />
      <main className="flex-1">
        <section className="pt-20 pb-10 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{meta.h1}</h1>
            <p className="text-lg text-muted-foreground mb-8">{c.intro}</p>
            <Button asChild size="lg" className="group">
              <Link to={c.cta.to}>
                {c.cta.label} <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-10">
          <div className="container mx-auto px-4 max-w-3xl grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">How it works</h2>
              <ol className="space-y-3 list-decimal pl-5 text-muted-foreground">
                {c.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Why students use it</h2>
              <ul className="space-y-3">
                {c.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="py-10 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground mb-6">Questions</h2>
            <div className="space-y-4">
              {c.faqs.map((f) => (
                <div key={f.q} className="bg-card rounded-lg border border-border p-4">
                  <h3 className="font-semibold text-foreground">{f.q}</h3>
                  <p className="mt-2 text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
            <h2 className="text-xl font-bold text-foreground mt-10 mb-3">Related</h2>
            <ul className="flex flex-wrap gap-3">
              {c.related.map((r) => (
                <li key={r.to}><Link to={r.to} className="text-primary underline underline-offset-4">{r.label}</Link></li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ExamLandingPage;
