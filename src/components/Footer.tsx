import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";
import { Instagram, Youtube, Facebook, Twitter, Mail, Phone } from "lucide-react";
import { GradientBlob } from "./GradientBlob";
import { AdBanner } from "./AdBanner";

const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t relative overflow-hidden">
      {/* Banner Ad for Free Users */}
      <AdBanner placement="footer" />
      
      {/* Decorative Blob */}
      <GradientBlob
        color="primary"
        size="xl"
        className="-bottom-40 -right-40 opacity-10"
      />

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Logo size="lg" className="mb-4" />
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
            </motion.div>
          </div>

          {/* Study Tools */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
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
          </motion.div>

          {/* Compare */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-display font-semibold text-foreground mb-4">
              Compare
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/compare/chegg", label: "vs Chegg" },
                { to: "/compare/quizlet", label: "vs Quizlet" },
                { to: "/compare/studocu", label: "vs Studocu" },
                { to: "/compare/course-hero", label: "vs Course Hero" },
                { to: "/compare/chatgpt", label: "vs ChatGPT" },
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
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="font-display font-semibold text-foreground mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/about", label: "About Us" },
                { to: "/pricing", label: "Pricing" },
                { to: "/faq", label: "FAQ" },
                { to: "/contact", label: "Contact Us" },
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
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
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
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pt-8 border-t border-border"
        >
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
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
