import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Brain, Users, Zap, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { NativeAdBanner } from "@/components/NativeAdBanner";

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
                available to everyone, regardless of their background or resources.
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


        {/* Single Native Ad - Scroll triggered */}
        <NativeAdBanner />

        {/* CTA Section */}
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