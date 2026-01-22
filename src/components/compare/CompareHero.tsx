import { motion } from "framer-motion";
import { ArrowRight, Check, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { GradientBlob } from "@/components/GradientBlob";
import { competitors, newtonFeatures, CompetitorKey } from "@/pages/compare/competitorData";
import { useCurrency } from "@/hooks/useCurrency";
import { DISPLAY_PRICING, COMPETITOR_PRICING } from "@/lib/currencyUtils";

interface CompareHeroProps {
  competitor: CompetitorKey;
}

const CompareHero = ({ competitor }: CompareHeroProps) => {
  const competitorData = competitors[competitor];
  const { currency } = useCurrency();
  
  // Get localized pricing
  const newtonMonthly = DISPLAY_PRICING.pro.monthly[currency];
  const competitorPricing = COMPETITOR_PRICING[competitor]?.[currency];
  const competitorMonthly = competitorPricing?.monthly || competitorData.monthlyPrice;
  
  // Calculate savings in user's currency
  const newtonPriceValue = parseFloat(newtonMonthly.replace(/[^0-9.]/g, ''));
  const competitorPriceValue = competitorPricing?.monthlyValue || competitorData.pricePerMonth;
  const savings = ((competitorPriceValue - newtonPriceValue) / competitorPriceValue * 100).toFixed(0);

  return (
    <section className="relative py-20 overflow-hidden">
      <GradientBlob color="primary" size="xl" className="-top-40 -right-40 opacity-20" />
      <GradientBlob color="secondary" size="lg" className="top-1/2 -left-20 opacity-15" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          <Badge variant="secondary" className="mb-4">
            <TrendingDown className="h-3 w-3 mr-1" />
            Save {savings}% vs {competitorData.name}
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            NewtonAI vs {competitorData.name}:
            <span className="block text-primary mt-2">The Smarter Choice for Students</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {competitorData.verdict}
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth">
                Try NewtonAI Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { label: "AI Tools", newton: "7", competitor: "1-2" },
              { label: "Price/mo", newton: newtonMonthly, competitor: competitorMonthly },
              { label: "Free Tier", newton: "Yes ✓", competitor: "No ✗" },
              { label: "Video in PDF", newton: "Yes ✓", competitor: "No ✗" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-card border rounded-xl p-4"
              >
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-primary">{stat.newton}</p>
                <p className="text-xs text-muted-foreground line-through">{stat.competitor}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CompareHero;
