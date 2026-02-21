import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, BookOpen, Brain, Shield, Sparkles, GraduationCap } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { OptimizedBackgroundBlobs } from "@/components/OptimizedBackgroundBlobs";
import { AdBanner } from "@/components/AdBanner";

interface GuideItem {
  slug: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
  readTime: string;
  category: string;
}

const guides: GuideItem[] = [
  {
    slug: "how-ai-learning-works",
    title: "How AI-Powered Learning Works: A Complete Guide",
    description: "Understand the technology behind AI study tools and how they can transform your learning experience. Learn about natural language processing, machine learning, and how these technologies create personalized study materials.",
    icon: Brain,
    readTime: "12 min read",
    category: "AI & Education"
  },
  {
    slug: "spaced-repetition-guide",
    title: "The Science of Spaced Repetition: Master Any Subject",
    description: "Discover the scientifically-proven technique that helps you remember more with less effort. Learn how to implement spaced repetition with flashcards and optimize your study schedule for maximum retention.",
    icon: BookOpen,
    readTime: "10 min read",
    category: "Study Techniques"
  },
  {
    slug: "responsible-ai-use",
    title: "Using AI Responsibly for Education",
    description: "Learn the best practices for using AI study tools ethically and effectively. Understand when to use AI assistance, how to verify information, and how to ensure you're truly learning, not just getting answers.",
    icon: Shield,
    readTime: "8 min read",
    category: "Best Practices"
  },
  {
    slug: "teacher-getting-started",
    title: "Getting Started as a Teacher on NewtonAI",
    description: "A step-by-step guide for educators to set up their first classroom, invite students, create AI-generated assignments, and track student progress using NewtonAI's classroom management tools.",
    icon: GraduationCap,
    readTime: "6 min read",
    category: "For Teachers"
  }
];

const Guides = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Guides", href: "/guides" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Study Guides"
        description="In-depth educational guides on AI-powered learning, study techniques, and best practices for students. Learn how to study smarter with evidence-based methods."
        canonicalPath="/guides"
        breadcrumbs={breadcrumbs}
        keywords="study guides, AI learning, spaced repetition, study techniques, educational technology, learning methods"
      />
      
      <Header />

      {/* Hero Section */}
      <section className="relative py-10 overflow-hidden">
        <OptimizedBackgroundBlobs variant="minimal" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
              <Sparkles className="w-4 h-4" />
              Educational Resources
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              Study Guides & Learning Resources
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              In-depth guides on AI-powered learning, study techniques, and best practices 
              to help you study smarter and achieve your academic goals.
            </p>
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="container mx-auto px-4 pb-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {guides.map((guide) => (
            <Link key={guide.slug} to={`/guides/${guide.slug}`}>
              <Card className="h-full group cursor-pointer hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <guide.icon className="w-5 h-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {guide.category}
                    </Badge>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors line-clamp-2 text-xl">
                    {guide.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-4 leading-relaxed">
                    {guide.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {guide.readTime}
                    </span>
                    <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                      Read Guide
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Read Our Guides Section */}
      <section className="bg-muted/50 py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
              Why Read Our Guides?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Our guides are written by education specialists who understand both the technology 
              behind AI learning tools and the science of effective studying. Each guide is 
              thoroughly researched and designed to give you actionable insights you can 
              apply immediately to your studies.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-background rounded-xl p-6 border">
                <h3 className="font-semibold text-foreground mb-2">Evidence-Based</h3>
                <p className="text-sm text-muted-foreground">
                  Our recommendations are backed by cognitive science research and proven learning methodologies.
                </p>
              </div>
              <div className="bg-background rounded-xl p-6 border">
                <h3 className="font-semibold text-foreground mb-2">Practical Tips</h3>
                <p className="text-sm text-muted-foreground">
                  Every guide includes actionable steps you can start using immediately in your studies.
                </p>
              </div>
              <div className="bg-background rounded-xl p-6 border">
                <h3 className="font-semibold text-foreground mb-2">Regularly Updated</h3>
                <p className="text-sm text-muted-foreground">
                  We keep our guides current with the latest research and AI technology developments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Banner - Single placement */}
      <AdBanner className="container mx-auto" />

      <Footer />
    </div>
  );
};

export default Guides;
