import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

const Privacy = () => {
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
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-lg">Last updated: January 5, 2025</p>
          </header>

          <div className="space-y-10">
            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                1. Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                At StudySmart, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                2. Information We Collect
              </h2>
              <h3 className="font-display text-lg font-medium text-foreground mb-3">Information You Provide</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-6">
                <li>Account information (name, email, password)</li>
                <li>Payment information (processed securely by our payment provider)</li>
                <li>Documents and files you upload for processing</li>
                <li>Feedback and correspondence with our support team</li>
              </ul>

              <h3 className="font-display text-lg font-medium text-foreground mb-3">Information Collected Automatically</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>Device information (browser type, operating system)</li>
                <li>IP address and approximate location</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                3. How We Use Your Information
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">We use the collected information to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Provide and maintain our Service</li>
                <li>Process your documents and generate study materials</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send you updates and marketing communications (with your consent)</li>
                <li>Improve our AI models and Service quality</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                4. Data Sharing
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">We do not sell your personal information. We may share data with:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Service providers who assist in operating our platform</li>
                <li>Legal authorities when required by law</li>
                <li>Business partners with your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                5. Data Security
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement industry-standard security measures to protect your data, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Encryption in transit (TLS/SSL) and at rest</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and employee training</li>
                <li>Secure data centers with physical security measures</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                6. Data Retention
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your data for as long as your account is active or as needed to provide 
                services. Uploaded documents can be deleted at any time from your account settings. 
                We may retain certain information as required by law or for legitimate business purposes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                7. Your Rights
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Delete your personal data</li>
                <li>Object to or restrict certain processing</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                8. Cookies
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to enhance your experience, analyze usage, 
                and deliver personalized content. You can manage cookie preferences through your 
                browser settings.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                9. Children's Privacy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service is not intended for children under 13. We do not knowingly collect 
                personal information from children under 13. If you believe we have collected such 
                information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                10. Changes to This Policy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any 
                material changes by email or through our Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                11. Contact Us
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about this Privacy Policy or to exercise your rights, contact us at{" "}
                <a href="mailto:privacy@studysmart.com" className="text-primary hover:underline font-medium">
                  privacy@studysmart.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
