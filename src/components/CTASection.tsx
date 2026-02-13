import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

interface CTASectionProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

export const CTASection = ({
  title = "Ready to Transform Your Learning?",
  description = "Join thousands of students who are already studying smarter with AI-powered tools.",
  primaryButtonText = "Get Started Free",
  primaryButtonLink = "/auth",
  secondaryButtonText = "View Pricing",
  secondaryButtonLink = "/pricing",
}: CTASectionProps) => {
  return (
    <section className="py-12 px-4 relative overflow-hidden">
      {/* Static background decorations */}
      <div className="absolute top-0 -right-40 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl pointer-events-none opacity-20" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl pointer-events-none opacity-20" />

      <div className="container mx-auto relative z-10">
        <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-3xl p-8 md:p-12 lg:p-16 border border-border/50">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Start learning smarter today</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              {title}
            </h2>

            <p className="text-lg text-muted-foreground mb-8">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="group">
                <Link to={primaryButtonLink}>
                  {primaryButtonText}
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={secondaryButtonLink}>{secondaryButtonText}</Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Free tier available
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;