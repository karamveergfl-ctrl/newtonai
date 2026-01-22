import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import { OptimizedBackgroundBlobs } from "@/components/OptimizedBackgroundBlobs";
import SEOHead from "@/components/SEOHead";
import FloatingToolsShowcase from "@/components/FloatingToolsShowcase";
import { HeroParticles } from "@/components/HeroParticles";
import { 
  BookOpen, 
  Brain, 
  FileText, 
  Video, 
  Sparkles, 
  Zap,
  CheckCircle,
  ArrowRight
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

const LandingPage = () => {
  const breadcrumbs = [{ name: "Home", href: "/" }];

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <SEOHead
        title="Home"
        description="Transform any document, video, or lecture into flashcards, quizzes, summaries, and mind maps. Your personal AI study assistant for smarter learning."
        canonicalPath="/"
        breadcrumbs={breadcrumbs}
        keywords="AI study assistant, flashcards, quiz generator, PDF summarizer, mind maps, student tools"
      />
      <Header transparent />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Optimized Background Blobs */}
        <OptimizedBackgroundBlobs variant="hero" />
        
        {/* Floating particle effects */}
        <HeroParticles iconCount={14} dotCount={25} />
        
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
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20"
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered Study Tools
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Study Smarter with{" "}
              <span className="text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AI-Powered
              </span>
              {" "}Tools
            </motion.h1>
            
            <motion.p 
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Transform any document, video, or lecture into flashcards, quizzes, summaries, and mind maps. 
              Your personal AI study assistant.
            </motion.p>
            
            {/* Floating Tools Showcase - now includes its own CTA */}
            <FloatingToolsShowcase />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <OptimizedBackgroundBlobs variant="minimal" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Study Effectively
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered tools help you learn faster and retain more information.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group gpu-accelerated"
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 relative overflow-hidden">
        <OptimizedBackgroundBlobs variant="minimal" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Students Love Our Platform
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of students who are already studying smarter with our AI-powered tools.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8 aspect-square flex items-center justify-center relative overflow-hidden"
            >
              <div className="text-center relative z-10">
                <div className="text-6xl font-bold text-primary mb-2">
                  10K+
                </div>
                <div className="text-xl text-muted-foreground">
                  Active Students
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA Section */}
      <CTASection 
        title="Ready to Transform Your Study Habits?"
        description="Join thousands of students who are already studying smarter with AI."
        primaryButtonText="Get Started Free"
        primaryButtonLink="/auth"
        secondaryButtonText="Learn More"
        secondaryButtonLink="/about"
      />

      <Footer />
    </div>
  );
};

export default LandingPage;