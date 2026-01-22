import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check, X, TrendingDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GradientBlob } from "@/components/GradientBlob";
import { competitors, newtonFeatures } from "./competitorData";
import { useCurrency } from "@/hooks/useCurrency";
import { DISPLAY_PRICING, COMPETITOR_PRICING, CURRENCY_FLAGS, CurrencyCode } from "@/lib/currencyUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Compare = () => {
  const competitorList = Object.values(competitors);
  const { currency, setCurrency } = useCurrency();
  const newtonMonthlyPrice = DISPLAY_PRICING.pro.monthly[currency];
  const currencyOptions = Object.keys(CURRENCY_FLAGS) as CurrencyCode[];

  // Calculate Newton price value for savings calculation
  const newtonPriceValue = parseFloat(DISPLAY_PRICING.pro.monthly[currency].replace(/[^0-9.]/g, ''));

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Compare NewtonAI vs Competitors 2026 - Chegg, Quizlet, Studocu & More"
        description="See how NewtonAI compares to Chegg, Quizlet, Studocu, Course Hero, and ChatGPT. Get 7 AI study tools at half the price with our unique features."
        canonicalPath="/compare"
        keywords="NewtonAI vs Chegg, NewtonAI vs Quizlet, AI study app comparison, best study app 2026, Studocu alternative, Course Hero alternative"
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Compare", href: "/compare" },
        ]}
      />
      <Header />

      <main>
        {/* Hero Section */}
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
                Save up to 58% vs competitors
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
                Compare NewtonAI to
                <span className="block text-primary mt-2">Every Major Study Platform</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                See why 50,000+ students switched to NewtonAI. Get 7 AI study tools, embedded videos in your PDFs, and a generous free tier - all at a fraction of the cost.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
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
            </motion.div>
          </div>
        </section>

        {/* NewtonAI Highlights */}
        <section className="py-12 bg-primary/5 border-y">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
              {[
                { label: "AI Study Tools", value: "7" },
                { label: "Starting Price", value: newtonMonthlyPrice + "/mo" },
                { label: "Free Tier", value: "Yes ✓" },
                { label: "Videos in PDF", value: "Yes ✓" },
              ].map((stat) => (
                <div key={stat.label} className="p-4">
                  <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
            {/* Currency Selector */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <span className="text-sm text-muted-foreground">Currency:</span>
              <Select value={currency} onValueChange={(val) => setCurrency(val as CurrencyCode)}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue>
                    {CURRENCY_FLAGS[currency]} {currency}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((code) => (
                    <SelectItem key={code} value={code}>
                      {CURRENCY_FLAGS[code]} {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Competitor Grid */}
        <section className="py-16">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Choose a Comparison
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Click on any competitor below to see a detailed feature-by-feature comparison with NewtonAI.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {competitorList.map((comp, index) => {
                const competitorPricing = COMPETITOR_PRICING[comp.slug]?.[currency];
                const competitorPriceValue = competitorPricing?.monthlyValue || comp.pricePerMonth;
                const savings = ((competitorPriceValue - newtonPriceValue) / competitorPriceValue * 100).toFixed(0);
                const competitorMonthlyDisplay = competitorPricing?.monthly || comp.monthlyPrice;
                
                return (
                  <motion.div
                    key={comp.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={`/compare/${comp.slug}`}>
                      <Card className="h-full hover:shadow-xl transition-all border-2 hover:border-primary/50 group cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-4xl">{comp.logo}</span>
                              <div>
                                <h3 className="font-display font-bold text-xl group-hover:text-primary transition-colors">
                                  vs {comp.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">{comp.tagline}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-4">
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Save {savings}%
                            </Badge>
                            <span className="text-sm text-muted-foreground line-through">
                              {competitorMonthlyDisplay}/mo
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <p className="text-sm font-medium text-foreground">NewtonAI wins on:</p>
                            <ul className="space-y-1">
                              {comp.weaknesses.slice(0, 3).map((weakness, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                  <span>{weakness.replace("No ", "")}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                            View full comparison
                            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quick Feature Matrix */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Quick Feature Overview
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                See at a glance which features each platform offers.
              </p>
            </motion.div>

            <div className="overflow-x-auto">
              <table className="w-full max-w-5xl mx-auto bg-card rounded-xl border">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="p-4 font-semibold text-primary">NewtonAI</th>
                    {competitorList.map((comp) => (
                      <th key={comp.slug} className="p-4 font-semibold text-muted-foreground">
                        {comp.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Videos in PDF", newton: true, values: [false, false, false, false, false, false, false] },
                    { feature: "AI Flashcards", newton: true, values: [true, true, true, false, true, true, true] },
                    { feature: "AI Podcast/Audio", newton: true, values: [false, false, false, false, false, false, true] },
                    { feature: "Handwriting OCR", newton: true, values: [false, false, false, false, false, false, false] },
                    { feature: "Mind Map", newton: true, values: [false, false, false, false, "Manual", false, false] },
                    { feature: "Free Tier (Ads)", newton: true, values: [false, "Limited", "Limited", false, "Limited", "Limited", "Limited"] },
                  ].map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="p-4 text-center">
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      {row.values.map((val, j) => (
                        <td key={j} className="p-4 text-center">
                          {val === true ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : val === false ? (
                            <X className="h-5 w-5 text-red-400 mx-auto" />
                          ) : (
                            <span className="text-xs text-muted-foreground">{val}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t">
                    <td className="p-4 font-medium">Price</td>
                    <td className="p-4 text-center font-bold text-primary">{newtonMonthlyPrice}/mo</td>
                    {competitorList.map((comp) => {
                      const competitorPricing = COMPETITOR_PRICING[comp.slug]?.[currency];
                      return (
                        <td key={comp.slug} className="p-4 text-center text-muted-foreground">
                          {competitorPricing?.monthly || comp.monthlyPrice}/mo
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Ready to Make the Switch?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join 50,000+ students who study smarter with NewtonAI. Start free with our ad-supported tier.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/auth">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/pricing">Compare Plans</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Compare;
