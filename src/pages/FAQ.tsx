import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

const faqs = [
  {
    question: "What is NewtonAI?",
    answer: "NewtonAI is an AI-powered learning platform that helps students study more effectively. Upload your PDFs, lecture notes, or textbooks, and our AI will generate flashcards, quizzes, summaries, and mind maps to help you learn faster."
  },
  {
    question: "How does the AI flashcard generation work?",
    answer: "Our AI analyzes your uploaded documents and identifies key concepts, definitions, and important information. It then automatically creates flashcards that you can use for spaced repetition learning, proven to be one of the most effective study methods."
  },
  {
    question: "Can I use NewtonAI for free?",
    answer: "Yes! Our Free plan allows you to upload up to 5 PDFs per month and access basic features. For unlimited uploads and advanced features like AI tutoring and mind maps, check out our Pro and Ultra plans."
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
  }
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            <Link to="/faq" className="text-foreground font-medium">FAQ</Link>
          </nav>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

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
