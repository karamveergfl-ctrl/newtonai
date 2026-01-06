import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

const plans = [
  {
    name: "Free",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "5 PDF uploads per month",
      "Basic flashcard generation",
      "Limited quiz mode",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    monthlyPrice: "$9.99",
    yearlyPrice: "$7.99",
    period: "per month",
    yearlySavings: "Save 20%",
    description: "Best for students",
    features: [
      "Unlimited PDF uploads",
      "Advanced AI flashcards",
      "Unlimited quizzes",
      "Mind map generation",
      "Video search & summaries",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Ultra",
    monthlyPrice: "$19.99",
    yearlyPrice: "$15.99",
    period: "per month",
    yearlySavings: "Save 20%",
    description: "For power learners",
    features: [
      "Everything in Pro",
      "AI tutoring chat",
      "Handwriting OCR",
      "Lecture recording & notes",
      "Team collaboration",
      "API access",
      "Dedicated support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/pricing" className="text-foreground font-medium">Pricing</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
          </nav>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that fits your learning needs. Upgrade or downgrade anytime.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {isYearly && (
              <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">
                Save 20%
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    /{plan.name === "Free" ? plan.period : (isYearly ? "month, billed yearly" : plan.period)}
                  </span>
                </div>
                {isYearly && plan.yearlySavings && (
                  <span className="inline-block mt-2 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold px-2 py-1 rounded-full">
                    {plan.yearlySavings}
                  </span>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link to={plan.name === "Free" ? "/auth" : "/auth"} className="w-full">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
