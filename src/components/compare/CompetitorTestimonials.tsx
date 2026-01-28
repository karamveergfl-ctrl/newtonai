import { Card, CardContent } from "@/components/ui/card";
import { Quote, Star } from "lucide-react";
import { competitors, CompetitorKey } from "@/pages/compare/competitorData";

interface CompetitorTestimonialsProps {
  competitor: CompetitorKey;
}

const CompetitorTestimonials = ({ competitor }: CompetitorTestimonialsProps) => {
  const competitorData = competitors[competitor];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Students Who Switched from {competitorData.name}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from real students who made the switch to NewtonAI and never looked back.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {competitorData.testimonials.map((testimonial, index) => (
            <div key={index}>
              <Card className="h-full hover:shadow-lg transition-all border-primary/20 hover:border-primary/40 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-foreground mb-6 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>

                  <div className="border-t pt-4">
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompetitorTestimonials;