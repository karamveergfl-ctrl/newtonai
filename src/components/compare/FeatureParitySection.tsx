import { motion } from "framer-motion";
import { Check, Star, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { competitors, featureComparison, CompetitorKey } from "@/pages/compare/competitorData";

interface FeatureParitySectionProps {
  competitor: CompetitorKey;
}

const FeatureParitySection = ({ competitor }: FeatureParitySectionProps) => {
  const competitorData = competitors[competitor];
  
  // Categorize features into exclusives and shared
  const exclusiveFeatures = featureComparison.filter(f => {
    const newtonHas = f.newton === true || (typeof f.newton === 'string');
    const competitorValue = f[competitor];
    const competitorHas = competitorValue === true || (typeof competitorValue === 'string' && competitorValue.length > 0);
    return newtonHas && !competitorHas;
  });
  
  const sharedFeatures = featureComparison.filter(f => {
    const newtonHas = f.newton === true || (typeof f.newton === 'string');
    const competitorValue = f[competitor];
    const competitorHas = competitorValue === true || (typeof competitorValue === 'string' && competitorValue.length > 0);
    return newtonHas && competitorHas;
  });

  return (
    <section className="py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            What They Have vs What We Have
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See exactly where NewtonAI stands out and where features overlap with {competitorData.name}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* NewtonAI Exclusives - Gold Stars */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full border-2 border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-amber-500/20">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  </div>
                  <CardTitle className="text-xl">NewtonAI Exclusives</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Features only NewtonAI offers
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {exclusiveFeatures.map((feature, index) => (
                    <motion.li
                      key={feature.feature}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/5"
                    >
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                      <span className="font-medium text-foreground">{feature.feature}</span>
                    </motion.li>
                  ))}
                  {exclusiveFeatures.length === 0 && (
                    <li className="text-muted-foreground italic p-2">
                      All features are shared with this competitor
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Shared Features - Green Checkmarks */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full border-2 border-green-500/50 bg-green-500/5 dark:bg-green-500/10">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-green-500/20">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  <CardTitle className="text-xl">Shared Features</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  Both NewtonAI and {competitorData.name} offer these
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {sharedFeatures.map((feature, index) => (
                    <motion.li
                      key={feature.feature}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="flex items-center gap-3 p-2 rounded-lg bg-green-500/10 dark:bg-green-500/5"
                    >
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-foreground">{feature.feature}</span>
                      {typeof feature[competitor] === 'string' && feature[competitor] !== 'true' && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          {feature[competitor]}
                        </Badge>
                      )}
                    </motion.li>
                  ))}
                  {sharedFeatures.length === 0 && (
                    <li className="text-muted-foreground italic p-2">
                      No overlapping features in this category
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Summary Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10"
        >
          <Badge 
            variant="secondary" 
            className="text-base px-6 py-3 bg-gradient-to-r from-amber-500/20 to-primary/20 border border-amber-500/30"
          >
            <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
            NewtonAI has {exclusiveFeatures.length} exclusive feature{exclusiveFeatures.length !== 1 ? 's' : ''} vs {competitorData.name}
          </Badge>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureParitySection;
