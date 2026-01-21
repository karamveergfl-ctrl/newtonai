import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Brain, Users, Zap, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { OptimizedBackgroundBlobs } from "@/components/OptimizedBackgroundBlobs";

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
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Optimized floating gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <OptimizedBackgroundBlobs variant="hero" />
      </div>
      
      <Header />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20"
          >
            <Sparkles className="w-4 h-4" />
            About NewtonAI
          </motion.div>
          
          <motion.h1 
            className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Revolutionizing How You Learn
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            NewtonAI combines cutting-edge AI technology with proven learning methods 
            to help students achieve their academic goals faster and more effectively.
          </motion.p>
        </section>

        {/* Mission Section */}
        <section className="bg-muted/50 py-16 relative overflow-hidden">
          <OptimizedBackgroundBlobs variant="minimal" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-3xl font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe that every student deserves access to powerful learning tools. 
                Our mission is to democratize education by making AI-powered study assistance 
                available to everyone, regardless of their background or resources.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 py-16">
          <motion.h2 
            className="font-display text-3xl font-bold text-foreground text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            What Drives Us
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <Card className="h-full group cursor-pointer hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 gpu-accelerated">
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
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-primary-foreground py-16 relative overflow-hidden">
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.h2 
              className="font-display text-3xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Ready to Transform Your Learning?
            </motion.h2>
            <motion.p 
              className="text-lg opacity-90 mb-8 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              Join thousands of students who are already using NewtonAI to ace their studies.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="shadow-lg">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;