import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, Zap, Shield, Clock, HeadphonesIcon, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";


const enterpriseFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name too long"),
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  company: z.string().trim().min(1, "Company name is required").max(100, "Company name too long"),
  jobTitle: z.string().trim().min(1, "Job title is required").max(100, "Job title too long"),
  teamSize: z.string().min(1, "Please select team size"),
  useCase: z.string().min(1, "Please select a use case"),
  message: z.string().trim().min(10, "Please provide more details").max(2000, "Message too long"),
});

type EnterpriseFormData = z.infer<typeof enterpriseFormSchema>;

const Enterprise = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<EnterpriseFormData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof EnterpriseFormData, string>>>({});

  const handleInputChange = (field: keyof EnterpriseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = enterpriseFormSchema.parse(formData);

      const { error } = await supabase.functions.invoke('send-enterprise-inquiry', {
        body: validatedData,
      });

      if (error) throw error;

      toast.success("Thank you! Our enterprise team will contact you within 24 hours.");
      setFormData({});
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof EnterpriseFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof EnterpriseFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Please fix the errors in the form");
      } else {
        toast.error("Failed to send inquiry. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Shared workspaces and centralized administration for your entire organization"
    },
    {
      icon: Zap,
      title: "Custom API Access",
      description: "RESTful APIs for seamless integration with your existing systems and workflows"
    },
    {
      icon: Shield,
      title: "Enhanced Security",
      description: "SSO, SAML, and advanced security controls to meet your compliance requirements"
    },
    {
      icon: Clock,
      title: "Unlimited Usage",
      description: "No limits on features - flashcards, quizzes, podcasts, and more for your entire team"
    },
    {
      icon: HeadphonesIcon,
      title: "Dedicated Support",
      description: "Priority support with dedicated account manager and SLA guarantees"
    },
    {
      icon: Building2,
      title: "Custom Onboarding",
      description: "Tailored training and onboarding to ensure successful adoption across your org"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Building2 className="h-4 w-4" />
            Enterprise Solutions
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            NewtonAI for{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Enterprise
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Empower your organization with AI-powered learning tools. Custom API access, 
            bulk licensing, and dedicated support for educational institutions and businesses.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>


        {/* Contact Form */}
        <div className="max-w-3xl mx-auto">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-display text-2xl">Contact Our Enterprise Team</CardTitle>
              <CardDescription className="leading-relaxed text-base">
                Tell us about your organization's needs and we'll create a custom solution for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input 
                      id="firstName" 
                      placeholder="John" 
                      value={formData.firstName || ''}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={errors.firstName ? 'border-destructive' : ''}
                    />
                    {errors.firstName && <p className="text-destructive text-sm">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Doe" 
                      value={formData.lastName || ''}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={errors.lastName ? 'border-destructive' : ''}
                    />
                    {errors.lastName && <p className="text-destructive text-sm">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Work Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@company.com" 
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name *</Label>
                    <Input 
                      id="company" 
                      placeholder="Acme Inc." 
                      value={formData.company || ''}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className={errors.company ? 'border-destructive' : ''}
                    />
                    {errors.company && <p className="text-destructive text-sm">{errors.company}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input 
                      id="jobTitle" 
                      placeholder="Head of Learning" 
                      value={formData.jobTitle || ''}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className={errors.jobTitle ? 'border-destructive' : ''}
                    />
                    {errors.jobTitle && <p className="text-destructive text-sm">{errors.jobTitle}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamSize">Team Size *</Label>
                    <Select 
                      value={formData.teamSize || ''} 
                      onValueChange={(value) => handleInputChange('teamSize', value)}
                    >
                      <SelectTrigger className={errors.teamSize ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10-50">10-50 users</SelectItem>
                        <SelectItem value="51-200">51-200 users</SelectItem>
                        <SelectItem value="201-500">201-500 users</SelectItem>
                        <SelectItem value="501-1000">501-1000 users</SelectItem>
                        <SelectItem value="1000+">1000+ users</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.teamSize && <p className="text-destructive text-sm">{errors.teamSize}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="useCase">Primary Use Case *</Label>
                    <Select 
                      value={formData.useCase || ''} 
                      onValueChange={(value) => handleInputChange('useCase', value)}
                    >
                      <SelectTrigger className={errors.useCase ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select use case" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="education">Educational Institution</SelectItem>
                        <SelectItem value="corporate-training">Corporate Training</SelectItem>
                        <SelectItem value="api-integration">API Integration</SelectItem>
                        <SelectItem value="bulk-licensing">Bulk Licensing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.useCase && <p className="text-destructive text-sm">{errors.useCase}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Tell us about your needs *</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Describe your organization's learning needs, expected usage, integration requirements, or any specific features you're looking for..." 
                    rows={5}
                    value={formData.message || ''}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className={errors.message ? 'border-destructive' : ''}
                  />
                  {errors.message && <p className="text-destructive text-sm">{errors.message}</p>}
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Request Enterprise Demo
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  By submitting this form, you agree to our{" "}
                  <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                  {" "}and{" "}
                  <a href="/terms" className="text-primary hover:underline">Terms of Service</a>.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Enterprise;
