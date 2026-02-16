import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { AdBanner } from "@/components/AdBanner";


const faqs = [
  {
    question: "What is NewtonAI?",
    answer: "NewtonAI is an AI-powered learning platform designed to help students study more effectively. You can upload PDFs, lecture notes, textbooks, or even images of handwritten notes, and our AI will generate flashcards, quizzes, summaries, mind maps, and podcasts. The platform uses proven learning science techniques — including spaced repetition, active recall, and multi-modal learning — to help you retain information faster and study smarter."
  },
  {
    question: "How does the AI flashcard generation work?",
    answer: "Our AI reads your uploaded documents and identifies key concepts, definitions, formulas, and important relationships. It then creates front-and-back flashcards optimized for active recall. You can choose the number of cards, difficulty level, and language. The flashcards support spaced repetition, which research shows can improve long-term retention by up to 200% compared to re-reading alone."
  },
  {
    question: "Can I use NewtonAI for free?",
    answer: "Yes! Our Free plan includes 20 educational videos/month, 3 flashcards/quizzes/mind maps each, 2 lecture notes & summaries, 1 AI podcast, 20 minutes of live transcription, 5 homework help questions per day, and 3 AI chat messages per day. No credit card is required. For higher limits and unlimited features, check out our Pro and Ultra plans."
  },
  {
    question: "What are the differences between Free, Pro, and Ultra plans?",
    answer: "Free plan has basic limits for all features — great for trying things out. Pro plan (most popular) offers 90 quizzes/flashcards/mind maps per month, 20 lecture notes/summaries, 15 podcasts, 900 minutes of transcription, and unlimited homework help & AI chat. Ultra plan provides truly unlimited access to every feature, priority support, and team collaboration. All paid plans are ad-free."
  },
  {
    question: "What file formats are supported?",
    answer: "We support PDF files, images (JPG, PNG, WEBP), and plain text. Our OCR feature can also read handwritten notes from photos. For YouTube-based learning, you can paste a video URL and we'll extract the transcript automatically. We're always working to add more formats."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. All uploaded files are encrypted in transit (TLS) and at rest. We never share your personal information or study materials with third parties. Your data is stored securely on enterprise-grade cloud infrastructure. You can delete your account and all associated data at any time from your profile settings."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time from your Profile page. Your premium access will continue until the end of your current billing period. There are no hidden fees, cancellation penalties, or lock-in contracts."
  },
  {
    question: "Do you offer student discounts?",
    answer: "Yes! We offer a 20% discount for students with a valid .edu email address. Contact our support team with your student email to receive your discount code. We also run seasonal promotions and occasionally offer free premium codes through our social channels."
  },
  {
    question: "Can I use NewtonAI on mobile devices?",
    answer: "Yes, NewtonAI is fully responsive and works great on smartphones and tablets. All features — including flashcards, quizzes, mind maps, and even podcast listening — are optimized for mobile. Study on the go, anywhere, anytime."
  },
  {
    question: "How accurate is the AI-generated content?",
    answer: "Our AI models are trained on millions of educational materials and academic papers. The generated flashcards, quizzes, and summaries are designed for accuracy and educational relevance. However, AI can occasionally make mistakes, so we always recommend cross-referencing generated content with your original materials and authoritative sources."
  },
  {
    question: "Can I share my study materials with classmates?",
    answer: "Team collaboration features are available on our Ultra plan. You can create study groups, share flashcard decks, and collaborate on study materials. Free and Pro users can export their generated content as text or PDF to share manually."
  },
  {
    question: "What are promotional codes and how do they work?",
    answer: "Promotional codes are special discount codes that reduce subscription costs. You can apply a code during checkout by clicking 'Have a promo code?' on the pricing page. Codes may have usage limits, expiration dates, and other restrictions. Each code can only be used once per account."
  },
  {
    question: "How does AI generate study content?",
    answer: "When you upload a document, our AI first extracts the text (using OCR for images). It then uses advanced language models to identify key topics, concepts, and relationships within the content. Depending on the tool you choose, it structures this information into flashcards (question/answer pairs), quiz questions (with correct answers and explanations), mind maps (hierarchical concept relationships), summaries (condensed overviews), or podcasts (conversational scripts). The AI is specifically tuned for educational content to maximize learning effectiveness."
  },
  {
    question: "What subjects does NewtonAI support?",
    answer: "NewtonAI works with any subject — from STEM fields like mathematics, physics, chemistry, and computer science to humanities like history, literature, and philosophy. It also supports professional subjects like law, medicine, business, and engineering. The AI adapts its output format and complexity based on the content you provide, making it equally effective for high school, undergraduate, and graduate-level materials."
  },
  {
    question: "How is NewtonAI different from ChatGPT for studying?",
    answer: "While ChatGPT is a general-purpose chatbot, NewtonAI is purpose-built for education. Key differences include: (1) Structured study outputs — flashcards, quizzes, mind maps, and podcasts, not just text responses; (2) Document understanding — upload PDFs, images, and notes directly; (3) Spaced repetition and progress tracking built in; (4) Multiple learning modalities (visual, auditory, active recall) in one platform; (5) Subject-specific accuracy tuning for educational content."
  },
  {
    question: "Is NewtonAI content accurate enough for exams?",
    answer: "NewtonAI generates high-quality study aids that are excellent for exam preparation. Our AI is specifically tuned for educational accuracy. However, all AI-generated content should be treated as a study aid — we recommend verifying important facts against your textbook or lecture slides. The platform includes a disclaimer on all generated content to remind users of this best practice."
  },
  {
    question: "How does the free plan work with ads?",
    answer: "Free plan users see occasional, non-intrusive banner ads within the platform. Ads are never placed over study content, never interrupt your workflow with popups, and never auto-play audio or video. Our ad placement follows Google AdSense policies and is designed to be respectful of your study experience. Upgrading to Pro or Ultra removes all ads entirely."
  },
  {
    question: "Can NewtonAI revoke my promotional premium access?",
    answer: "Yes. NewtonAI reserves the right to terminate promotional access if: you violate the Terms of Service, the code was obtained fraudulently, or the promotional campaign ends. We'll notify you before making any changes to your access."
  }
];

const FAQ = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "FAQ", href: "/faq" },
  ];

  // Generate FAQPage structured data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="FAQ"
        description="Find answers to common questions about NewtonAI - the AI-powered learning platform for students. Learn about pricing, features, and more."
        canonicalPath="/faq"
        breadcrumbs={breadcrumbs}
        keywords="NewtonAI FAQ, AI study tools questions, flashcard generator help"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      <Header />

      <main className="container mx-auto px-4 py-10">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Find answers to common questions about NewtonAI. Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline font-display font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 p-8 bg-muted/50 rounded-2xl max-w-2xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">Still have questions?</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Our support team is here to help. Get in touch and we'll respond within 24 hours.
          </p>
          <Link to="/contact">
            <Button size="lg">Contact Support</Button>
          </Link>
        </div>

        {/* Single Ad Banner - After CTA (reduced from 2 to 1) */}
        <AdBanner className="max-w-3xl mx-auto" />
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
