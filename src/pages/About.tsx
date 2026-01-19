import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Brain, Users, Zap, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
      {/* Floating gradient blobs */}
      <motion.div
        className="fixed top-40 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 blur-3xl pointer-events-none"
        animate={{
          x: [0, 40, 0],
          y: [0, 30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed top-20 -right-32 w-80 h-80 rounded-full bg-gradient-to-bl from-secondary/20 to-accent/10 blur-3xl pointer-events-none"
        animate={{
          x: [0, -30, 0],
          y: [0, 40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="fixed bottom-40 left-1/3 w-72 h-72 rounded-full bg-gradient-to-tr from-accent/15 to-primary/10 blur-3xl pointer-events-none"
        animate={{
          x: [0, 20, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      
      <Header />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            About NewtonAI
          </motion.div>
          
          <motion.h1 
            className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Revolutionizing How You Learn
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            NewtonAI combines cutting-edge AI technology with proven learning methods 
            to help students achieve their academic goals faster and more effectively.
          </motion.p>
        </section>

        {/* Mission Section */}
        <section className="bg-muted/50 py-16 relative overflow-hidden">
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-bl from-primary/10 to-transparent blur-2xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div 
              className="max-w-3xl mx-auto text-center"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <motion.h2 
                className="font-display text-3xl font-bold text-foreground mb-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                Our Mission
              </motion.h2>
              <motion.p 
                className="text-lg text-muted-foreground leading-relaxed"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                We believe that every student deserves access to powerful learning tools. 
                Our mission is to democratize education by making AI-powered study assistance 
                available to everyone, regardless of their background or resources.
              </motion.p>
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
          >
            What Drives Us
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 40, rotateX: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -8, 
                  scale: 1.03,
                  rotateX: 5,
                  rotateY: 5,
                }}
                style={{ transformStyle: "preserve-3d", perspective: 1000 }}
              >
                <Card className="h-full group cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6 text-center">
                    <motion.div 
                      className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <value.icon className="h-6 w-6 text-primary" />
                    </motion.div>
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
          {/* Animated background elements */}
          <motion.div
            className="absolute top-0 left-0 w-full h-full"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/5 blur-2xl"
              animate={{ scale: [1, 1.3, 1], x: [0, 20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl"
              animate={{ scale: [1, 1.2, 1], y: [0, -20, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </motion.div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.h2 
              className="font-display text-3xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Ready to Transform Your Learning?
            </motion.h2>
            <motion.p 
              className="text-lg opacity-90 mb-8 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Join thousands of students who are already using NewtonAI to ace their studies.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="shadow-lg">
                  Get Started Free
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </motion.span>
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