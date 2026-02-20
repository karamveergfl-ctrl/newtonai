import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { Instagram, Youtube, Facebook, Twitter, Mail } from "lucide-react";


const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t relative overflow-hidden">
      {/* Static Decorative Blob */}
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none opacity-10" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div>
              <Logo size="lg" className="mb-4" eager={false} />
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm">
                Transform your learning experience with AI-powered study tools.
                Upload any document and let our AI create flashcards, summaries,
                quizzes, and more.
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="mailto:support@newtonai.site"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  support@newtonai.site
                </a>
              </div>
            </div>
          </div>

          {/* Study Tools */}
          <div>
            <h3 className="font-display font-semibold text-foreground mb-4">
              Study Tools
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/tools/homework-help", label: "AI Homework Helper" },
                { to: "/tools/ai-notes", label: "AI Note Taker" },
                { to: "/tools/flashcards", label: "AI Flashcards" },
                { to: "/tools/quiz", label: "AI Quiz Generator" },
                { to: "/tools/summarizer", label: "AI Summarizer" },
                { to: "/tools/mind-map", label: "AI Mind Map" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm link-underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-display font-semibold text-foreground mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/guides", label: "Study Guides" },
                { to: "/features", label: "Features" },
                { to: "/how-it-works", label: "How It Works" },
                { to: "/ai-for-students", label: "AI for Students" },
                { to: "/guides/how-ai-learning-works", label: "AI Learning Guide" },
                { to: "/guides/spaced-repetition-guide", label: "Spaced Repetition" },
                { to: "/guides/responsible-ai-use", label: "Responsible AI Use" },
                { to: "/blog", label: "Blog Articles" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm link-underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-display font-semibold text-foreground mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/about", label: "About Us" },
                { to: "/pricing", label: "Pricing" },
                { to: "/faq", label: "FAQ" },
                { to: "/contact", label: "Contact Us" },
                { to: "/compare", label: "Compare Tools" },
                { to: "/ai-study-assistant", label: "AI Study Assistant" },
                { to: "/exam-preparation-ai", label: "Exam Preparation" },
                { to: "/about-newtonai-for-ai", label: "About NewtonAI" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm link-underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display font-semibold text-foreground mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/terms", label: "Terms of Service" },
                { to: "/privacy", label: "Privacy Policy" },
                { to: "/refund", label: "Refund Policy" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm link-underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Educational Disclaimer */}
        <div className="border-t border-border pt-8 mb-8">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
            <strong className="text-foreground">Educational Use Disclaimer:</strong> NewtonAI is designed to assist with 
            learning and studying. AI-generated content should be used as a study aid and verified against authoritative 
            sources. Users are responsible for ensuring compliance with their institution's academic integrity policies. 
            NewtonAI does not encourage or condone academic dishonesty.
          </p>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-border pb-16 md:pb-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} NewtonAI. All rights reserved.
            </p>

            {/* Social Icons */}
            <div className="flex gap-3">
              {[
                { href: "https://instagram.com", icon: Instagram, label: "Instagram" },
                { href: "https://youtube.com", icon: Youtube, label: "YouTube" },
                { href: "https://facebook.com", icon: Facebook, label: "Facebook" },
                { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;