import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { blogPosts, BlogPost as BlogPostType } from "./Blog";

// Blog post content - in a real app, this would come from a CMS
const blogContent: Record<string, { content: string }> = {
  "how-to-study-smarter-using-ai": {
    content: `
## Introduction

Artificial Intelligence is revolutionizing how students approach learning. Gone are the days of passive reading and ineffective highlighting. Today's AI-powered study tools can help you learn more effectively in less time.

## The Power of AI in Education

AI study assistants like NewtonAI can analyze your learning materials and generate personalized study resources:

### 1. Smart Flashcard Generation

Instead of spending hours creating flashcards manually, AI can analyze your PDFs, notes, or videos and automatically generate effective flashcards that focus on key concepts.

### 2. Adaptive Quiz Creation

AI-generated quizzes adapt to your knowledge level, focusing more on areas where you need improvement while reinforcing concepts you've already mastered.

### 3. Intelligent Summarization

Long textbooks and research papers can be condensed into concise summaries that capture the essential information without losing important details.

## Getting Started with AI Study Tools

1. **Upload your study materials** - PDFs, videos, or even handwritten notes
2. **Choose your study mode** - flashcards, quizzes, summaries, or mind maps
3. **Study actively** - use active recall techniques with AI-generated content
4. **Track your progress** - monitor your learning and adjust your approach

## Conclusion

AI study tools aren't meant to replace learning - they're designed to enhance it. By leveraging AI to handle the tedious parts of studying, you can focus your energy on understanding and applying concepts.

Ready to study smarter? [Try NewtonAI free today](/auth).
    `,
  },
  "pdf-vs-video-learning-which-is-better": {
    content: `
## The Great Learning Debate

Every student has preferences when it comes to learning materials. Some swear by textbooks and PDFs, while others prefer video content. But which approach is actually more effective?

## The Case for PDF Learning

### Advantages

- **Self-paced reading** - Control your own speed
- **Easy annotation** - Highlight, underline, and add notes
- **Reference-friendly** - Quick to search and review
- **No distractions** - No autoplay or recommendations

### Disadvantages

- Can be dry and less engaging
- Complex concepts may need visual demonstration
- Eye strain from extended reading

## The Case for Video Learning

### Advantages

- **Visual demonstrations** - See concepts in action
- **Engaging format** - More entertaining than text
- **Multi-sensory** - Combines visual and auditory learning
- **Pause and rewind** - Control playback

### Disadvantages

- Fixed pacing may not match your speed
- Harder to skim for specific information
- Can be distracting with related content

## The Verdict: It Depends

The best format depends on:
- Your learning style
- The subject matter
- Your study goals

## Best of Both Worlds

Why choose when you can have both? NewtonAI can extract content from both PDFs and YouTube videos, creating unified study materials that combine the best of both formats.

[Start learning with NewtonAI](/auth)
    `,
  },
  "how-ai-helps-solve-numericals-faster": {
    content: `
## The Challenge of Numerical Problems

Physics, chemistry, and math problems often intimidate students. Complex formulas, multiple steps, and easy-to-miss details make numerical problems one of the most challenging aspects of STEM education.

## How AI Transforms Problem-Solving

### Step-by-Step Breakdown

AI doesn't just give you the answer - it shows you exactly how to get there. Each step is explained clearly, helping you understand the logic behind the solution.

### Pattern Recognition

After solving multiple problems, you'll start recognizing patterns. AI helps accelerate this by presenting similar problems and highlighting common approaches.

### Error Identification

Made a mistake somewhere? AI can identify where your calculation went wrong and explain the correct approach.

## Practical Tips for Using AI in Problem-Solving

1. **Try the problem first** - Attempt it yourself before asking for help
2. **Study the solution steps** - Don't just copy; understand each step
3. **Practice similar problems** - Use AI-generated quizzes to reinforce learning
4. **Create reference sheets** - Use AI summaries to create formula sheets

## Real-World Applications

Students using AI-assisted problem-solving report:
- 40% faster homework completion
- Better understanding of underlying concepts
- Improved exam performance

## Start Solving Smarter

Upload a photo of your numerical problem to NewtonAI and get an instant step-by-step solution.

[Try Homework Help](/tools/homework-help)
    `,
  },
  "active-recall-technique-guide": {
    content: `
## What is Active Recall?

Active recall is a learning technique that involves actively stimulating your memory during the learning process. Instead of passively reading or watching, you test yourself on the material.

## The Science Behind Active Recall

Research shows that active recall is one of the most effective study techniques:

- **Strengthens neural pathways** - Testing yourself creates stronger memory connections
- **Identifies knowledge gaps** - You quickly discover what you don't know
- **Improves long-term retention** - Information is stored more permanently

## How to Practice Active Recall

### 1. Flashcards

The classic active recall method. Cover the answer and try to recall it before checking.

### 2. Self-Testing

After reading a section, close the book and try to write down everything you remember.

### 3. The Feynman Technique

Explain the concept as if teaching someone else. If you struggle, you've found a gap in your understanding.

### 4. Practice Problems

Don't just read example solutions - attempt problems yourself first.

## Combining Active Recall with Spaced Repetition

For maximum effectiveness, combine active recall with spaced repetition - reviewing material at increasing intervals.

## AI-Enhanced Active Recall

NewtonAI automates the active recall process by:
- Generating flashcards from your study materials
- Creating quizzes to test your knowledge
- Tracking your progress and focusing on weak areas

[Generate flashcards now](/tools/flashcards)
    `,
  },
  "mind-mapping-for-students": {
    content: `
## What is Mind Mapping?

A mind map is a visual representation of information that starts with a central concept and branches out to related ideas. It's a powerful tool for organizing complex topics.

## Benefits of Mind Mapping

### Visual Organization

Mind maps help you see the big picture and understand how different concepts connect.

### Better Memory

The visual nature of mind maps makes information easier to remember than linear notes.

### Creative Thinking

The non-linear format encourages creative connections between ideas.

### Quick Review

A well-made mind map can help you review an entire topic in minutes.

## How to Create an Effective Mind Map

1. **Start with the central topic** - Place it in the middle of the page
2. **Add main branches** - These are your key subtopics
3. **Extend with details** - Add smaller branches for specifics
4. **Use colors and images** - Visual elements improve recall
5. **Keep it simple** - Use keywords, not sentences

## Digital vs Hand-Drawn Mind Maps

Both have their place:
- **Hand-drawn** - More personal, better for memory
- **Digital** - Easier to edit, share, and expand

## AI-Generated Mind Maps

NewtonAI can automatically generate mind maps from your study materials:
- Upload a PDF or video
- AI extracts key concepts and relationships
- Get an interactive, expandable mind map

This saves hours of manual work while still giving you a visual overview of the material.

[Create a mind map now](/tools/mind-map)
    `,
  },
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const post = blogPosts.find(p => p.slug === slug);
  const content = slug ? blogContent[slug] : null;

  if (!post || !content) {
    return <Navigate to="/blog" replace />;
  }

  const postIndex = blogPosts.findIndex(p => p.slug === slug);
  const prevPost = postIndex > 0 ? blogPosts[postIndex - 1] : null;
  const nextPost = postIndex < blogPosts.length - 1 ? blogPosts[postIndex + 1] : null;

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: post.title, href: `/blog/${slug}` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={post.title}
        description={post.description}
        canonicalPath={`/blog/${slug}`}
        breadcrumbs={breadcrumbs}
        type="article"
        keywords={`${post.category}, study tips, AI learning, education`}
        article={{
          publishedTime: post.publishedDate,
          section: post.category,
        }}
      />
      
      <Header />

      <article className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Back link */}
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Badge variant="secondary" className="mb-4">
            {post.category}
          </Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            {post.title}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {post.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(post.publishedDate).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </span>
          </div>
        </motion.header>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="prose prose-lg dark:prose-invert max-w-none"
        >
          {content.content.split('\n').map((paragraph, index) => {
            if (paragraph.startsWith('## ')) {
              return <h2 key={index} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
            }
            if (paragraph.startsWith('### ')) {
              return <h3 key={index} className="text-xl font-semibold mt-6 mb-3">{paragraph.replace('### ', '')}</h3>;
            }
            if (paragraph.startsWith('- **')) {
              const match = paragraph.match(/- \*\*(.+?)\*\* - (.+)/);
              if (match) {
                return (
                  <p key={index} className="my-2">
                    <strong>{match[1]}</strong> - {match[2]}
                  </p>
                );
              }
            }
            if (paragraph.startsWith('- ')) {
              return <li key={index} className="ml-4">{paragraph.replace('- ', '')}</li>;
            }
            if (paragraph.startsWith('1. ') || paragraph.startsWith('2. ') || paragraph.startsWith('3. ') || paragraph.startsWith('4. ')) {
              return <li key={index} className="ml-4">{paragraph.replace(/^\d\. /, '')}</li>;
            }
            if (paragraph.includes('[') && paragraph.includes('](')) {
              const match = paragraph.match(/\[(.+?)\]\((.+?)\)/);
              if (match) {
                const beforeLink = paragraph.substring(0, paragraph.indexOf('['));
                const afterLink = paragraph.substring(paragraph.indexOf(')') + 1);
                return (
                  <p key={index} className="my-4">
                    {beforeLink}
                    <Link to={match[2]} className="text-primary hover:underline">{match[1]}</Link>
                    {afterLink}
                  </p>
                );
              }
            }
            if (paragraph.trim()) {
              return <p key={index} className="my-4">{paragraph}</p>;
            }
            return null;
          })}
        </motion.div>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex justify-between gap-4">
            {prevPost ? (
              <Link to={`/blog/${prevPost.slug}`} className="flex-1">
                <Button variant="outline" className="w-full justify-start">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="truncate">{prevPost.title}</span>
                </Button>
              </Link>
            ) : <div className="flex-1" />}
            {nextPost ? (
              <Link to={`/blog/${nextPost.slug}`} className="flex-1">
                <Button variant="outline" className="w-full justify-end">
                  <span className="truncate">{nextPost.title}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : <div className="flex-1" />}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 p-8 bg-primary/5 rounded-xl text-center">
          <h3 className="text-xl font-semibold mb-2">Ready to study smarter?</h3>
          <p className="text-muted-foreground mb-4">
            Try NewtonAI's AI-powered study tools for free.
          </p>
          <Button asChild>
            <Link to="/auth">Get Started Free</Link>
          </Button>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;
