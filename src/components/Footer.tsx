import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { Instagram, Youtube, Facebook, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/80 border-t mt-16">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Study Tools */}
          <div>
            <h3 className="font-display font-semibold text-foreground mb-4">Study Tools</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/tools/homework-help" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  AI Homework Helper
                </Link>
              </li>
              <li>
                <Link to="/tools/ai-notes" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  AI Note Taker
                </Link>
              </li>
              <li>
                <Link to="/tools/ai-flashcards" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  AI Flashcards Maker
                </Link>
              </li>
              <li>
                <Link to="/tools/ai-quiz" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  AI Quiz Generator
                </Link>
              </li>
              <li>
                <Link to="/tools/pdf-summarizer" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  AI PDF Summarizer
                </Link>
              </li>
              <li>
                <Link to="/tools/mind-map" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  AI Mind Map
                </Link>
              </li>
            </ul>
          </div>

          {/* Subjects */}
          <div>
            <h3 className="font-display font-semibold text-foreground mb-4">Subjects</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-muted-foreground text-sm">Math</span>
              </li>
              <li>
                <span className="text-muted-foreground text-sm">Science</span>
              </li>
              <li>
                <span className="text-muted-foreground text-sm">Business</span>
              </li>
              <li>
                <span className="text-muted-foreground text-sm">Language</span>
              </li>
              <li>
                <span className="text-muted-foreground text-sm">Arts & Humanities</span>
              </li>
              <li>
                <span className="text-muted-foreground text-sm">Social Science</span>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-display font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-display font-semibold text-foreground mb-4">Connect With Us</h3>
            <div className="flex gap-4 mb-6">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center hover:bg-foreground/20 transition-colors"
              >
                <Instagram className="h-5 w-5 text-foreground" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center hover:bg-foreground/20 transition-colors"
              >
                <Youtube className="h-5 w-5 text-foreground" />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center hover:bg-foreground/20 transition-colors"
              >
                <Facebook className="h-5 w-5 text-foreground" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-foreground/10 rounded-full flex items-center justify-center hover:bg-foreground/20 transition-colors"
              >
                <Twitter className="h-5 w-5 text-foreground" />
              </a>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-border pt-8 mb-8">
          <h3 className="font-display font-semibold text-foreground mb-4">Legal</h3>
          <div className="flex flex-wrap gap-6">
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Privacy Policy
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <p className="text-muted-foreground text-sm">© 2025 StudySmart. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
