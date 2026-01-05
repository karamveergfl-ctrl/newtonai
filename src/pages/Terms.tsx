import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
          </nav>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <header className="mb-12 text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground text-lg">Last updated: January 5, 2025</p>
          </header>

          <div className="space-y-10">
            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using StudySmart ("Service"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                2. Description of Service
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                StudySmart provides AI-powered study tools including flashcard generation, quiz creation, 
                document summarization, and related educational features. We reserve the right to modify, 
                suspend, or discontinue any part of the Service at any time.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                3. User Accounts
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To use certain features of our Service, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                4. Acceptable Use
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Use the Service for any illegal purpose</li>
                <li>Upload content that infringes intellectual property rights</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the Service to distribute malware or harmful content</li>
                <li>Resell or redistribute the Service without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                5. Intellectual Property
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Service and its original content, features, and functionality are owned by StudySmart 
                and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                You retain ownership of any content you upload. By uploading content, you grant us a 
                license to process and analyze it for the purpose of providing the Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                6. Payment and Subscriptions
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Paid subscriptions are billed in advance on a monthly or annual basis. You may cancel 
                your subscription at any time, and you will continue to have access until the end of 
                your billing period.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                7. Limitation of Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                StudySmart shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages resulting from your use of the Service. Our total liability shall 
                not exceed the amount you paid us in the past twelve months.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                8. Disclaimer of Warranties
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is provided "as is" without warranties of any kind. We do not guarantee 
                that the Service will be uninterrupted, secure, or error-free. AI-generated content 
                should be reviewed for accuracy.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                9. Changes to Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these Terms from time to time. We will notify you of any material changes 
                by posting the new Terms on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                10. Contact Us
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms, please contact us at{" "}
                <a href="mailto:legal@studysmart.com" className="text-primary hover:underline font-medium">
                  legal@studysmart.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground">© 2025 StudySmart. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/terms" className="text-foreground font-medium">Terms</Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
