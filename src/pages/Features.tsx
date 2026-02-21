import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Layers,
  Brain,
  FileQuestion,
  FileText,
  Network,
  Mic,
  Headphones,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Clock,
  BarChart3,
  School,
  Users
} from "lucide-react";

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/features" },
];

const features = [
  {
    icon: Layers,
    title: "AI Flashcards",
    description: "Transform any document into interactive flashcards instantly. Our AI identifies key terms, definitions, and concepts from your study materials and creates question-answer pairs optimized for memorization. The system uses spaced repetition algorithms to schedule reviews at the perfect intervals, ensuring you retain information long-term. Whether you're studying vocabulary, historical dates, scientific formulas, or legal terminology, AI Flashcards adapts to your content and learning pace.",
    link: "/tools/flashcards"
  },
  {
    icon: FileQuestion,
    title: "AI Quiz Generator",
    description: "Test your knowledge with automatically generated quizzes tailored to your content. NewtonAI creates diverse question types including multiple choice, true/false, fill-in-the-blank, and short answer questions. Each quiz focuses on the most important concepts from your materials, helping you identify knowledge gaps before exams. Quiz difficulty automatically adjusts based on your performance, providing challenging but achievable questions that push your understanding forward.",
    link: "/tools/quiz"
  },
  {
    icon: FileText,
    title: "AI Summarizer",
    description: "Condense lengthy documents into clear, concise summaries without losing essential information. Our AI extracts the main ideas, key arguments, and supporting evidence from textbooks, research papers, articles, and lecture notes. Choose from different summary lengths—from brief overviews to detailed breakdowns—depending on your needs. Perfect for quick review sessions or getting the gist of new material before diving deeper into the details.",
    link: "/tools/summarizer"
  },
  {
    icon: Network,
    title: "Mind Map Generator",
    description: "Visualize complex topics and understand relationships between concepts with AI-generated mind maps. Our system analyzes your content to identify the central theme, main branches, and sub-topics, then creates an interactive visual diagram. Mind maps are particularly effective for subjects with interconnected concepts like biology, history, and literature. Export your maps as images or PDFs for offline study or integration into presentations.",
    link: "/tools/mind-map"
  },
  {
    icon: Mic,
    title: "Lecture Notes",
    description: "Never miss important information in lectures again. Record live lectures or upload audio files, and our AI will transcribe and organize the content into structured notes. The system identifies main topics, key points, and action items, formatting everything into easily digestible sections. Lecture Notes saves hours of manual note-taking while ensuring you capture every important detail discussed in class.",
    link: "/tools/lecture-notes"
  },
  {
    icon: Headphones,
    title: "AI Podcast",
    description: "Transform your study materials into engaging audio content you can listen to anywhere. Our AI converts documents into conversational podcast-style audio, making it easy to study during commutes, workouts, or any time you can't read. The generated podcasts maintain the educational value of your materials while presenting information in an accessible, listening-friendly format. Perfect for auditory learners or anyone who wants to make use of otherwise idle time.",
    link: "/tools/ai-podcast"
  },
  {
    icon: Brain,
    title: "Homework Help",
    description: "Get step-by-step explanations for complex problems across any subject. Upload a problem set, take a photo of a textbook question, or type your question directly—our AI provides detailed solutions with explanations at each step. Unlike simple answer engines, Homework Help teaches you the methodology so you can solve similar problems independently. Coverage spans mathematics, sciences, languages, and more.",
    link: "/tools/homework-help"
  },
  {
    icon: MessageSquare,
    title: "PDF Chat",
    description: "Have an interactive conversation with your documents. Upload any PDF and ask questions about the content in natural language. Our AI understands context and can answer specific questions, explain complex sections, compare different parts of the document, and help you understand difficult concepts. PDF Chat is like having a personal tutor who has read and understood your entire textbook, available 24/7.",
    link: "/pdf-chat"
  },
  {
    icon: School,
    title: "Classroom Hub",
    description: "A complete classroom management suite for educators. Teachers can create virtual classes, generate unique invite codes to onboard students, and assign AI-generated quizzes, flashcards, and study materials. Track student submissions, monitor performance with analytics dashboards, and manage multiple classes from one central hub. Classroom Hub brings the power of AI to the teaching side of education.",
    link: "/teacher"
  }
];

const integrationBenefits = [
  {
    icon: Sparkles,
    title: "Unified Platform",
    description: "All your study tools in one place. No need to switch between apps or manage multiple subscriptions."
  },
  {
    icon: Clock,
    title: "Time Savings",
    description: "Generate study materials in seconds that would take hours to create manually. Focus on learning, not preparation."
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Monitor your study time, quiz scores, and flashcard progress. Identify strengths and areas needing improvement."
  },
  {
    icon: Users,
    title: "For Teachers Too",
    description: "Manage classrooms, assign AI-generated work, and track student progress—all from one platform."
  }
];

const Features = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Features"
        description="Explore NewtonAI's powerful AI study tools: flashcards, quizzes, summaries, mind maps, lecture notes, podcasts, homework help, and PDF chat."
        canonicalPath="/features"
        breadcrumbs={breadcrumbs}
        keywords="AI study features, flashcard generator, quiz maker, summarizer, mind map, lecture notes, study tools"
      />
      
      <Header />
      
      <main className="container mx-auto px-4 py-10 sm:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            <Sparkles className="w-4 h-4" />
            Complete Study Suite
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-6">
            Powerful Features for Effective Learning
          </h1>
          
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            NewtonAI provides a comprehensive suite of AI-powered study tools designed to help you 
            learn more effectively. From flashcards and quizzes to summaries and podcasts, 
            every feature is built to enhance your understanding and retention of any subject.
          </p>
        </div>

        {/* Feature Deep Dives */}
        <section className="mb-20">
          <SectionHeader
            label="Study Tools"
            title="Feature Deep Dives"
            description="Detailed overview of each tool and how it helps you learn"
          />
          
          <div className="mt-12 grid gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex flex-col md:flex-row gap-6 p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold font-display mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <Link 
                    to={feature.link}
                    className="inline-flex items-center text-primary hover:underline text-sm font-medium"
                  >
                    Try {feature.title} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Integration Benefits */}
        <section className="mb-20">
          <SectionHeader
            label="All-in-One"
            title="All Your Study Tools in One Place"
            description="Why an integrated platform helps you learn better"
          />
          
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {integrationBenefits.map((benefit, index) => (
              <div key={index} className="p-6 rounded-xl border border-border bg-card text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-semibold font-display mb-2">{benefit.title}</h4>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-10 prose prose-lg dark:prose-invert max-w-3xl mx-auto">
            <p>
              Having all your study tools in one platform means your learning experience is seamless 
              and interconnected. Upload a document once and generate flashcards, quizzes, summaries, 
              and more from the same content. Track your progress across all tools to get a complete 
              picture of your learning journey.
            </p>
            <p>
              Cross-tool integration also means smarter learning. For example, topics you struggle 
              with in quizzes can automatically become priority flashcards. Your study patterns across 
              all tools inform personalized recommendations for how to spend your study time most effectively.
            </p>
          </div>
        </section>

        {/* Compare with Traditional Methods */}
        <section className="mb-16">
          <SectionHeader
            label="Comparison"
            title="Compare with Traditional Methods"
            description="See how AI-powered tools stack up against manual study preparation"
          />
          
          <div className="mt-10 max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">Task</th>
                  <th className="text-left py-4 px-4 font-semibold">Traditional Method</th>
                  <th className="text-left py-4 px-4 font-semibold text-primary">With NewtonAI</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-4 px-4 font-medium">Create 50 flashcards</td>
                  <td className="py-4 px-4 text-muted-foreground">2-3 hours manually</td>
                  <td className="py-4 px-4 text-primary">30 seconds</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-4 px-4 font-medium">Summarize a chapter</td>
                  <td className="py-4 px-4 text-muted-foreground">45-60 minutes reading</td>
                  <td className="py-4 px-4 text-primary">Under 1 minute</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-4 px-4 font-medium">Create practice quiz</td>
                  <td className="py-4 px-4 text-muted-foreground">1-2 hours writing questions</td>
                  <td className="py-4 px-4 text-primary">Instant generation</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-4 px-4 font-medium">Build a mind map</td>
                  <td className="py-4 px-4 text-muted-foreground">30-45 minutes diagramming</td>
                  <td className="py-4 px-4 text-primary">Seconds to generate</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Transcribe lecture</td>
                  <td className="py-4 px-4 text-muted-foreground">Real-time + review</td>
                  <td className="py-4 px-4 text-primary">Automatic & organized</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-8 bg-muted/50 rounded-lg p-6 max-w-3xl mx-auto">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> NewtonAI automates the creation of study materials 
                so you can spend your time on what matters most—actually learning and understanding the content. 
                The time saved on preparation can be invested in deeper study and practice.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20">
          <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
            Ready to Try These Features?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Get started with NewtonAI for free. Upload your first document and see how our 
            AI-powered tools can transform your study experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/auth">Try Features Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/how-it-works">Learn How It Works</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Features;
