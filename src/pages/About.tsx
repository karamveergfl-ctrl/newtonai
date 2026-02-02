import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Brain, Users, Zap, Sparkles, ArrowRight, Shield, Heart, Code, GraduationCap, Mail, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const values = [
  {
    icon: Brain,
    title: "Innovation",
    description: "Constantly pushing the boundaries of what's possible in educational technology."
  },
  {
    icon: Users,
    title: "Accessibility",
    description: "Making powerful learning tools available to students everywhere."
  },
  {
    icon: BookOpen,
    title: "Quality",
    description: "Delivering accurate, reliable, and effective study materials."
  },
  {
    icon: Zap,
    title: "Efficiency",
    description: "Helping students learn more in less time with smart technology."
  },
];

const teamMembers = [
  {
    name: "The NewtonAI Team",
    role: "Founders & Developers",
    bio: "A passionate group of educators, engineers, and designers dedicated to making AI-powered learning accessible to all students.",
    avatar: "👨‍💻"
  },
  {
    name: "AI Content Team",
    role: "Educational Content",
    bio: "Educational specialists who ensure our AI produces accurate, pedagogically sound study materials across all subjects.",
    avatar: "📚"
  },
  {
    name: "Support Team",
    role: "Student Success",
    bio: "Dedicated to helping students get the most from our tools and responding to questions within 24 hours.",
    avatar: "💬"
  }
];

const About = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SEOHead
        title="About"
        description="Learn about NewtonAI's mission to revolutionize education through AI-powered study tools. We make learning accessible, efficient, and effective for everyone."
        canonicalPath="/about"
        breadcrumbs={breadcrumbs}
        keywords="about NewtonAI, AI education, study tools, learning platform"
      />
      
      {/* Static floating gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-32 w-80 h-80 bg-gradient-to-bl from-secondary/20 to-accent/10 rounded-full blur-3xl" />
      </div>
      
      <Header />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            <Sparkles className="w-4 h-4" />
            About NewtonAI
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Revolutionizing How You Learn
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            NewtonAI combines cutting-edge AI technology with proven learning methods 
            to help students achieve their academic goals faster and more effectively.
          </p>
        </section>

        {/* Our Story Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Our Story
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                NewtonAI was founded with a simple but powerful belief: every student deserves access to effective learning tools, regardless of their background or financial situation. We saw how traditional study methods were failing to keep up with the demands of modern education, and how expensive tutoring and study services were out of reach for many.
              </p>
              <p>
                Our team of educators and engineers came together to build something different—an AI-powered platform that could provide personalized study assistance at a fraction of the cost of human tutoring. We named our platform after Sir Isaac Newton, whose curiosity and dedication to learning transformed our understanding of the world.
              </p>
              <p>
                Today, NewtonAI helps thousands of students transform their study materials into flashcards, quizzes, summaries, podcasts, and more. We're proud to be making a difference in education and are constantly working to improve our tools based on student feedback.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="bg-muted/50 py-16 relative overflow-hidden">
          <div className="absolute top-40 -right-32 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-3xl font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe that every student deserves access to powerful learning tools. 
                Our mission is to democratize education by making AI-powered study assistance 
                available to everyone, regardless of their background or resources. We are committed
                to helping students study smarter, not harder, and to making learning more efficient,
                engaging, and accessible for all.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
            What Drives Us
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div key={value.title}>
                <Card className="h-full group cursor-pointer hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8 justify-center">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Meet Our Team
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {teamMembers.map((member) => (
                <Card key={member.name} className="text-center hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">{member.avatar}</div>
                    <h3 className="font-display font-semibold text-foreground mb-1">
                      {member.name}
                    </h3>
                    <p className="text-primary text-sm mb-3">{member.role}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {member.bio}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Our Approach Section */}
        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Code className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  How We Create Our Tools
                </h2>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Every feature we build starts with a simple question: "Will this help students learn more effectively?" Our development process combines the latest advances in AI with proven educational principles like spaced repetition, active recall, and multi-modal learning.
                </p>
                <p>
                  Our AI models are trained and fine-tuned specifically for educational content, ensuring that the flashcards, quizzes, and summaries we generate are pedagogically sound. We regularly review our outputs for accuracy and continuously improve our algorithms based on user feedback.
                </p>
                <p>
                  We believe in transparency: our tools are designed to help you understand material, not just get answers. That's why our homework helper provides step-by-step explanations, and our quiz generator includes detailed answer explanations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Data & Privacy Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Your Data & Privacy
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                We take your privacy seriously. All uploaded documents are encrypted in transit and at rest. We never share your personal information or study materials with third parties for advertising purposes. You maintain full control over your data and can delete it at any time.
              </p>
              <p>
                Our AI processes your content solely to generate study materials and improve your learning experience. We do not use your personal documents to train our models. For full details, please review our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center bg-muted/30 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4 justify-center">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                Get in Touch
              </h2>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Have questions, feedback, or suggestions? We'd love to hear from you. Our support team typically responds within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@newtonai.site"
                className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
              >
                <Mail className="w-4 h-4" />
                support@newtonai.site
              </a>
              <Link to="/contact">
                <Button variant="outline">Contact Form</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section - No ads on this page */}
        <section className="bg-primary text-primary-foreground py-16 relative overflow-hidden">
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students who are already using NewtonAI to ace their studies.
            </p>
            <div>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="shadow-lg">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;