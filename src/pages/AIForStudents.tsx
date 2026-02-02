import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  GraduationCap,
  Eye,
  Headphones,
  BookOpen,
  Clock,
  Target,
  Shield,
  Lightbulb,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "AI for Students", href: "/ai-for-students" },
];

const learningStyles = [
  {
    icon: Eye,
    title: "Visual Learners",
    description: "If you learn best by seeing information presented visually, NewtonAI offers mind maps and flashcards that organize concepts into visual formats. Mind maps help you see how topics connect, while flashcards with clear formatting make information scannable and memorable.",
    tools: ["Mind Maps", "Flashcards", "Summaries"]
  },
  {
    icon: Headphones,
    title: "Auditory Learners",
    description: "For those who absorb information best through listening, our AI Podcast feature transforms your study materials into audio content. Listen to your notes during commutes, workouts, or while doing chores. Lecture transcription also helps you revisit spoken content in written form.",
    tools: ["AI Podcasts", "Lecture Notes", "Text-to-Speech"]
  },
  {
    icon: BookOpen,
    title: "Reading/Writing Learners",
    description: "If you prefer reading and taking notes, our summarization and note-taking tools are perfect for you. Get concise written summaries of lengthy materials, structured lecture notes, and detailed explanations through our homework help feature.",
    tools: ["Summaries", "Lecture Notes", "PDF Chat"]
  }
];

const usagePatterns = [
  {
    title: "Before Class",
    description: "Upload assigned readings and generate a quick summary to get an overview before the lecture. Use mind maps to visualize the main topics you'll be covering."
  },
  {
    title: "During Class",
    description: "Use live transcription to capture lecture content automatically. Focus on understanding rather than frantically taking notes."
  },
  {
    title: "After Class",
    description: "Generate flashcards from lecture notes for daily review. Create quizzes to test your understanding while the material is fresh."
  },
  {
    title: "Exam Prep",
    description: "Review all generated materials. Use spaced repetition to reinforce weak areas. Take practice quizzes to simulate exam conditions."
  }
];

const AIForStudents = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="AI for Students"
        description="Discover how NewtonAI's AI study tools are designed specifically for students. Adapt to your learning style, study smarter, and achieve academic success."
        canonicalPath="/ai-for-students"
        breadcrumbs={breadcrumbs}
        keywords="AI for students, student study tools, learning styles, academic success, AI education"
      />
      
      <Header />
      
      <main className="container mx-auto px-4 py-12 sm:py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            <GraduationCap className="w-4 h-4" />
            Built for Students
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-6">
            AI Study Tools Designed for Students
          </h1>
          
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            NewtonAI was built with students in mind. Every feature is designed to help you 
            learn more effectively, retain information longer, and achieve your academic goals—
            all while respecting your unique learning style and schedule.
          </p>
        </div>

        {/* Why Students Need AI Tools */}
        <section className="mb-20">
          <SectionHeader
            label="The Challenge"
            title="Why Modern Students Need AI Assistance"
            description="Today's students face unique challenges that AI can help address"
          />
          
          <div className="mt-10 prose prose-lg dark:prose-invert max-w-4xl mx-auto">
            <p>
              Students today are navigating an unprecedented volume of information. Between textbooks, 
              research papers, online resources, lecture recordings, and class notes, the sheer amount 
              of content to process can be overwhelming. Traditional study methods—manually creating 
              flashcards, writing summaries by hand, organizing notes—consume valuable time that could 
              be spent actually learning.
            </p>
            
            <p>
              Time management is another critical challenge. Between classes, assignments, extracurricular 
              activities, and personal responsibilities, finding enough hours for effective study sessions 
              is difficult. Students need tools that maximize the efficiency of every study minute, not 
              more work to prepare for studying.
            </p>
            
            <p>
              Additionally, every student learns differently. Some absorb information best through 
              visual diagrams, others through listening, and still others through reading and writing. 
              A one-size-fits-all approach to study materials doesn't serve everyone equally. Students 
              need flexible tools that adapt to their preferred learning style.
            </p>
            
            <p>
              AI-powered study tools address all these challenges. They automate the time-consuming 
              task of creating study materials, freeing you to focus on understanding and retention. 
              They offer multiple output formats to match different learning preferences. And they 
              work as fast as you do—upload content and have study materials ready in seconds.
            </p>
          </div>
        </section>

        {/* Learning Styles */}
        <section className="mb-20">
          <SectionHeader
            label="Personalized Learning"
            title="AI That Adapts to How You Learn"
            description="Different tools for different learning preferences"
          />
          
          <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {learningStyles.map((style, index) => (
              <div 
                key={index}
                className="p-6 rounded-xl border border-border bg-card"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                  <style.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-display mb-3">{style.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {style.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {style.tools.map((tool) => (
                    <span 
                      key={tool}
                      className="px-2 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Success Patterns */}
        <section className="mb-20">
          <SectionHeader
            label="Study Strategies"
            title="How Students Use NewtonAI Effectively"
            description="Proven patterns for integrating AI tools into your study routine"
          />
          
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden md:block" />
              
              <div className="space-y-8">
                {usagePatterns.map((pattern, index) => (
                  <div key={index} className="flex gap-6 relative">
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 z-10">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 pb-4">
                      <h4 className="text-lg font-semibold font-display mb-2">{pattern.title}</h4>
                      <p className="text-muted-foreground">{pattern.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-10 bg-muted/50 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-semibold mb-1">Pro Tip: Consistency Over Intensity</h5>
                  <p className="text-sm text-muted-foreground">
                    Research shows that shorter, regular study sessions are more effective than long 
                    cramming sessions. Use NewtonAI's spaced repetition features to build sustainable 
                    study habits with just 15-20 minutes of flashcard review daily.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Academic Integrity */}
        <section className="mb-20">
          <SectionHeader
            label="Responsible Use"
            title="Using AI Responsibly in Education"
            description="AI as a study aid, not a shortcut"
          />
          
          <div className="mt-10 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="prose prose-sm dark:prose-invert">
                <p>
                  NewtonAI is designed to enhance your learning, not replace it. Our tools help you 
                  study more effectively, but the understanding and knowledge you gain are entirely 
                  your own achievement.
                </p>
                <p>
                  We believe AI should be used ethically in education. That means using our tools to 
                  prepare for assessments, not to complete them. It means using generated study materials 
                  to deepen your understanding, not to avoid engaging with course content.
                </p>
                <p>
                  Academic integrity matters. Always follow your institution's policies regarding AI 
                  tool usage. When in doubt, ask your instructor about appropriate use of study aids.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm"><strong>DO:</strong> Use flashcards and quizzes to prepare for exams</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm"><strong>DO:</strong> Generate summaries to review course material</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm"><strong>DO:</strong> Use homework help to learn problem-solving methods</p>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm"><strong>VERIFY:</strong> Always double-check AI outputs against course materials</p>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm"><strong>GOAL:</strong> Use AI to learn, not to avoid learning</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <Link 
                to="/guides/responsible-ai-use"
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                Read our full Responsible AI Use Guide
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="mb-16">
          <SectionHeader
            label="Quick Start"
            title="Start Your AI-Powered Study Journey"
            description="Getting started with NewtonAI takes just minutes"
          />
          
          <div className="mt-10 max-w-3xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  1
                </div>
                <h4 className="font-semibold mb-2">Create Account</h4>
                <p className="text-sm text-muted-foreground">Sign up for free—no credit card required</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  2
                </div>
                <h4 className="font-semibold mb-2">Upload Content</h4>
                <p className="text-sm text-muted-foreground">Add your first PDF, notes, or lecture recording</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  3
                </div>
                <h4 className="font-semibold mb-2">Generate & Study</h4>
                <p className="text-sm text-muted-foreground">Create flashcards, quizzes, and more instantly</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20">
          <h2 className="text-2xl sm:text-3xl font-bold font-display mb-4">
            Join Thousands of Students
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Students at universities worldwide are already studying smarter with NewtonAI. 
            Start for free and see the difference AI-powered tools can make.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/auth">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/features">Explore Features</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default AIForStudents;
