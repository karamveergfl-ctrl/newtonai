import { motion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { StarRating } from "./StarRating";
import { Users, FileText, Brain, Clock } from "lucide-react";

interface Testimonial {
  id: string;
  content: string;
  author: string;
  role: string;
  avatar?: string;
  rating: number;
}

interface Stat {
  icon: typeof Users;
  value: string;
  label: string;
  color: string;
}

const stats: Stat[] = [
  { icon: Users, value: "12K+", label: "Active Students", color: "text-blue-500" },
  { icon: FileText, value: "85K+", label: "Documents Processed", color: "text-green-500" },
  { icon: Brain, value: "250K+", label: "Flashcards Created", color: "text-purple-500" },
  { icon: Clock, value: "15K+", label: "Hours Saved", color: "text-orange-500" },
];

const testimonials: Testimonial[] = [
  {
    id: "1",
    content:
      "NewtonAI transformed how I study. The AI-powered flashcards and summaries save me hours every week. My grades have improved significantly!",
    author: "Sarah Chen",
    role: "Medical Student",
    rating: 5,
  },
  {
    id: "2",
    content:
      "The homework help feature is incredible. It doesn't just give answers - it explains concepts step by step. Perfect for understanding complex topics.",
    author: "James Wilson",
    role: "High School Senior",
    rating: 5,
  },
  {
    id: "3",
    content:
      "I use the PDF summarizer daily for my research papers. It extracts key points accurately and the mind map feature helps visualize connections.",
    author: "Dr. Emily Rodriguez",
    role: "PhD Researcher",
    rating: 5,
  },
  {
    id: "4",
    content:
      "The quiz generator helped me ace my finals! I love how it creates questions based on my weak areas. Truly personalized learning.",
    author: "Marcus Thompson",
    role: "Engineering Student",
    rating: 5,
  },
  {
    id: "5",
    content:
      "As a teacher, I recommend NewtonAI to all my students. The mind maps make complex topics so much easier to understand and remember.",
    author: "Lisa Park",
    role: "High School Teacher",
    rating: 5,
  },
  {
    id: "6",
    content:
      "The video summarizer is a game-changer for online courses. I can review 2-hour lectures in minutes. Best study tool I've ever used!",
    author: "Alex Rivera",
    role: "Online Learner",
    rating: 5,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, rotateX: -10 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.6,
      type: "spring" as const,
      stiffness: 100,
    },
  },
};

const statVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      type: "spring" as const,
      stiffness: 150,
    },
  },
};

export const TestimonialsSection = () => {
  return (
    <section className="py-24 px-4 bg-muted/30 relative overflow-hidden">
      {/* Background decorations */}
      <motion.div
        className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-bl from-secondary/10 to-transparent blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="container mx-auto relative z-10">
        {/* Stats Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={statVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 text-center group cursor-default"
            >
              <motion.div
                className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-background flex items-center justify-center ${stat.color}`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <stat.icon className="w-6 h-6" />
              </motion.div>
              <motion.div
                className="text-3xl md:text-4xl font-bold text-foreground mb-1"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <SectionHeader
          label="Testimonials"
          title="Loved by Students Everywhere"
          description="See what our community has to say about their learning experience"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              variants={cardVariants}
              whileHover={{ 
                y: -8, 
                rotateX: 5,
                rotateY: index % 2 === 0 ? 3 : -3,
                boxShadow: "0 20px 40px -15px hsl(var(--primary) / 0.15)"
              }}
              style={{ transformStyle: "preserve-3d", perspective: 1000 }}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:border-primary/30 transition-colors duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <StarRating rating={testimonial.rating} size="md" />
                <motion.div
                  className="text-2xl opacity-20 group-hover:opacity-40 transition-opacity"
                  initial={{ rotate: 0 }}
                  whileHover={{ rotate: 15, scale: 1.2 }}
                >
                  "
                </motion.div>
              </div>

              <blockquote className="mb-6">
                <p className="text-muted-foreground leading-relaxed">
                  "{testimonial.content}"
                </p>
              </blockquote>

              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <motion.div 
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-lg"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {testimonial.author.charAt(0)}
                </motion.div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground text-sm mb-4">Trusted by students from</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {["Stanford", "MIT", "Harvard", "Oxford", "Berkeley"].map((school, index) => (
              <motion.span
                key={school}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="text-lg font-semibold text-muted-foreground"
              >
                {school}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
