import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { OptimizedBackgroundBlobs } from "@/components/OptimizedBackgroundBlobs";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  publishedDate: string;
  image?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-study-smarter-using-ai",
    title: "How to Study Smarter Using AI",
    description: "Discover how artificial intelligence can transform your study habits and help you learn more effectively in less time.",
    category: "Study Tips",
    readTime: "5 min read",
    publishedDate: "2026-01-15",
  },
  {
    slug: "pdf-vs-video-learning-which-is-better",
    title: "PDF vs Video Learning: Which is Better?",
    description: "Compare the pros and cons of PDF-based learning versus video content to find the best approach for your learning style.",
    category: "Learning Methods",
    readTime: "7 min read",
    publishedDate: "2026-01-10",
  },
  {
    slug: "how-ai-helps-solve-numericals-faster",
    title: "How AI Helps Solve Numericals Faster",
    description: "Learn how AI-powered tools can break down complex numerical problems into step-by-step solutions you can understand.",
    category: "AI Tools",
    readTime: "6 min read",
    publishedDate: "2026-01-05",
  },
  {
    slug: "active-recall-technique-guide",
    title: "The Complete Guide to Active Recall",
    description: "Master the science-backed study technique that helps you remember more with flashcards and self-testing.",
    category: "Study Tips",
    readTime: "8 min read",
    publishedDate: "2025-12-28",
  },
  {
    slug: "mind-mapping-for-students",
    title: "Mind Mapping for Students: A Visual Learning Guide",
    description: "Explore how mind maps can help you organize complex topics and boost your understanding of difficult subjects.",
    category: "Learning Methods",
    readTime: "5 min read",
    publishedDate: "2025-12-20",
  },
];

const Blog = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog"
        description="Explore study tips, learning methods, and AI tools to help you learn faster and study smarter. Get insights from NewtonAI's education experts."
        canonicalPath="/blog"
        breadcrumbs={breadcrumbs}
        keywords="study tips, AI learning, flashcards, active recall, mind mapping, education technology"
      />
      
      <Header />

      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <OptimizedBackgroundBlobs variant="minimal" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4">Blog</Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              Study Tips & AI Insights
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Learn how to study smarter with AI-powered tools and proven learning techniques.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={`/blog/${post.slug}`}>
                <Card className="h-full group cursor-pointer hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {post.category}
                      </Badge>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {post.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(post.publishedDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.readTime}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
