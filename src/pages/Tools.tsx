import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { 
  Brain, 
  FileText, 
  HelpCircle, 
  Lightbulb, 
  Map, 
  Mic, 
  Sparkles,
  ArrowRight,
  CheckCircle,
  MessageSquare,
  FunctionSquare
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { AdBanner } from "@/components/AdBanner";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";

const tools = [
  {
    id: "quiz",
    name: "AI Quiz Generator",
    shortName: "Quiz",
    description: "Create personalized quizzes from any document, video, or lecture. Test your knowledge with AI-generated questions.",
    icon: Brain,
    href: "/tools/quiz",
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    features: ["Multiple choice questions", "Instant feedback", "Progress tracking"],
    limits: { free: "3/month", pro: "90/month", ultra: "Unlimited" }
  },
  {
    id: "flashcards",
    name: "AI Flashcards",
    shortName: "Flashcards",
    description: "Generate smart flashcards automatically from your study materials. Master concepts with spaced repetition.",
    icon: Lightbulb,
    href: "/tools/flashcards",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    features: ["Auto-generated cards", "Flip animations", "Study mode"],
    limits: { free: "3/month", pro: "90/month", ultra: "Unlimited" }
  },
  {
    id: "podcast",
    name: "AI Podcast",
    shortName: "Podcast",
    description: "Transform your notes into engaging audio podcasts. Learn on the go with AI-generated discussions.",
    icon: Mic,
    href: "/tools/ai-podcast",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    features: ["Two-host format", "Natural voices", "Raise hand Q&A"],
    limits: { free: "1/month", pro: "15/month", ultra: "Unlimited" }
  },
  {
    id: "mind-map",
    name: "Mind Map Generator",
    shortName: "Mind Map",
    description: "Visualize complex topics with auto-generated mind maps. See connections between concepts instantly.",
    icon: Map,
    href: "/tools/mind-map",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    features: ["Interactive diagrams", "Zoom & pan", "Multiple layouts"],
    limits: { free: "3/month", pro: "90/month", ultra: "Unlimited" }
  },
  {
    id: "lecture-notes",
    name: "AI Lecture Notes",
    shortName: "Notes",
    description: "Convert lectures, videos, and recordings into structured study notes. Never miss important details.",
    icon: FileText,
    href: "/tools/lecture-notes",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    features: ["Multiple templates", "Highlight mode", "Text-to-speech"],
    limits: { free: "2/month", pro: "20/month", ultra: "Unlimited" }
  },
  {
    id: "summarizer",
    name: "AI Summarizer",
    shortName: "Summarizer",
    description: "Extract key insights from lengthy PDFs and documents. Get concise summaries in seconds.",
    icon: Sparkles,
    href: "/tools/summarizer",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    features: ["Multiple formats", "Key points extraction", "Download as PDF"],
    limits: { free: "2/month", pro: "20/month", ultra: "Unlimited" }
  },
  {
    id: "homework-help",
    name: "Homework Help",
    shortName: "Homework",
    description: "Get step-by-step solutions to any problem. Upload a photo and receive detailed explanations.",
    icon: HelpCircle,
    href: "/tools/homework-help",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    features: ["Step-by-step solutions", "Image upload", "Multiple subjects"],
    limits: { free: "5/day", pro: "Unlimited", ultra: "Unlimited" }
  },
  {
    id: "pdf-chat",
    name: "PDF Chat",
    shortName: "PDF Chat",
    description: "Chat with your PDFs and get instant answers from your documents.",
    icon: MessageSquare,
    href: "/pdf-chat",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    features: ["Ask questions", "Citations", "Voice chat"],
    limits: { free: "2/month", pro: "20/month", ultra: "Unlimited" }
  },
  {
    id: "latex-editor",
    name: "LaTeX Editor",
    shortName: "LaTeX",
    description: "Write and preview mathematical equations with live KaTeX rendering and a symbol palette.",
    icon: FunctionSquare,
    href: "/tools/latex-editor",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    features: ["Live preview", "Symbol palette", "Copy as image"],
    limits: { free: "Unlimited", pro: "Unlimited", ultra: "Unlimited" }
  },
];

/* ─── Compact grid for authenticated users ─── */
function AuthenticatedToolsGrid() {
  const navigate = useNavigate();

  return (
    <AppLayout showFooter={false}>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-4">Study Tools</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => navigate(tool.href)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border bg-card hover:border-primary/50 hover:shadow-md active:scale-[0.97] transition-all"
            >
              <div className={`w-12 h-12 rounded-xl ${tool.bgColor} flex items-center justify-center`}>
                <tool.icon className={`w-6 h-6 ${tool.color}`} />
              </div>
              <span className="text-sm font-medium text-foreground text-center leading-tight">
                {tool.shortName}
              </span>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

/* ─── Public marketing page (unchanged) ─── */
function PublicToolsPage() {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Tools", href: "/tools" },
  ];

  const toolsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "NewtonAI Study Tools",
    "description": "AI-powered study tools to help you learn faster and study smarter",
    "numberOfItems": tools.length,
    "itemListElement": tools.map((tool, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "SoftwareApplication",
        "name": tool.name,
        "description": tool.description,
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web",
        "url": `https://newtonai.lovable.app${tool.href}`,
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
      }
    }))
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="AI Study Tools"
        description="Explore NewtonAI's suite of AI-powered study tools: Quiz Generator, Flashcards, Podcast Creator, Mind Maps, Lecture Notes, Summarizer, and Homework Help."
        canonicalPath="/tools"
        breadcrumbs={breadcrumbs}
        keywords="AI study tools, quiz generator, flashcard maker, mind map generator, lecture notes, PDF summarizer, homework help"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(toolsSchema)}</script>
      </Helmet>

      <Header />

      {/* Hero Section */}
      <section className="relative py-10 overflow-hidden">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -right-32 w-80 h-80 bg-gradient-to-bl from-secondary/20 to-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
              <Sparkles className="w-4 h-4" />
              {tools.length} Powerful AI Tools
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              AI-Powered Study Tools
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Transform any content into flashcards, quizzes, summaries, podcasts, and more. Study smarter with tools designed for modern learners.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg"><Link to="/auth">Get Started Free<ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
              <Button asChild variant="outline" size="lg"><Link to="/pricing">View Pricing</Link></Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="container mx-auto px-4 pb-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <div key={tool.id}>
              <Link to={tool.href}>
                <Card className="h-full group cursor-pointer hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-12 h-12 rounded-lg ${tool.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <tool.icon className={`w-6 h-6 ${tool.color}`} />
                      </div>
                      <Badge variant="outline" className="text-xs">Free: {tool.limits.free}</Badge>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">{tool.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tool.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Pro: {tool.limits.pro}</span>
                        <span>Ultra: {tool.limits.ultra}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
        <AdBanner />
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Ready to Transform Your Study Habits?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">Join thousands of students using AI to study smarter. Start free today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary"><Link to="/auth">Start Learning Free<ArrowRight className="w-4 h-4 ml-2" /></Link></Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10"><Link to="/pricing">Compare Plans</Link></Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const Tools = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) return null; // loading

  return isAuthenticated ? <AuthenticatedToolsGrid /> : <PublicToolsPage />;
};

export default Tools;
