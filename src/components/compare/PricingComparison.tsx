import { motion } from "framer-motion";
import { Check, X, Sparkles, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { competitors, newtonFeatures, CompetitorKey } from "@/pages/compare/competitorData";

interface PricingComparisonProps {
  competitor: CompetitorKey;
}

const PricingComparison = ({ competitor }: PricingComparisonProps) => {
  const competitorData = competitors[competitor];
  const savings = ((competitorData.pricePerMonth - newtonFeatures.pricePerMonth) / competitorData.pricePerMonth * 100).toFixed(0);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Save {savings}% vs {competitorData.name}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get more features for less. NewtonAI offers 7 AI-powered study tools at a fraction of the cost.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* NewtonAI Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="relative border-2 border-primary overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
              <Badge className="absolute top-4 right-4 bg-primary">
                <Crown className="h-3 w-3 mr-1" />
                Best Value
              </Badge>
              <CardHeader className="pt-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">🧠</span>
                  <CardTitle className="text-2xl">NewtonAI Pro</CardTitle>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">{newtonFeatures.monthlyPrice}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Or {newtonFeatures.yearlyPrice}/year (save 24%)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    "Videos embedded in PDF reader",
                    "AI Flashcards & Quizzes",
                    "AI Podcast generation",
                    "Mind Maps & Summaries",
                    "Homework Help with steps",
                    "Voice transcription",
                    "Handwriting OCR",
                    "Free tier with ads",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full mt-6" size="lg">
                  <Link to="/pricing">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get Started Free
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Competitor Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="relative border border-border/50 opacity-80">
              <CardHeader className="pt-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{competitorData.logo}</span>
                  <CardTitle className="text-2xl text-muted-foreground">{competitorData.name}</CardTitle>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-muted-foreground">{competitorData.monthlyPrice}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Or {competitorData.yearlyPrice}/year
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {competitorData.strengths.map((strength) => (
                    <li key={strength} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">{strength}</span>
                    </li>
                  ))}
                  {competitorData.weaknesses.slice(0, 4).map((weakness) => (
                    <li key={weakness} className="flex items-center gap-2">
                      <X className="h-4 w-4 text-red-400 shrink-0" />
                      <span className="text-sm text-muted-foreground">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PricingComparison;
