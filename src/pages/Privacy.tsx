import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link to="/faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </nav>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold font-display">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 6, 2026</p>
          </div>

          {/* Table of Contents */}
          <div className="bg-muted/50 rounded-lg p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li><a href="#introduction" className="hover:text-foreground transition-colors">Introduction</a></li>
              <li><a href="#controller" className="hover:text-foreground transition-colors">Data Controller Information</a></li>
              <li><a href="#collection" className="hover:text-foreground transition-colors">Information We Collect</a></li>
              <li><a href="#legal-basis" className="hover:text-foreground transition-colors">Legal Basis for Processing</a></li>
              <li><a href="#how-we-use" className="hover:text-foreground transition-colors">How We Use Your Information</a></li>
              <li><a href="#sharing" className="hover:text-foreground transition-colors">Data Sharing and Disclosure</a></li>
              <li><a href="#international" className="hover:text-foreground transition-colors">International Data Transfers</a></li>
              <li><a href="#security" className="hover:text-foreground transition-colors">Data Security</a></li>
              <li><a href="#retention" className="hover:text-foreground transition-colors">Data Retention</a></li>
              <li><a href="#your-rights" className="hover:text-foreground transition-colors">Your Rights Under Data Protection Laws</a></li>
              <li><a href="#cookies" className="hover:text-foreground transition-colors">Cookies and Tracking Technologies</a></li>
              <li><a href="#children" className="hover:text-foreground transition-colors">Children's Privacy</a></li>
              <li><a href="#changes" className="hover:text-foreground transition-colors">Changes to This Policy</a></li>
              <li><a href="#contact" className="hover:text-foreground transition-colors">Contact Information</a></li>
            </ol>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {/* Section 1: Introduction */}
            <AccordionItem value="introduction" id="introduction" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                1. Introduction
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Welcome to NewtonAI ("we," "us," or "our"). We are committed to protecting your privacy 
                  and ensuring the security of your personal information. This Privacy Policy explains how we 
                  collect, use, disclose, and safeguard your information when you use our services.
                </p>
                <p>
                  This Privacy Policy applies to all users of our website, mobile applications, and related 
                  services (collectively, the "Services"). By using our Services, you consent to the data 
                  practices described in this policy.
                </p>
                <p>
                  We encourage you to read this Privacy Policy carefully. If you do not agree with the terms 
                  of this Privacy Policy, please do not access or use our Services.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Data Controller */}
            <AccordionItem value="controller" id="controller" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                2. Data Controller Information
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  For the purposes of applicable data protection laws, including the General Data Protection 
                  Regulation (GDPR) and UK GDPR, NewtonAI acts as the "data controller" of the personal 
                  data we process.
                </p>
                <p>
                  As the data controller, we determine the purposes and means of processing personal data. 
                  We are responsible for ensuring that your personal data is processed in compliance with 
                  applicable data protection laws.
                </p>
                <p>
                  If you have any questions about how we process your personal data, or if you wish to 
                  exercise any of your data protection rights, please contact us using the details provided 
                  in the "Contact Information" section below.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 3: Information We Collect */}
            <AccordionItem value="collection" id="collection" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                3. Information We Collect
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4>3.1 Information You Provide</h4>
                <p>We collect information you voluntarily provide when you:</p>
                <ul>
                  <li><strong>Create an Account:</strong> Name, email address, password, and optional profile information (education level, subjects, study goals).</li>
                  <li><strong>Use Our Services:</strong> Documents you upload (PDFs, images, text), study materials you create, questions you ask, and content you generate.</li>
                  <li><strong>Make Payments:</strong> Billing information, payment method details (processed securely by our payment providers).</li>
                  <li><strong>Contact Us:</strong> Information included in your communications, including support requests and feedback.</li>
                  <li><strong>Participate in Surveys:</strong> Responses to optional surveys or research studies.</li>
                </ul>

                <h4>3.2 Information Collected Automatically</h4>
                <p>When you use our Services, we automatically collect:</p>
                <ul>
                  <li><strong>Device Information:</strong> Device type, operating system, browser type, unique device identifiers.</li>
                  <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on pages, click patterns, search queries.</li>
                  <li><strong>Log Data:</strong> IP address, access times, referring URLs, error logs.</li>
                  <li><strong>Location Data:</strong> Approximate location based on IP address (country/region level).</li>
                  <li><strong>Cookies and Similar Technologies:</strong> Information collected through cookies, pixels, and similar tracking technologies.</li>
                </ul>

                <h4>3.3 Information from Third Parties</h4>
                <p>We may receive information from:</p>
                <ul>
                  <li><strong>Authentication Providers:</strong> If you sign in using Google or other third-party services, we receive basic profile information.</li>
                  <li><strong>Analytics Providers:</strong> Aggregated analytics data about service usage.</li>
                  <li><strong>Payment Processors:</strong> Transaction confirmation and fraud prevention data.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 4: Legal Basis */}
            <AccordionItem value="legal-basis" id="legal-basis" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                4. Legal Basis for Processing
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>We process your personal data based on the following legal grounds:</p>
                
                <h4>4.1 Contractual Necessity</h4>
                <p>
                  Processing necessary to perform our contract with you, including providing the Services, 
                  managing your account, and processing payments.
                </p>

                <h4>4.2 Legitimate Interests</h4>
                <p>
                  Processing necessary for our legitimate interests, including improving our Services, 
                  preventing fraud, ensuring security, and marketing our products (where not overridden 
                  by your rights).
                </p>

                <h4>4.3 Consent</h4>
                <p>
                  Processing based on your explicit consent, such as receiving marketing communications 
                  or participating in research. You may withdraw consent at any time.
                </p>

                <h4>4.4 Legal Obligation</h4>
                <p>
                  Processing necessary to comply with legal obligations, such as tax reporting, responding 
                  to legal requests, or meeting regulatory requirements.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 5: How We Use Information */}
            <AccordionItem value="how-we-use" id="how-we-use" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                5. How We Use Your Information
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>We use your information to:</p>
                
                <h4>5.1 Provide and Improve Services</h4>
                <ul>
                  <li>Deliver the features and functionality you request;</li>
                  <li>Process and respond to your inputs using AI technology;</li>
                  <li>Personalize your experience based on your preferences;</li>
                  <li>Analyze usage patterns to improve our Services;</li>
                  <li>Develop new features and products.</li>
                </ul>

                <h4>5.2 Account Management</h4>
                <ul>
                  <li>Create and manage your account;</li>
                  <li>Process subscription payments and billing;</li>
                  <li>Send transactional communications (confirmations, receipts);</li>
                  <li>Provide customer support.</li>
                </ul>

                <h4>5.3 Communications</h4>
                <ul>
                  <li>Send service-related announcements and updates;</li>
                  <li>Respond to your inquiries and support requests;</li>
                  <li>Send marketing communications (with your consent);</li>
                  <li>Notify you of changes to our policies.</li>
                </ul>

                <h4>5.4 Safety and Security</h4>
                <ul>
                  <li>Detect and prevent fraud, abuse, and security threats;</li>
                  <li>Enforce our Terms of Service and policies;</li>
                  <li>Protect the rights and safety of users and third parties.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 6: Data Sharing */}
            <AccordionItem value="sharing" id="sharing" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                6. Data Sharing and Disclosure
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>We may share your information in the following circumstances:</p>
                
                <h4>6.1 Service Providers</h4>
                <p>
                  We share data with trusted third-party service providers who assist us in operating our 
                  Services, including:
                </p>
                <ul>
                  <li>Cloud hosting and infrastructure providers;</li>
                  <li>Payment processors;</li>
                  <li>Analytics providers;</li>
                  <li>Customer support tools;</li>
                  <li>AI and machine learning services.</li>
                </ul>
                <p>
                  These providers are contractually obligated to protect your data and use it only for 
                  the purposes we specify.
                </p>

                <h4>6.2 Legal Requirements</h4>
                <p>We may disclose your information if required by law or in response to:</p>
                <ul>
                  <li>Valid legal process (subpoenas, court orders);</li>
                  <li>Government requests;</li>
                  <li>Legal claims or disputes;</li>
                  <li>Protection of our rights and property.</li>
                </ul>

                <h4>6.3 Business Transfers</h4>
                <p>
                  In the event of a merger, acquisition, or sale of assets, your information may be 
                  transferred to the acquiring entity. We will notify you of any such change.
                </p>

                <h4>6.4 With Your Consent</h4>
                <p>
                  We may share your information for other purposes with your explicit consent.
                </p>

                <h4>6.5 What We Don't Do</h4>
                <p>
                  We do not sell your personal data to third parties for their marketing purposes.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 7: International Transfers */}
            <AccordionItem value="international" id="international" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                7. International Data Transfers
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Your information may be transferred to and processed in countries other than your country 
                  of residence. These countries may have different data protection laws.
                </p>
                <p>
                  When we transfer personal data outside the European Economic Area (EEA) or UK, we ensure 
                  appropriate safeguards are in place, including:
                </p>
                <ul>
                  <li><strong>Standard Contractual Clauses:</strong> EU-approved contractual terms that require recipients to protect your data.</li>
                  <li><strong>Adequacy Decisions:</strong> Transfers to countries deemed to provide adequate protection by the European Commission.</li>
                  <li><strong>Binding Corporate Rules:</strong> Internal policies approved by data protection authorities for intra-group transfers.</li>
                </ul>
                <p>
                  You may request a copy of the safeguards we use by contacting us.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 8: Data Security */}
            <AccordionItem value="security" id="security" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                8. Data Security
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  We implement appropriate technical and organizational measures to protect your personal 
                  data against unauthorized access, alteration, disclosure, or destruction.
                </p>
                <h4>Security Measures Include:</h4>
                <ul>
                  <li><strong>Encryption:</strong> Data encrypted in transit (TLS/SSL) and at rest.</li>
                  <li><strong>Access Controls:</strong> Role-based access with authentication requirements.</li>
                  <li><strong>Monitoring:</strong> Continuous security monitoring and logging.</li>
                  <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing.</li>
                  <li><strong>Employee Training:</strong> Data protection and security awareness training.</li>
                  <li><strong>Incident Response:</strong> Procedures for detecting and responding to breaches.</li>
                </ul>
                <p>
                  While we strive to protect your information, no method of transmission or storage is 
                  100% secure. We cannot guarantee absolute security.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 9: Data Retention */}
            <AccordionItem value="retention" id="retention" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                9. Data Retention
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  We retain your personal data only for as long as necessary to fulfill the purposes for 
                  which it was collected, including:
                </p>
                <ul>
                  <li><strong>Account Data:</strong> Retained while your account is active and for a reasonable period afterward for record-keeping.</li>
                  <li><strong>Content You Create:</strong> Retained while your account is active; deleted upon account deletion (subject to backup retention).</li>
                  <li><strong>Transaction Records:</strong> Retained for the period required by tax and accounting laws (typically 7 years).</li>
                  <li><strong>Usage Analytics:</strong> Aggregated data retained indefinitely; identifiable data retained for 2 years.</li>
                  <li><strong>Support Communications:</strong> Retained for 3 years after resolution.</li>
                </ul>
                <p>
                  When data is no longer needed, we securely delete or anonymize it.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 10: Your Rights */}
            <AccordionItem value="your-rights" id="your-rights" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                10. Your Rights Under Data Protection Laws
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Depending on your location, you may have the following rights regarding your personal data:
                </p>
                
                <h4>10.1 Right of Access</h4>
                <p>Request a copy of the personal data we hold about you.</p>

                <h4>10.2 Right to Rectification</h4>
                <p>Request correction of inaccurate or incomplete personal data.</p>

                <h4>10.3 Right to Erasure ("Right to be Forgotten")</h4>
                <p>Request deletion of your personal data in certain circumstances.</p>

                <h4>10.4 Right to Restriction of Processing</h4>
                <p>Request that we limit how we use your data.</p>

                <h4>10.5 Right to Data Portability</h4>
                <p>Request a copy of your data in a structured, machine-readable format.</p>

                <h4>10.6 Right to Object</h4>
                <p>Object to processing based on legitimate interests or for direct marketing.</p>

                <h4>10.7 Rights Related to Automated Decision-Making</h4>
                <p>Request human review of decisions made solely by automated means.</p>

                <h4>10.8 Right to Withdraw Consent</h4>
                <p>Withdraw consent at any time where processing is based on consent.</p>

                <h4>Exercising Your Rights</h4>
                <p>
                  To exercise any of these rights, please contact us at privacy@newtonai.com. We will 
                  respond within 30 days. You also have the right to lodge a complaint with your local 
                  data protection authority.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 11: Cookies */}
            <AccordionItem value="cookies" id="cookies" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                11. Cookies and Tracking Technologies
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>We use cookies and similar technologies to:</p>
                <ul>
                  <li>Keep you signed in;</li>
                  <li>Remember your preferences;</li>
                  <li>Understand how you use our Services;</li>
                  <li>Improve and personalize your experience;</li>
                  <li>Analyze traffic and usage patterns.</li>
                </ul>

                <h4>Types of Cookies We Use:</h4>
                <ul>
                  <li><strong>Essential Cookies:</strong> Required for the Services to function. Cannot be disabled.</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand usage patterns and improve our Services.</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences.</li>
                  <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with consent).</li>
                </ul>

                <h4>Managing Cookies</h4>
                <p>
                  You can manage cookie preferences through your browser settings. Note that disabling 
                  certain cookies may affect the functionality of our Services.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 12: Children's Privacy */}
            <AccordionItem value="children" id="children" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                12. Children's Privacy
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Our Services are not intended for children under 13 years of age. We do not knowingly 
                  collect personal information from children under 13.
                </p>
                <p>
                  Users between 13 and 18 years of age may use our Services with parental or guardian 
                  consent. If you are a parent or guardian and believe your child has provided us with 
                  personal information without your consent, please contact us.
                </p>
                <p>
                  If we learn that we have collected personal information from a child under 13, we will 
                  take steps to delete that information as quickly as possible.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 13: Changes */}
            <AccordionItem value="changes" id="changes" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                13. Changes to This Policy
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  We may update this Privacy Policy from time to time. When we make changes, we will:
                </p>
                <ul>
                  <li>Update the "Last updated" date at the top of this page;</li>
                  <li>Notify you by email for material changes (at least 30 days before they take effect);</li>
                  <li>Post a notice on our Services.</li>
                </ul>
                <p>
                  We encourage you to review this Privacy Policy periodically. Your continued use of the 
                  Services after changes become effective constitutes acceptance of the revised policy.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 14: Contact */}
            <AccordionItem value="contact" id="contact" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                14. Contact Information
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our 
                  data practices, please contact us:
                </p>
                <ul>
                  <li><strong>Privacy Inquiries:</strong> privacy@newtonai.com</li>
                  <li><strong>Data Protection Officer:</strong> dpo@newtonai.com</li>
                  <li><strong>General Contact:</strong> <Link to="/contact" className="text-primary hover:underline">/contact</Link></li>
                </ul>
                <p>
                  We are committed to resolving any concerns you may have about our collection or use of 
                  your personal data. We will respond to your inquiry within 30 days.
                </p>
                <p>
                  If you are not satisfied with our response, you have the right to lodge a complaint 
                  with your local data protection supervisory authority.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
