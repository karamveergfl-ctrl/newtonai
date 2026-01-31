import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";


const faqs = [
  {
    question: "What is NewtonAI?",
    answer: "NewtonAI is an AI-powered learning platform that helps students study more effectively. Upload your PDFs, lecture notes, or textbooks, and our AI will generate flashcards, quizzes, summaries, mind maps, and podcasts to help you learn faster."
  },
  {
    question: "How does the AI flashcard generation work?",
    answer: "Our AI analyzes your uploaded documents and identifies key concepts, definitions, and important information. It then automatically creates flashcards that you can use for spaced repetition learning, proven to be one of the most effective study methods."
  },
  {
    question: "Can I use NewtonAI for free?",
    answer: "Yes! Our Free plan includes 20 educational videos/month, 3 flashcards/quizzes/mind maps each, 2 lecture notes & summaries, 1 AI podcast, 20 minutes of live transcription, 5 homework help questions per day, and 3 AI chat messages per day. For higher limits and unlimited features, check out our Pro and Ultra plans."
  },
  {
    question: "What are the differences between Free, Pro, and Ultra plans?",
    answer: "Free plan has basic limits for all features. Pro plan offers 90 quizzes/flashcards/mind maps per month, 20 lecture notes/summaries, 15 podcasts, 900 minutes of transcription, and unlimited homework help & AI chat. Ultra plan provides unlimited access to all features plus team collaboration and dedicated support."
  },
  {
    question: "What file formats are supported?",
    answer: "We currently support PDF files, images (JPG, PNG), and can also process handwritten notes through our OCR feature. We're constantly working on adding support for more formats."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We take data security seriously. All uploaded files are encrypted in transit and at rest. We never share your personal information or study materials with third parties. You can delete your data at any time."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period. No hidden fees or cancellation penalties."
  },
  {
    question: "Do you offer student discounts?",
    answer: "Yes! We offer a 20% discount for students with a valid .edu email address. Contact our support team with your student email to get your discount code."
  },
  {
    question: "Can I use NewtonAI on mobile devices?",
    answer: "Yes, NewtonAI is fully responsive and works great on smartphones and tablets. Study on the go, anytime, anywhere."
  },
  {
    question: "How accurate is the AI-generated content?",
    answer: "Our AI is trained on millions of educational materials and provides highly accurate study aids. However, we always recommend reviewing generated content to ensure it meets your specific study needs."
  },
  {
    question: "Can I share my study materials with classmates?",
    answer: "Team collaboration features are available on our Ultra plan. You can create study groups, share flashcard decks, and collaborate on study materials with your classmates."
  },
  {
    question: "What are promotional codes and how do they work?",
    answer: "Promotional codes are special discount codes that can reduce subscription costs. You can apply a code during checkout by clicking 'Have a promo code?' on the pricing page. Codes may have usage limits, expiration dates, and other restrictions. Each code can only be used once per account."
  },
  {
    question: "What are 100% discount codes?",
    answer: "100% discount codes are special promotional codes that grant full premium access without payment. These codes are typically offered during special campaigns, to early adopters, or through partnerships. They provide the same features as paid subscriptions but are subject to promotional terms and may be revoked for policy violations."
  },
  {
    question: "Can I cancel my premium access obtained through a promotional code?",
    answer: "Yes, you can downgrade to the free tier at any time from your Profile settings. However, since no payment was made for promotional access, no refunds or compensation apply. Your premium features will remain active until you choose to downgrade or until the promotional period ends."
  },
  {
    question: "Are there any restrictions on promotional code usage?",
    answer: "Yes. Promotional codes are subject to: (1) Usage limits - codes may have maximum redemption counts; (2) Expiration dates - codes are valid for specific time periods; (3) First-payment restriction - 100% codes typically apply only to your first subscription; (4) Non-transferable - codes cannot be sold or shared; (5) One per account - each user can only use a specific code once."
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

      <main className="container mx-auto px-4 py-16">
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

      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
