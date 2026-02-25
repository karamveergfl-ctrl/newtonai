import { SectionHeader } from "./SectionHeader";
import { StarRating } from "./StarRating";
import { Users, FileText, Brain, Clock } from "lucide-react";

interface Testimonial {
  id: string;
  content: string;
  author: string;
  role: string;
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

export const TestimonialsSection = () => {
  return (
    <section className="py-16 md:py-20 lg:py-24 px-4 bg-muted/30 relative overflow-hidden border-t border-border/30">
      {/* Static background decorations */}
      <div className="absolute top-40 -right-32 w-72 h-72 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-64 h-64 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto relative z-10">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-20">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card/80 backdrop-blur-sm rounded-xl p-5 md:p-6 border border-border/50 text-center group cursor-default hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-200"
            >
              <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-background flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <SectionHeader
          label="Testimonials"
          title="Loved by Students Everywhere"
          description="See what our community has to say about their learning experience"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-12">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-card rounded-xl p-5 md:p-6 shadow-sm border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <StarRating rating={testimonial.rating} size="md" />
                <span className="text-2xl opacity-20 group-hover:opacity-40 transition-opacity">
                  "
                </span>
              </div>

              <blockquote className="mb-6">
                <p className="text-muted-foreground leading-relaxed">
                  "{testimonial.content}"
                </p>
              </blockquote>

              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-lg">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges - Static University Logos */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm mb-6">Trusted by students from</p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {[
              { name: "Stanford", shortName: "S", color: "from-red-600 to-red-800" },
              { name: "MIT", shortName: "MIT", color: "from-red-700 to-gray-800" },
              { name: "Harvard", shortName: "H", color: "from-red-800 to-red-950" },
              { name: "Oxford", shortName: "Ox", color: "from-blue-700 to-blue-900" },
              { name: "Berkeley", shortName: "Cal", color: "from-blue-600 to-amber-500" },
              { name: "IIT", shortName: "IIT", color: "from-blue-600 to-blue-800" },
              { name: "IIM", shortName: "IIM", color: "from-emerald-600 to-emerald-800" },
              { name: "AIIMS", shortName: "A", color: "from-teal-500 to-teal-700" },
            ].map((uni) => (
              <div
                key={uni.name}
                className="group cursor-default"
              >
                <div className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-gradient-to-r ${uni.color} shadow-lg shadow-black/20 border border-white/10 transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 group-hover:-translate-y-0.5`}>
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-[10px] md:text-xs font-bold text-white">{uni.shortName}</span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-white">{uni.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;