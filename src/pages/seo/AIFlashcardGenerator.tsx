import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ArrowRight, CheckCircle, Layers } from "lucide-react";
import { buildFaqSchema, buildWebPageSchema, buildSoftwareAppSchema } from "@/lib/structuredData";

const FAQS = [
  { q: "Is the AI flashcard generator free?", a: "Yes. You can create flashcard decks on the free plan without a credit card. Paid plans raise the daily generation limits and unlock longer documents." },
  { q: "What files can I turn into flashcards?", a: "Upload a PDF, DOCX, PPTX or an image of handwritten notes, paste raw text, or drop in a YouTube lecture link. NewtonAI reads the material and writes the cards for you." },
  { q: "How many flashcards does the AI create?", a: "A typical chapter produces 15-40 cards. You choose the target count before generating, and you can regenerate any card you don't like." },
  { q: "Does it support formulas and diagrams?", a: "Yes. Mathematical notation is rendered with LaTeX, and cards generated from diagram-heavy pages describe the figure so the answer still makes sense on its own." },
  { q: "Can I study the cards with spaced repetition?", a: "Yes. Cards flip in a study view where you mark each one as known or needs review, so weak cards come back more often." },
  { q: "Does it work in languages other than English?", a: "Yes. NewtonAI generates cards in the language of your source material, including Hindi, Spanish, French, German and Arabic." },
];

const AIFlashcardGenerator = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "AI Flashcard Generator", href: "/ai-flashcard-generator" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="AI Flashcard Generator – Cards from Any Notes"
        description="Turn PDFs, lecture notes, slides and videos into study flashcards in seconds with NewtonAI's free AI flashcard generator. Question-and-answer cards with spaced repetition built in."
        canonicalPath="/ai-flashcard-generator"
        breadcrumbs={breadcrumbs}
        keywords="AI flashcard generator, flashcard maker, generate flashcards from PDF, AI study cards, free flashcard generator, flashcards from notes, spaced repetition app"
        structuredData={[
          buildWebPageSchema({
            name: "AI Flashcard Generator – Cards from Any Notes",
            description: "Free AI flashcard generator that turns PDFs, notes, slides and videos into question-and-answer study cards.",
            path: "/ai-flashcard-generator",
            primaryTopic: "AI flashcard generation",
          }),
          buildSoftwareAppSchema({
            name: "NewtonAI Flashcard Generator",
            description: "AI tool that converts PDFs, lecture notes, slides and YouTube videos into study flashcards with spaced repetition review.",
            path: "/ai-flashcard-generator",
            featureList: ["Flashcards from PDF", "Flashcards from lecture notes", "Flashcards from YouTube videos", "LaTeX formula support", "Spaced repetition review", "Multi-language decks"],
          }),
          buildFaqSchema(FAQS),
        ]}
      />
      <Header />

      <main className="flex-1">
        <section className="pt-20 pb-10 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Layers className="w-4 h-4" /> AI Flashcards
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              AI Flashcard Generator: Study Cards from Any Material
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Upload a PDF, paste your notes or drop in a lecture video, and NewtonAI writes a full deck of question-and-answer flashcards in seconds — then helps you drill them with spaced repetition.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 group">
                <Link to="/tools/flashcards">Generate Flashcards Free <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
                <Link to="/tools">See All Study Tools</Link>
              </Button>
            </div>
          </div>
        </section>

        <article className="py-10">
          <div className="container mx-auto px-4 max-w-4xl prose prose-lg dark:prose-invert">
            <h2 className="text-3xl font-bold text-foreground">Why Flashcards Still Beat Re-reading</h2>
            <p className="text-muted-foreground leading-relaxed">
              Flashcards work because they force active recall. Instead of passively re-reading a chapter and feeling familiar with it, you have to pull the answer out of memory — and that effort is what makes the memory durable. Pair recall with spacing (seeing a card again a day, three days and a week later) and you get the two most reliably effective study techniques in cognitive psychology, stacked.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The catch has always been the cost of making the cards. Writing 40 good cards for one chapter takes an hour of typing that produces no learning by itself. An AI flashcard generator removes that hour: you spend your time reviewing instead of transcribing.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">How NewtonAI's AI Flashcard Generator Works</h2>
            <p className="text-muted-foreground leading-relaxed">
              Drop in your source material and NewtonAI reads it the way a tutor would. It extracts the text (including from scanned pages and photos of handwritten notes), identifies the concepts, definitions, formulas and relationships that are actually testable, and writes one card per idea — a clear question on the front, a self-contained answer on the back.
            </p>
            <ol className="space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">1. Add your material.</strong> Upload a PDF, DOCX or PPTX, snap a photo of your notes, paste text, or paste a YouTube lecture URL.</li>
              <li><strong className="text-foreground">2. Choose the deck size and language.</strong> Pick how many cards you want and the language you study in.</li>
              <li><strong className="text-foreground">3. Review and drill.</strong> Flip through the deck, mark cards as known or needs review, and regenerate any card that misses the point.</li>
            </ol>

            <h2 className="text-3xl font-bold text-foreground mt-12">What You Get in Every Deck</h2>
            <ul className="space-y-3">
              {[
                "One idea per card — no walls of text on the back",
                "Definition, concept, formula and comparison card types mixed automatically",
                "LaTeX rendering for equations, so physics and maths cards stay readable",
                "Cards generated in the language of your source material",
                "Spaced repetition review that resurfaces the cards you keep missing",
                "Export and revisit decks later from your generation history",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-3xl font-bold text-foreground mt-12">Who Uses AI Flashcards</h2>
            <p className="text-muted-foreground leading-relaxed">
              Medical and nursing students use them for the sheer volume of terminology. Engineering students use them for formulas and derivation steps. Law students use them for case names and holdings. Language learners use them for vocabulary pulled straight from the texts they are reading. Teachers generate a deck from a lesson and hand it to a class as revision homework.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              For competitive exams — JEE, NEET, UPSC, GRE, GMAT, MCAT — the advantage compounds: you can turn a whole syllabus into decks in an afternoon and then spend the remaining months reviewing rather than preparing to review.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">Getting Better Cards Out of the AI</h2>
            <p className="text-muted-foreground leading-relaxed">
              Feed it one chapter at a time rather than a whole textbook — narrower input produces sharper questions. Keep decks under about 40 cards so a review session stays under fifteen minutes. Review a new deck the same day you generate it, again the next day, then weekly. And when a card is vague, regenerate it: the second pass is usually more specific.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Flashcards pair well with testing. Once a deck feels easy, run the same material through the{" "}
              <Link to="/ai-quiz-generator" className="text-primary underline">AI quiz generator</Link> for exam-style questions, or condense the chapter first with the{" "}
              <Link to="/ai-notes-generator" className="text-primary underline">AI notes generator</Link>.
            </p>
          </div>
        </article>

        <section className="py-10 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {FAQS.map((faq) => (
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

        <section className="py-10 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Turn Your Next Chapter Into Flashcards</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Free to start, no credit card required. Your first deck takes about thirty seconds.</p>
            <Button asChild size="lg" className="group">
              <Link to="/tools/flashcards">Open the Flashcard Generator <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AIFlashcardGenerator;