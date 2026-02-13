import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TestimonialsSection } from "@/components/TestimonialsSection";
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
  XCircle,
  Headphones,
  Map,
  MessageSquare,
  GraduationCap,
  Target } from
"lucide-react";

const problems = [
"Too many apps for studying",
"YouTube distractions & ads",
"Notes scattered everywhere",
"Generic AI not optimized for learning",
"No structured study workflow"];


const solutions = [
"AI chat built specifically for learning",
"Unlimited study videos without distractions",
"Instant notes, summaries, flashcards, quizzes",
"Mind maps, podcasts & document chat",
"Study-focused AI (better than general AI tools)"];


const features = [
{ icon: Brain, title: "Smart AI Study Assistant", description: "Custom AI tuned only for education." },
{ icon: MessageSquare, title: "Chat With Any Document", description: "PDFs, notes, lectures, research papers." },
{ icon: Video, title: "Learn From Videos Without Distraction", description: "Study content only — no ads, no recommended junk." },
{ icon: Headphones, title: "AI Podcasts From Notes", description: "Listen and revise anywhere." },
{ icon: Map, title: "Mind Maps & Visual Learning", description: "Understand faster with structure." },
{ icon: FileText, title: "Instant Notes & Summaries", description: "Save hours of manual work." },
{ icon: BookOpen, title: "Quiz & Practice Mode", description: "Test instantly after learning." }];


const comparisonRows = [
{ other: "Multiple apps needed", newton: "Everything in one" },
{ other: "Distracting content", newton: "Focus-only learning" },
{ other: "Generic AI answers", newton: "Education-tuned AI" },
{ other: "Ads & recommendations", newton: "Clean study environment" },
{ other: "Limited tools", newton: "Full study ecosystem" }];


const studentValueProps = [
"Optimized explanations",
"Academic accuracy focus",
"Structured learning workflow",
"Faster revision tools",
"Better concept clarity"];


const usedFor = [
"Exams preparation",
"Engineering & science studies",
"Competitive exams",
"Research learning",
"Skill development"];


const LandingPage = () => {
  const breadcrumbs = [{ name: "Home", href: "/" }];

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <SEOHead
        title="Home"
        description="NewtonAI is an AI-powered study assistant for students that converts notes, PDFs and study materials into summaries, quizzes and flashcards for faster exam preparation."
        canonicalPath="/"
        breadcrumbs={breadcrumbs}
        keywords="AI study assistant, AI notes generator, PDF summarizer, quiz generator, flashcard maker, exam preparation, AI for students, study tools, AI homework helper" />

      <Header transparent />
      
      {/* Hero Section */}
      <section id="hero-section" className="relative pt-12 pb-12 md:pt-14 md:pb-16 overflow-hidden">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -right-32 w-80 h-80 bg-gradient-to-bl from-secondary/20 to-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20 tracking-wide">
              <Sparkles className="w-4 h-4" />
              AI-Powered Learning Assistant
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl text-foreground mb-8 leading-[1.1] tracking-tight font-serif font-semibold text-center md:text-7xl">
              Stop Switching Apps.
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Start Mastering Subjects.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed font-extrabold text-center font-sans">
              Why juggle YouTube, AI tools, notes apps, and random resources?
              <br className="hidden md:block" />
              NewtonAI unifies everything into one intelligent learning ecosystem — designed to help you{" "}
              <span className="font-semibold text-foreground">focus, retain more, and perform better.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="text-lg px-10 py-6 rounded-xl group font-semibold">
                <Link to="/auth">
                  Start Free
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-10 py-6 rounded-xl font-semibold">
                <Link to="/features">Explore Features</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground mb-12">
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
            <FloatingToolsShowcase />
          </div>
        </div>
      </section>

      {/* Problem + Solution Combined Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
            {/* Problem Card */}
            <div className="relative rounded-2xl border border-destructive/20 bg-destructive/5 p-8 md:p-10 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive/60 to-destructive/20" />
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground font-serif">
                  The Problem
                </h2>
              </div>
              <ul className="space-y-5 mb-8">
                {problems.map((item) =>
                <li key={item} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-destructive/70 flex-shrink-0 mt-0.5" />
                    <span className="text-base md:text-lg text-muted-foreground leading-relaxed">{item}</span>
                  </li>
                )}
              </ul>
              <p className="text-sm font-semibold text-destructive tracking-wide uppercase">
                Result: More time wasted, less learning.
              </p>
            </div>

            {/* Solution Card */}
            <div className="relative rounded-2xl border border-primary/20 bg-primary/5 p-8 md:p-10 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 to-secondary/40" />
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground font-serif">
                  The Solution
                </h2>
              </div>
              <ul className="space-y-5 mb-8">
                {solutions.map((item) =>
                <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary/70 flex-shrink-0 mt-0.5" />
                    <span className="text-base md:text-lg text-muted-foreground leading-relaxed">{item}</span>
                  </li>
                )}
              </ul>
              <p className="text-sm font-semibold text-primary tracking-wide uppercase">
                No switching apps. No distractions. Just learning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 relative overflow-hidden">
        <div className="absolute top-40 -right-32 w-72 h-72 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary mb-4 border border-primary/20">
              All-in-One Platform
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-serif">
              Everything Students Need
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {features.map((feature) =>
            <div
              key={feature.title}
              className="relative rounded-2xl border border-border bg-card p-6 md:p-7 group hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">

                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors duration-300">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors duration-300 font-serif">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary mb-4 border border-primary/20">
              Side-by-Side
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-serif">
              Why NewtonAI Wins
            </h2>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-2">
              <div className="text-center font-semibold text-muted-foreground py-4 px-3 bg-destructive/5 border-b border-border text-sm md:text-base">
                Other Platforms
              </div>
              <div className="text-center font-semibold text-primary py-4 px-3 bg-primary/5 border-b border-border border-l border-l-border text-sm md:text-base">
                NewtonAI
              </div>
            </div>
            {comparisonRows.map((row, i) =>
            <div key={row.other} className={`grid grid-cols-2 ${i < comparisonRows.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="flex items-center gap-2.5 p-4 md:p-5 text-muted-foreground text-sm md:text-base">
                  <XCircle className="w-4 h-4 text-destructive/60 flex-shrink-0" />
                  <span>{row.other}</span>
                </div>
                <div className="flex items-center gap-2.5 p-4 md:p-5 text-foreground border-l border-border bg-primary/[0.02] text-sm md:text-base">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium">{row.newton}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-12 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <GraduationCap className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Designed Only For Students
          </h2>
          <p className="text-muted-foreground mb-6">Unlike general AI tools:</p>
          <ul className="space-y-3 text-left max-w-md mx-auto mb-8">
            {studentValueProps.map((item) =>
            <li key={item} className="flex items-center gap-3 text-foreground">
                <Target className="w-5 h-5 text-primary flex-shrink-0" />
                {item}
              </li>
            )}
          </ul>
          <p className="text-lg font-semibold text-foreground">
            This is not just AI.<br />
            <span className="text-primary">This is an AI learning system.</span>
          </p>
        </div>
      </section>

      {/* Trust / Authority */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10">
            Used By Students For
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            {usedFor.map((item) =>
            <div key={item} className="flex items-center gap-3 bg-card rounded-lg p-4 border border-border">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ad Banner */}
      <AdBanner />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Final CTA */}
      <section className="py-12 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Start Studying Smarter Today
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            One platform. Zero distractions. Unlimited learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 py-6 group">
              <Link to="/auth">
                Start Free Now
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link to="/dashboard">Upload Your First Study Material</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <StickyCTABar />
    </div>);

};

export default LandingPage;