import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import SEOHead from "@/components/SEOHead";
import FloatingToolsShowcase from "@/components/FloatingToolsShowcase";
import StickyCTABar from "@/components/StickyCTABar";
import { AdBanner } from "@/components/AdBanner";

import {
  BookOpen, 
  Brain, 
  FileText, 
  Video, 
  Sparkles, 
  Zap,
  CheckCircle,
  ArrowRight,
  Users,
  CreditCard,
  Cpu,
  FileCheck
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Flashcards",
    description: "Generate smart flashcards from any document. Up to 90/month on Pro!"
  },
  {
    icon: FileText,
    title: "PDF Summarizer",
    description: "Extract key insights from lengthy PDFs. 20 summaries/month on Pro."
  },
  {
    icon: Video,
    title: "Video Summarizer",
    description: "Turn YouTube videos into concise, actionable study notes."
  },
  {
    icon: BookOpen,
    title: "AI Quiz Generator",
    description: "Create personalized quizzes. Free gets 3/month, Pro gets 90!"
  },
  {
    icon: Sparkles,
    title: "Mind Maps",
    description: "Visualize complex topics with auto-generated mind maps. 90/month on Pro."
  },
  {
    icon: Zap,
    title: "Homework Help",
    description: "Get step-by-step solutions. Unlimited on Pro & Ultra plans!"
  }
];

const benefits = [
  "Save hours of study time with AI assistance",
  "Learn faster with personalized content",
  "Retain more with active recall techniques",
  "Study smarter, not harder"
];

const valueProps = [
  { icon: CheckCircle, text: "Free Forever Tier" },
  { icon: CreditCard, text: "No Credit Card" },
  { icon: Cpu, text: "AI-Powered" },
  { icon: FileCheck, text: "PDFs, Videos, Lectures" }
];

const LandingPage = () => {
  const breadcrumbs = [{ name: "Home", href: "/" }];

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <SEOHead
        title="Home"
        description="NewtonAI is an AI-powered study assistant for students that converts notes, PDFs and study materials into summaries, quizzes and flashcards for faster exam preparation."
        canonicalPath="/"
        breadcrumbs={breadcrumbs}
        keywords="AI study assistant, AI notes generator, PDF summarizer, quiz generator, flashcard maker, exam preparation, AI for students, study tools, AI homework helper"
      />
      <Header transparent />
      
      {/* Hero Section */}
      <section id="hero-section" className="relative pt-20 pb-16 overflow-hidden">
        {/* Static gradient background */}
        <div className="absolute top-20 -left-32 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -right-32 w-80 h-80 bg-gradient-to-bl from-secondary/20 to-accent/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        
        {/* Subtle dot matrix pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
              <Sparkles className="w-4 h-4" />
              AI-Powered Study Tools
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Study Smarter with{" "}
              <span className="text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AI-Powered
              </span>
              {" "}Tools
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform any document, video, or lecture into flashcards, quizzes, summaries, and mind maps. 
              Your personal AI study assistant.
            </p>

            {/* Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button asChild size="lg" className="text-lg px-8 py-6 group">
                <Link to="/auth">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link to="/pricing">See Pricing</Link>
              </Button>
            </div>

            {/* Trust Line */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-10">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-primary" />
                No credit card required
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-primary" />
                Free tier available
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                12K+ students
              </span>
            </div>
            
            {/* Floating Tools Showcase */}
            <FloatingToolsShowcase />
          </div>
        </div>
      </section>

      {/* Value Proposition Strip */}
      <section className="py-6 bg-muted/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {valueProps.map((prop) => (
              <div key={prop.text} className="flex items-center gap-2 text-sm font-medium text-foreground">
                <prop.icon className="w-4 h-4 text-primary" />
                {prop.text}
              </div>
            ))}
          </div>
        </div>
      </section>
      

      {/* Features Section */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-40 -right-32 w-72 h-72 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Study Effectively
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered tools help you learn faster and retain more information.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is NewtonAI - SEO Content Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">What is NewtonAI?</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8 text-center max-w-3xl mx-auto">
            NewtonAI is an AI-powered study assistant designed specifically for students. It transforms any study material — PDFs, notes, textbooks, lectures, and videos — into interactive learning tools that help you study smarter and prepare for exams more effectively.
          </p>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Who is NewtonAI For?</h3>
              <p className="text-muted-foreground leading-relaxed">
                NewtonAI serves students at every level — from high school board exam preparation to college finals and competitive entrance tests like JEE, NEET, GRE, and GMAT. Whether you're a self-learner or a university student with heavy course loads, NewtonAI adapts to your study workflow.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Key AI Study Tools</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary flex-shrink-0" /> <Link to="/pdf-study-tool" className="hover:text-primary transition-colors">AI PDF Summarizer</Link></li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary flex-shrink-0" /> <Link to="/ai-notes-generator" className="hover:text-primary transition-colors">AI Notes Generator</Link></li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary flex-shrink-0" /> <Link to="/ai-quiz-generator" className="hover:text-primary transition-colors">AI Quiz Generator</Link></li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary flex-shrink-0" /> AI Flashcard Maker & Mind Maps</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary flex-shrink-0" /> <Link to="/exam-preparation-ai" className="hover:text-primary transition-colors">AI Exam Preparation</Link></li>
              </ul>
            </div>
          </div>
          <p className="text-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/ai-study-assistant">Learn More About NewtonAI</Link>
            </Button>
          </p>
        </div>
      </section>

      {/* Mid-Page CTA */}
      <section className="py-12 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ready to boost your grades?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join thousands of students already studying smarter with AI.
          </p>
          <Button asChild size="lg" className="group">
            <Link to="/auth">
              Start Learning Free
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>


      {/* Benefits Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-40 -right-32 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Students Love Our Platform
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of students who are already studying smarter with our AI-powered tools.
              </p>
              <ul className="space-y-4 mb-8">
                {benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              
              {/* Benefits Section CTA */}
              <Button asChild size="lg" className="group">
                <Link to="/auth">
                  Start Learning Smarter
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
            
            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8 aspect-square flex items-center justify-center relative overflow-hidden">
              <div className="text-center relative z-10">
                <div className="text-6xl font-bold text-primary mb-2">
                  10K+
                </div>
                <div className="text-xl text-muted-foreground">
                  Active Students
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Single Ad Banner - After Benefits (reduced from 3 to 1) */}
      <AdBanner />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA Section */}
      <div id="footer-cta-section">
        <CTASection
          title="Ready to Transform Your Study Habits?"
          description="Join thousands of students who are already studying smarter with AI."
          primaryButtonText="Get Started Free"
          primaryButtonLink="/auth"
          secondaryButtonText="Learn More"
          secondaryButtonLink="/about"
        />
      </div>

      <Footer />
      
      {/* Sticky Mobile CTA Bar */}
      <StickyCTABar />
    </div>
  );
};

export default LandingPage;
