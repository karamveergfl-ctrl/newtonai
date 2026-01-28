import { Card, CardContent } from "@/components/ui/card";
import { newtonFeatures } from "@/pages/compare/competitorData";

const UniqueFeatures = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Features Only NewtonAI Has
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Purpose-built for students with exclusive AI-powered study tools you won't find anywhere else.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newtonFeatures.uniqueFeatures.map((feature) => (
            <div key={feature.title}>
              <Card className="h-full hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UniqueFeatures;