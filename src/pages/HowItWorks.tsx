import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Upload, 
  Brain, 
  Sparkles, 
  BarChart3, 
  Shield, 
  Zap,
  BookOpen,
  Users,
  Lock,
  CheckCircle2
} from "lucide-react";

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "How It Works", href: "/how-it-works" },
];

const processSteps = [
  {
    step: 1,
    icon: Upload,
    title: "Upload Your Content",
    description: "Start by uploading your study materials in any format. NewtonAI accepts PDFs, Word documents, images, handwritten notes, YouTube video links, and plain text. You can also paste content directly or record live lectures using our audio transcription feature. Our system processes documents of any length, from single-page notes to entire textbooks with hundreds of pages."
  },
  {
    step: 2,
    icon: Brain,
    title: "AI Analyzes & Understands",
    description: "Once uploaded, our AI engine goes to work understanding your content. Using advanced Natural Language Processing (NLP), the system identifies key concepts, definitions, relationships between ideas, and important facts. It recognizes subject-specific terminology whether you're studying biology, history, mathematics, or any other discipline. The AI builds a comprehensive understanding of your material to generate accurate, relevant study tools."
  },
  {
    step: 3,
    icon: Sparkles,
    title: "Generate Study Materials",
    description: "With the content analyzed, you can now generate various study tools with a single click. Create flashcards that focus on the most important terms and concepts. Generate quizzes to test your understanding with multiple choice, true/false, and short answer questions. Build mind maps to visualize relationships between topics. Get concise summaries that capture the essential information. Even create audio podcasts to learn while commuting or exercising."
  },
  {
    step: 4,
    icon: BarChart3,
    title: "Study & Track Progress",
    description: "Begin studying with your personalized materials. Our spaced repetition algorithm schedules flashcard reviews at optimal intervals to maximize long-term retention. Quiz results help identify knowledge gaps so you can focus your efforts where they matter most. Track your study time, completion rates, and improvement over time. The more you use NewtonAI, the better it understands your learning patterns and adapts to help you succeed."
  }
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="How NewtonAI Works"
        description="Learn how NewtonAI transforms your study materials into effective learning tools using AI. Upload content, generate flashcards, quizzes, summaries, and more."
        canonicalPath="/how-it-works"
        breadcrumbs={breadcrumbs}
        keywords="how NewtonAI works, AI study tools, machine learning education, NLP learning, study materials"
      />
      
      <Header />
      
      <main className="container mx-auto px-4 py-10 sm:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            <Brain className="w-4 h-4" />
            Understanding the Technology
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-6">
            How NewtonAI Works
          </h1>
          
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            NewtonAI uses advanced artificial intelligence to transform your study materials into 
            effective, personalized learning tools. Our platform analyzes your content and generates 
            flashcards, quizzes, summaries, mind maps, and even audio podcasts—all designed to help 
            you learn faster and remember longer.
          </p>
        </div>

        {/* The Science Behind AI Learning */}
        <section className="mb-20">
          <SectionHeader
            label="The Technology"
            title="The Science Behind AI-Powered Learning"
            description="Understanding how artificial intelligence enhances your study experience"
          />
          
          <div className="mt-10 prose prose-lg dark:prose-invert max-w-4xl mx-auto">
            <p>
              At the heart of NewtonAI lies a sophisticated combination of Natural Language Processing (NLP) 
              and machine learning technologies. When you upload your study materials, our AI doesn't just 
              scan for keywords—it truly understands the context, meaning, and relationships within your content.
            </p>
            
            <p>
              Natural Language Processing allows our system to parse and comprehend text the way a human would. 
              It identifies main topics, recognizes definitions and explanations, understands cause-and-effect 
              relationships, and distinguishes between important concepts and supporting details. This deep 
              understanding is what enables NewtonAI to generate study materials that are genuinely useful, 
              not just random excerpts from your documents.
            </p>
            
            <p>
              Machine learning continuously improves these capabilities. As more students use NewtonAI across 
              different subjects and learning styles, our models become better at identifying what makes study 
              materials effective. The system learns which types of flashcard questions lead to better retention, 
              which quiz formats are most engaging, and how to structure summaries for maximum clarity.
            </p>
            
            <p>
              We process content from diverse academic fields—from STEM subjects like physics and calculus to 
              humanities like history and literature. Our AI adapts its approach based on the subject matter, 
              recognizing that a biology textbook requires different treatment than a philosophy essay.
            </p>
          </div>
        </section>

        {/* 4-Step Process */}
        <section className="mb-20">
          <SectionHeader
            label="Simple Process"
            title="Our Simple 4-Step Process"
            description="From upload to mastery in four straightforward steps"
          />
          
          <div className="mt-12 space-y-8 max-w-4xl mx-auto">
            {processSteps.map((step) => (
              <div key={step.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {step.step}
                    </span>
                    <h3 className="text-xl font-semibold font-display">{step.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technology & Security */}
        <section className="mb-20">
          <SectionHeader
            label="Trust & Security"
            title="Built on Trusted Technology"
            description="Your data security and privacy are our top priorities"
          />
          
          <div className="mt-10 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Enterprise-Grade Security</h4>
                  <p className="text-sm text-muted-foreground">
                    All data is encrypted in transit and at rest using industry-standard AES-256 encryption. 
                    We never share your content with third parties.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Privacy-First Approach</h4>
                  <p className="text-sm text-muted-foreground">
                    Your study materials are processed securely and are never used to train our AI models. 
                    You retain full ownership of your content at all times.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Fast Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Our optimized infrastructure processes most documents in seconds, not minutes. 
                    Even lengthy textbooks are analyzed quickly so you can start studying sooner.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="prose prose-sm dark:prose-invert">
              <p>
                NewtonAI is built on modern, scalable cloud infrastructure that ensures reliability and 
                performance. We use state-of-the-art AI models that have been fine-tuned specifically 
                for educational content processing.
              </p>
              <p>
                Our commitment to security extends beyond just encryption. We implement strict access 
                controls, regular security audits, and maintain compliance with data protection 
                regulations. Your uploaded documents are processed in isolated environments and 
                are automatically deleted after processing unless you choose to save them.
              </p>
              <p>
                We believe in transparency about how your data is handled. Our AI processes your 
                content to generate study materials, but this data is never retained for model 
                training purposes. What you upload stays yours—we're just here to help you learn 
                from it more effectively.
              </p>
            </div>
          </div>
        </section>

        {/* Why Students Choose NewtonAI */}
        <section className="mb-16">
          <SectionHeader
            label="Why Choose Us"
            title="Why Students Choose NewtonAI"
            description="What makes our platform different from other study tools"
          />
          
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: BookOpen,
                title: "Education-Focused",
                description: "Unlike generic AI tools, NewtonAI is designed specifically for learning. Every feature is optimized for educational outcomes."
              },
              {
                icon: Users,
                title: "For All Learning Styles",
                description: "Whether you learn best through reading, listening, or visual diagrams, we have tools that match your preferred style."
              },
              {
                icon: CheckCircle2,
                title: "Proven Techniques",
                description: "Our tools are built on research-backed learning methods like spaced repetition and active recall."
              }
            ].map((item, index) => (
              <div key={index} className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold font-display mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-10 prose prose-lg dark:prose-invert max-w-3xl mx-auto text-center">
            <p>
              NewtonAI is designed to complement your education, not replace it. We believe AI should 
              enhance the learning experience by automating the creation of study materials so you can 
              focus on what matters most: understanding concepts and mastering subjects. Our tools help 
              you study smarter, but the learning and growth are entirely your own achievement.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20">
          <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
            Ready to Transform Your Study Experience?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of students who are already learning smarter with NewtonAI. 
            Start for free—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/auth">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HowItWorks;
