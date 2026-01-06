import { motion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { StarRating } from "./StarRating";

interface Testimonial {
  id: string;
  content: string;
  author: string;
  role: string;
  avatar?: string;
  rating: number;
}

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
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export const TestimonialsSection = () => {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <SectionHeader
          label="Testimonials"
          title="What Our Users Say"
          description="Join thousands of students who've transformed their learning experience"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              variants={cardVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-lg transition-shadow duration-300"
            >
              <StarRating rating={testimonial.rating} size="md" />

              <blockquote className="mt-4 mb-6">
                <p className="text-muted-foreground italic leading-relaxed">
                  "{testimonial.content}"
                </p>
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-lg">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
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
      </div>
    </section>
  );
};

export default TestimonialsSection;
