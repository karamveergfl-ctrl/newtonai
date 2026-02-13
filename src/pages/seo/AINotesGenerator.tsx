import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ArrowRight, FileText, CheckCircle, Sparkles } from "lucide-react";

const AINotesGenerator = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "AI Notes Generator", href: "/ai-notes-generator" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="AI Notes Generator – Create Study Notes Instantly"
        description="Generate structured study notes from PDFs, lectures, and textbooks using AI. NewtonAI's notes generator extracts key concepts, definitions, and summaries automatically."
        canonicalPath="/ai-notes-generator"
        breadcrumbs={breadcrumbs}
        keywords="AI notes generator, automatic note taking, AI lecture notes, study notes maker, notes from PDF, AI note taker"
      />
      <Header />

      <main className="flex-1">
        <section className="pt-24 pb-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" /> AI Note Taking
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              AI Notes Generator: Turn Any Material into Study Notes
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Stop spending hours manually writing notes. NewtonAI's AI notes generator automatically creates well-structured, comprehensive study notes from any document or lecture.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6 group">
              <Link to="/auth">Generate Notes Free <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" /></Link>
            </Button>
          </div>
        </section>

        <article className="py-16">
          <div className="container mx-auto px-4 max-w-4xl prose prose-lg dark:prose-invert">
            <h2 className="text-3xl font-bold text-foreground">What is an AI Notes Generator?</h2>
            <p className="text-muted-foreground leading-relaxed">
              An AI notes generator is a tool that uses artificial intelligence to automatically extract and organize key information from study materials into structured notes. Instead of reading through entire textbooks or lengthy lecture recordings, students can upload their materials and receive concise, well-organized notes in seconds.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              NewtonAI's notes generator goes beyond simple text extraction. It understands the structure of your content — identifying main topics, subtopics, key definitions, important formulas, and critical concepts. The result is a set of notes that mirrors what a top student would create, but generated in a fraction of the time.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">How NewtonAI Generates Notes</h2>
            <p className="text-muted-foreground leading-relaxed">
              The process is straightforward. Upload your study material — a PDF textbook chapter, a recorded lecture transcript, a DOCX document, or even an image of handwritten notes. NewtonAI's AI analyzes the content, identifies the hierarchical structure, and generates organized notes with clear headings, bullet points, and highlighted key terms.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The AI is trained to recognize different types of academic content. For science materials, it emphasizes formulas, diagrams descriptions, and experimental procedures. For humanities, it focuses on key arguments, historical dates, and thematic connections. For mathematics, it extracts problem-solving methodologies and theorem statements.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">Benefits of AI-Generated Notes</h2>
            <ul className="space-y-3">
              {[
                "Save 3-5 hours per week on note-taking tasks",
                "Never miss a key concept — AI catches details you might overlook",
                "Consistent formatting makes reviewing easier and faster",
                "Generate notes from multiple sources and combine them into unified study guides",
                "Perfect for students who learn better by reading structured summaries",
                "Export notes as PDF or use them directly within NewtonAI's study tools",
                "Works with handwritten notes via OCR (optical character recognition)",
                "Supports multiple languages for international students"
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-3xl font-bold text-foreground mt-12">Use Cases for AI Note Taking</h2>
            <p className="text-muted-foreground leading-relaxed">
              Students use NewtonAI's notes generator in many different scenarios. Before a lecture, you can upload the textbook chapter to get a preview of key concepts. After a lecture, upload the recorded transcript to fill in gaps in your handwritten notes. During exam preparation, combine notes from multiple chapters into a comprehensive study guide.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Research students find it particularly valuable for processing academic papers. Instead of spending hours reading dense research papers, the AI extracts the methodology, key findings, and conclusions — letting you quickly assess whether a paper is relevant to your research.
            </p>

            <h2 className="text-3xl font-bold text-foreground mt-12">AI Notes vs. Manual Notes: Which is Better?</h2>
            <p className="text-muted-foreground leading-relaxed">
              The research on note-taking suggests that the act of writing notes by hand can improve retention. However, this benefit comes from the cognitive processing involved, not from the physical act of writing. AI-generated notes serve a different purpose — they ensure you have complete, accurate notes that you can then use for active study techniques like self-testing and spaced repetition.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The ideal approach combines both methods: use NewtonAI to generate comprehensive base notes, then engage with them actively by highlighting, annotating, and testing yourself. This way, you get the completeness of AI-generated notes with the retention benefits of active engagement.
            </p>
          </div>
        </article>

        {/* FAQ */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "Can AI generate notes from handwritten content?", a: "Yes! NewtonAI supports OCR (optical character recognition) to process images of handwritten notes. Simply take a photo of your notes and upload it." },
                { q: "How accurate are AI-generated notes?", a: "NewtonAI uses advanced AI models that produce highly accurate notes. However, we always recommend reviewing the generated notes against your original material, especially for specialized or technical subjects." },
                { q: "Can I edit the generated notes?", a: "Yes, all generated notes are fully editable. You can add your own annotations, highlight important sections, and customize the structure to match your learning style." },
                { q: "What subjects does the notes generator work best for?", a: "NewtonAI's notes generator works well across all subjects — from STEM fields like physics, chemistry, and mathematics to humanities like history, literature, and political science." },
                { q: "How many notes can I generate for free?", a: "The free tier includes a generous monthly allowance for note generation. Premium plans offer higher limits for students with heavy course loads." }
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

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Generate Your First Notes in Seconds</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Upload any document and let AI create structured study notes for you. No credit card required.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="group">
                <Link to="/auth">Start Free <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/ai-study-assistant">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AINotesGenerator;
