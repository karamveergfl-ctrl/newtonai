import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

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
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 5, 2025</p>

          <h2>1. Introduction</h2>
          <p>
            At StudySmart, we take your privacy seriously. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you use our Service.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>Information You Provide</h3>
          <ul>
            <li>Account information (name, email, password)</li>
            <li>Payment information (processed securely by our payment provider)</li>
            <li>Documents and files you upload for processing</li>
            <li>Feedback and correspondence with our support team</li>
          </ul>

          <h3>Information Collected Automatically</h3>
          <ul>
            <li>Usage data (pages visited, features used, time spent)</li>
            <li>Device information (browser type, operating system)</li>
            <li>IP address and approximate location</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Provide and maintain our Service</li>
            <li>Process your documents and generate study materials</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send you updates and marketing communications (with your consent)</li>
            <li>Improve our AI models and Service quality</li>
            <li>Detect and prevent fraud or abuse</li>
          </ul>

          <h2>4. Data Sharing</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul>
            <li>Service providers who assist in operating our platform</li>
            <li>Legal authorities when required by law</li>
            <li>Business partners with your explicit consent</li>
          </ul>

          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including:
          </p>
          <ul>
            <li>Encryption in transit (TLS/SSL) and at rest</li>
            <li>Regular security audits and penetration testing</li>
            <li>Access controls and employee training</li>
            <li>Secure data centers with physical security measures</li>
          </ul>

          <h2>6. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to provide 
            services. Uploaded documents can be deleted at any time from your account settings. 
            We may retain certain information as required by law or for legitimate business purposes.
          </p>

          <h2>7. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access and receive a copy of your personal data</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Delete your personal data</li>
            <li>Object to or restrict certain processing</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>

          <h2>8. Cookies</h2>
          <p>
            We use cookies and similar technologies to enhance your experience, analyze usage, 
            and deliver personalized content. You can manage cookie preferences through your 
            browser settings.
          </p>

          <h2>9. Children's Privacy</h2>
          <p>
            Our Service is not intended for children under 13. We do not knowingly collect 
            personal information from children under 13. If you believe we have collected such 
            information, please contact us immediately.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any 
            material changes by email or through our Service.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            For questions about this Privacy Policy or to exercise your rights, contact us at{" "}
            <a href="mailto:privacy@studysmart.com" className="text-primary hover:underline">
              privacy@studysmart.com
            </a>
          </p>
        </div>
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground">© 2025 StudySmart. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
              <Link to="/privacy" className="text-foreground font-medium">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
