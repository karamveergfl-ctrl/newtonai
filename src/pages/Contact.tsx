import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, Clock, HelpCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Contact = () => {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Contact", href: "/contact" },
  ];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Message sent! We'll get back to you soon.");
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contact"
        description="Get in touch with the NewtonAI team. We're here to help with questions about our AI study tools, pricing, or technical support. Response within 24 hours."
        canonicalPath="/contact"
        breadcrumbs={breadcrumbs}
        keywords="contact NewtonAI, support, help, customer service, AI study tools support"
      />
      <Header />

      <main className="container mx-auto px-4 py-10">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Have questions about NewtonAI's study tools? Need help with your account? We'd love to hear from you. 
            Our team typically responds within 24 hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1">Email</h3>
                    <p className="text-muted-foreground text-sm">support@newtonAI.site</p>
                    <p className="text-muted-foreground text-xs mt-1">For general inquiries, bug reports, and feature requests.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1">Phone</h3>
                    <p className="text-muted-foreground text-sm">+91 7618495307</p>
                    <p className="text-muted-foreground text-xs mt-1">Available Mon–Fri, 10 AM – 6 PM IST.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1">Response Time</h3>
                    <p className="text-muted-foreground text-sm">Within 24 hours</p>
                    <p className="text-muted-foreground text-xs mt-1">Most inquiries are resolved within one business day.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1">Office</h3>
                    <p className="text-muted-foreground text-sm">Aligarh, UP, India, 202150</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-display">Send us a message</CardTitle>
              <CardDescription className="leading-relaxed">
                Fill out the form below and we'll get back to you within 24 hours. Whether you have a question about our AI study tools, need technical support, or want to provide feedback, we're here to help.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help?" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Tell us more about your inquiry..." rows={5} required />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Additional info for content depth */}
        <section className="max-w-4xl mx-auto mt-16 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 font-display text-center">
            Common Reasons to Contact Us
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 text-muted-foreground">
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Account & Billing</h3>
              <p className="text-sm leading-relaxed">
                Questions about your subscription, upgrading or downgrading plans, payment issues, or account management. 
                You can also manage most account settings directly from your <Link to="/profile" className="text-primary hover:underline">profile page</Link>.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Technical Support</h3>
              <p className="text-sm leading-relaxed">
                Experiencing a bug, upload failure, or unexpected behaviour? Please include details about what you were doing, 
                which tool you were using, and any error messages you saw. Screenshots help us resolve issues faster.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Feature Requests</h3>
              <p className="text-sm leading-relaxed">
                Have an idea for a new tool or improvement? We actively incorporate student feedback into our development roadmap. 
                Many of our most popular features — including AI podcasts and mind maps — started as user suggestions.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Enterprise & Institutional Use</h3>
              <p className="text-sm leading-relaxed">
                Interested in deploying NewtonAI across your institution, school, or university? Visit our{" "}
                <Link to="/enterprise" className="text-primary hover:underline">Enterprise page</Link> or 
                contact us for volume licensing, custom integrations, and dedicated support options.
              </p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Before reaching out, you might find your answer in our{" "}
              <Link to="/faq" className="text-primary hover:underline">FAQ page</Link>.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
