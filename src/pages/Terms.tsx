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

const Terms = () => {
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
            <h1 className="text-4xl font-bold font-display">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: January 6, 2026</p>
          </div>

          {/* Table of Contents */}
          <div className="bg-muted/50 rounded-lg p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li><a href="#acceptance" className="hover:text-foreground transition-colors">Acceptance of Terms</a></li>
              <li><a href="#definitions" className="hover:text-foreground transition-colors">Definitions and Interpretation</a></li>
              <li><a href="#services" className="hover:text-foreground transition-colors">Description of Services</a></li>
              <li><a href="#accounts" className="hover:text-foreground transition-colors">User Accounts and Obligations</a></li>
              <li><a href="#subscriptions" className="hover:text-foreground transition-colors">Subscriptions and Pricing</a></li>
              <li><a href="#acceptable-use" className="hover:text-foreground transition-colors">Acceptable Use Policy</a></li>
              <li><a href="#intellectual-property" className="hover:text-foreground transition-colors">Intellectual Property Rights</a></li>
              <li><a href="#refunds" className="hover:text-foreground transition-colors">Refunds and Cancellations</a></li>
              <li><a href="#limitation" className="hover:text-foreground transition-colors">Limitation of Liability</a></li>
              <li><a href="#disclaimers" className="hover:text-foreground transition-colors">Disclaimer of Warranties</a></li>
              <li><a href="#confidentiality" className="hover:text-foreground transition-colors">Confidentiality</a></li>
              <li><a href="#privacy" className="hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="#termination" className="hover:text-foreground transition-colors">Termination</a></li>
              <li><a href="#changes" className="hover:text-foreground transition-colors">Changes to Terms</a></li>
              <li><a href="#general" className="hover:text-foreground transition-colors">General Provisions</a></li>
              <li><a href="#contact" className="hover:text-foreground transition-colors">Contact Information</a></li>
            </ol>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {/* Section 1: Acceptance of Terms */}
            <AccordionItem value="acceptance" id="acceptance" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                1. Acceptance of Terms
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  This Terms of Service Agreement, together with the Privacy Policy and any applicable Order Form 
                  (collectively, the "Agreement") govern the services provided to you ("User" or "you") by NewtonAI 
                  ("we," "us," or "our").
                </p>
                <p>
                  By signing up for our services, or by downloading, installing, accessing, or otherwise using the 
                  Services (as defined below), you agree that you have read, understand, and accept this Agreement, 
                  and you agree to be bound by the terms contained herein and all terms, policies, and guidelines 
                  incorporated in the Agreement by reference (including the Privacy Policy which can be found at 
                  <Link to="/privacy" className="text-primary hover:underline"> /privacy</Link>).
                </p>
                <p>
                  <strong>If you do not agree to this Agreement, you do not have our permission to, and may not use 
                  the Services in any way.</strong> The Services are offered to you conditional on your acceptance 
                  of this Agreement.
                </p>
                <p>
                  Disputes arising under this Agreement will be resolved in accordance with the version of these 
                  terms that was in effect at the time the dispute arose.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Definitions */}
            <AccordionItem value="definitions" id="definitions" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                2. Definitions and Interpretation
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>In this Agreement, the following terms have the meanings ascribed to them:</p>
                <ul>
                  <li><strong>"Account"</strong> means the user account you create to access and use the Services.</li>
                  <li><strong>"Content"</strong> means any text, documents, images, videos, audio files, or other materials you upload, submit, or create using the Services.</li>
                  <li><strong>"Confidential Information"</strong> means information, whether written or oral, relating to business plans, trade secrets, customers, finances, and other proprietary material.</li>
                  <li><strong>"Data Protection Legislation"</strong> means all applicable data protection and privacy legislation including GDPR, UK GDPR, and applicable local laws.</li>
                  <li><strong>"Intellectual Property Rights"</strong> means patents, copyrights, trademarks, trade secrets, and all other intellectual property rights.</li>
                  <li><strong>"Personal Data"</strong> means any information relating to an identified or identifiable natural person.</li>
                  <li><strong>"Services"</strong> means the AI-powered study tools, flashcard generation, quiz creation, note-taking, PDF summarization, video summarization, and all other features provided by NewtonAI.</li>
                  <li><strong>"Subscription"</strong> means a paid plan that provides access to premium features of the Services.</li>
                  <li><strong>"User"</strong> or <strong>"you"</strong> means any individual or entity using the Services.</li>
                </ul>
                <p>In this Agreement, unless the context requires otherwise:</p>
                <ul>
                  <li>A reference to a 'person' includes a natural person, corporate or unincorporated body;</li>
                  <li>Words in the singular include the plural and vice versa;</li>
                  <li>A reference to 'writing' includes email;</li>
                  <li>A reference to legislation includes all amendments and subordinate legislation.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 3: Description of Services */}
            <AccordionItem value="services" id="services" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                3. Description of Services
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>NewtonAI provides the following Services:</p>
                <ul>
                  <li><strong>AI Homework Help:</strong> AI-powered assistance for solving academic problems and understanding concepts.</li>
                  <li><strong>AI Flashcards:</strong> Creation of flashcard decks for efficient learning and memorization.</li>
                  <li><strong>AI Quiz:</strong> Generation of practice quizzes to test knowledge retention.</li>
                  <li><strong>PDF Summarizer:</strong> Extraction and summarization of key information from PDF documents.</li>
                  <li><strong>Video Summarizer:</strong> Analysis and summarization of educational video content.</li>
                  <li><strong>AI Lecture Notes:</strong> Conversion of lecture content into organized study materials.</li>
                  <li><strong>Mind Maps:</strong> Visual organization of concepts and their relationships.</li>
                </ul>
                <p>
                  We reserve the right to modify, suspend, or discontinue any aspect of the Services at any time, 
                  with or without notice. We shall not be liable to you or any third party for any modification, 
                  suspension, or discontinuation of the Services.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 4: User Accounts */}
            <AccordionItem value="accounts" id="accounts" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                4. User Accounts and Obligations
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4>4.1 Account Creation</h4>
                <p>
                  To access certain features of the Services, you must create an Account. You agree to provide 
                  accurate, current, and complete information during registration and to update such information 
                  to keep it accurate, current, and complete.
                </p>
                
                <h4>4.2 Account Security</h4>
                <p>
                  You are responsible for maintaining the confidentiality of your Account credentials and for all 
                  activities that occur under your Account. You agree to notify us immediately of any unauthorized 
                  use of your Account.
                </p>
                
                <h4>4.3 Account Eligibility</h4>
                <p>
                  You must be at least 13 years old to use the Services. If you are under 18, you represent that 
                  you have your parent's or guardian's permission to use the Services.
                </p>
                
                <h4>4.4 User Obligations</h4>
                <p>You agree to:</p>
                <ul>
                  <li>Provide accurate and complete information;</li>
                  <li>Comply with all applicable laws and regulations;</li>
                  <li>Not share your Account credentials with others;</li>
                  <li>Not use the Services for any unlawful purpose;</li>
                  <li>Not interfere with or disrupt the Services;</li>
                  <li>Not attempt to gain unauthorized access to any systems or networks.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 5: Subscriptions and Pricing */}
            <AccordionItem value="subscriptions" id="subscriptions" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                5. Subscriptions and Pricing
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4>5.1 Subscription Plans</h4>
                <p>
                  We offer various subscription plans with different features and pricing. Details of current 
                  plans are available on our <Link to="/pricing" className="text-primary hover:underline">Pricing page</Link>.
                </p>
                <p>
                  Subscription plans include tiered access to features. Free users receive limited monthly 
                  quotas for each feature (e.g., 3 quizzes/month, 20 min transcription). Pro and Ultra subscribers 
                  receive increased or unlimited access. Current limits are displayed on our Pricing page and 
                  may be updated periodically.
                </p>
                
                <h4>5.2 Billing</h4>
                <p>
                  Subscription fees are billed in advance on a monthly or annual basis, depending on the plan 
                  selected. All fees are non-refundable except as expressly stated in our 
                  <Link to="/refund" className="text-primary hover:underline"> Refund Policy</Link>.
                </p>
                
                <h4>5.3 Payment Currency</h4>
                <p>
                  Payments are processed in INR (Indian Rupees) or your local currency as supported. Currency 
                  conversion rates are determined by our payment processor.
                </p>
                
                <h4>5.4 Automatic Renewal</h4>
                <p>
                  Subscriptions automatically renew unless cancelled before the renewal date. You can cancel 
                  your subscription at any time through your Account settings.
                </p>
                
                <h4>5.5 Price Changes</h4>
                <p>
                  We reserve the right to change subscription prices. Price changes will be communicated at 
                  least 30 days before taking effect and will apply at the next renewal period.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 6: Acceptable Use */}
            <AccordionItem value="acceptable-use" id="acceptable-use" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                6. Acceptable Use Policy
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  NewtonAI is built to serve students, educators, and lifelong learners. By using our Services, 
                  you agree to comply with this Acceptable Use Policy.
                </p>

                <h4>6.1 General Restrictions</h4>
                <p>You agree not to use the Services in any way that:</p>
                <ul>
                  <li>Violates any applicable laws, regulations, or government requirements;</li>
                  <li>Involves fraudulent, deceptive, unfair, abusive, or predatory practices;</li>
                  <li>Infringes upon the intellectual property rights of others;</li>
                  <li>Threatens reputational damage to NewtonAI;</li>
                  <li>Engages in, encourages, promotes, or celebrates violence or physical harm;</li>
                  <li>Targets any group based on race, religion, disability, gender, sexual orientation, national origin, or any other characteristic;</li>
                  <li>Contravenes data protection regulations including GDPR.</li>
                </ul>

                <h4>6.2 Prohibited Uses</h4>
                <p>The following uses of our Services are strictly prohibited:</p>
                <ul>
                  <li><strong>Academic Dishonesty:</strong> Submitting AI-generated content as your own work in violation of your institution's academic integrity policies;</li>
                  <li><strong>Copyright Infringement:</strong> Uploading or processing copyrighted materials without proper authorization;</li>
                  <li><strong>Harmful Content:</strong> Creating, distributing, or processing content that is illegal, harmful, threatening, abusive, harassing, defamatory, or obscene;</li>
                  <li><strong>Malware Distribution:</strong> Using the Services to distribute viruses, malware, or other harmful code;</li>
                  <li><strong>Unauthorized Access:</strong> Attempting to gain unauthorized access to our systems, other users' accounts, or third-party systems;</li>
                  <li><strong>Automated Abuse:</strong> Using bots, scripts, or automated systems to access the Services without permission;</li>
                  <li><strong>Resale:</strong> Reselling, redistributing, or sublicensing the Services without written authorization;</li>
                  <li><strong>Impersonation:</strong> Impersonating others or misrepresenting your identity or affiliation;</li>
                  <li><strong>Service Disruption:</strong> Interfering with or disrupting the Services or servers;</li>
                  <li><strong>Reverse Engineering:</strong> Decompiling, disassembling, or reverse engineering any part of the Services.</li>
                </ul>

                <h4>6.3 Prohibited Content Categories</h4>
                <p>You may not use our Services to create, process, or distribute content related to:</p>
                <ul>
                  <li>Adult, sexually explicit, or pornographic material;</li>
                  <li>Gambling, betting, lotteries, or games of chance;</li>
                  <li>Financial advice, trading signals, or investment recommendations;</li>
                  <li>Medical diagnosis or treatment advice;</li>
                  <li>Legal advice or legal document preparation;</li>
                  <li>Essay mills, ghostwriting services for academic submissions, or contract cheating;</li>
                  <li>Fake certifications or fraudulent credentials;</li>
                  <li>Deepfakes, face swaps, or unauthorized use of someone's likeness;</li>
                  <li>Voice impersonations without explicit consent;</li>
                  <li>Political campaigning or propaganda;</li>
                  <li>Pyramid schemes, multi-level marketing, or get-rich-quick schemes;</li>
                  <li>Spyware, keyloggers, or surveillance tools;</li>
                  <li>Content that enables unauthorized access to data or systems.</li>
                </ul>

                <h4>6.4 Content Generation Restrictions</h4>
                <p>When using our AI-powered content generation features, you may not generate:</p>
                <ul>
                  <li>Content intended to deceive or mislead;</li>
                  <li>Fake news or disinformation;</li>
                  <li>Content impersonating real individuals without consent;</li>
                  <li>Content for fraudulent or illegal purposes;</li>
                  <li>Content that violates third-party intellectual property rights.</li>
                </ul>

                <h4>6.5 Enforcement</h4>
                <p>
                  We reserve the right to investigate and take appropriate action against anyone who violates 
                  this Acceptable Use Policy, including:
                </p>
                <ul>
                  <li>Removing or disabling access to violating content;</li>
                  <li>Suspending or terminating accounts without notice or refund;</li>
                  <li>Reporting violations to law enforcement authorities;</li>
                  <li>Pursuing legal action where appropriate.</li>
                </ul>
                <p>
                  If you believe content on our platform violates this policy, please report it to 
                  abuse@newtonai.com.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 7: Intellectual Property */}
            <AccordionItem value="intellectual-property" id="intellectual-property" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                7. Intellectual Property Rights
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4>7.1 Our Intellectual Property</h4>
                <p>
                  The Services, including all software, designs, text, graphics, and other content, are owned 
                  by NewtonAI and protected by intellectual property laws. You are granted a limited, 
                  non-exclusive, non-transferable license to use the Services for personal, non-commercial purposes.
                </p>
                
                <h4>7.2 Your Content</h4>
                <p>
                  You retain ownership of all Content you upload to the Services. By uploading Content, you 
                  grant us a non-exclusive, worldwide, royalty-free license to use, process, and store your 
                  Content solely to provide the Services to you.
                </p>
                
                <h4>7.3 Generated Content</h4>
                <p>
                  Content generated by our AI tools based on your inputs is provided for your personal use. 
                  You may use generated content for educational purposes, subject to applicable academic 
                  integrity policies.
                </p>
                
                <h4>7.4 Restrictions</h4>
                <p>You agree not to:</p>
                <ul>
                  <li>Modify, adapt, or create derivative works of the Services;</li>
                  <li>Reverse engineer, decompile, or disassemble any part of the Services;</li>
                  <li>Remove any copyright or proprietary notices;</li>
                  <li>Use the Services to develop competing products.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 8: Refunds */}
            <AccordionItem value="refunds" id="refunds" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                8. Refunds and Cancellations
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Our refund policy is designed to be fair and transparent. Please refer to our complete 
                  <Link to="/refund" className="text-primary hover:underline"> Refund Policy</Link> for detailed information.
                </p>
                <h4>8.1 Refund Eligibility</h4>
                <p>
                  You may request a refund within fourteen (14) days of the date of a one-off purchase or, 
                  in the case of a subscription service, within 14 days from the date on which the subscription 
                  was last renewed.
                </p>
                
                <h4>8.2 Cancellation</h4>
                <p>
                  You may cancel your subscription at any time through your Account settings. Upon cancellation, 
                  you will retain access to premium features until the end of your current billing period.
                </p>
                
                <h4>8.3 Chargebacks</h4>
                <p>
                  If you file a chargeback or dispute with your payment provider, we reserve the right to 
                  suspend your Account immediately and may be entitled to recover any associated fees and costs.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 9: Limitation of Liability */}
            <AccordionItem value="limitation" id="limitation" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                9. Limitation of Liability
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  To the fullest extent permitted by applicable law, in no event will NewtonAI, its partners, 
                  service providers, affiliates, or any of their respective directors, officers, employees, or 
                  agents be liable to you for any special, incidental, indirect, punitive, exemplary, or 
                  consequential damages, whether foreseeable or unforeseeable, which may arise out of or in 
                  connection with this Agreement.
                </p>
                <p>
                  Our aggregate liability, howsoever arising, under this Agreement shall not exceed the total 
                  amount paid by you to us in the six (6) month period immediately preceding the event giving 
                  rise to the liability.
                </p>
                <p>
                  Nothing in this Agreement limits our liability for: (i) fraud or fraudulent misrepresentation; 
                  (ii) death or personal injury caused by negligence; or (iii) any matter for which it would be 
                  unlawful to exclude liability.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 10: Disclaimers */}
            <AccordionItem value="disclaimers" id="disclaimers" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                10. Disclaimer of Warranties
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  <strong>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                  WHETHER EXPRESS OR IMPLIED.</strong>
                </p>
                <p>
                  We disclaim all warranties, including but not limited to implied warranties of merchantability, 
                  fitness for a particular purpose, title, and non-infringement. We do not warrant that:
                </p>
                <ul>
                  <li>The Services will meet your requirements;</li>
                  <li>The Services will be uninterrupted, timely, secure, or error-free;</li>
                  <li>The results obtained from the Services will be accurate or reliable;</li>
                  <li>Any errors in the Services will be corrected.</li>
                </ul>
                <p>
                  AI-generated content is provided for informational and educational purposes only. We do not 
                  guarantee the accuracy, completeness, or suitability of any AI-generated content.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 11: Confidentiality */}
            <AccordionItem value="confidentiality" id="confidentiality" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                11. Confidentiality
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Both parties acknowledge that they may share Confidential Information for the purposes of 
                  this Agreement. The receiving party shall not use, disclose, or otherwise take advantage of 
                  such Confidential Information, except as expressly permitted in the Agreement.
                </p>
                <p>
                  Each party shall exercise reasonable care to avoid the publication or dissemination of the 
                  other party's Confidential Information.
                </p>
                <p>
                  The obligation not to disclose Confidential Information shall survive the termination or 
                  expiry of this Agreement.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 12: Privacy */}
            <AccordionItem value="privacy" id="privacy" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                12. Privacy
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Your privacy is important to us. Our collection and use of personal information is governed 
                  by our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, 
                  which is incorporated into this Agreement by reference.
                </p>
                <p>
                  We will maintain appropriate administrative, physical, and technical safeguards for protection 
                  of the security, confidentiality, and integrity of your Personal Data.
                </p>
                <p>
                  Each party agrees to comply with all applicable Data Protection Legislation in connection 
                  with the Services.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 13: Termination */}
            <AccordionItem value="termination" id="termination" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                13. Termination
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4>13.1 Termination by You</h4>
                <p>
                  You may terminate this Agreement at any time by cancelling your subscription and deleting 
                  your Account.
                </p>
                
                <h4>13.2 Termination by Us</h4>
                <p>We may terminate this Agreement immediately if:</p>
                <ul>
                  <li>You breach any material term of this Agreement;</li>
                  <li>We reasonably believe you are engaged in fraudulent or illegal activity;</li>
                  <li>Required by law or regulatory requirements;</li>
                  <li>You violate our Acceptable Use Policy.</li>
                </ul>
                
                <h4>13.3 Effect of Termination</h4>
                <p>
                  Upon termination, your right to use the Services will immediately cease. We may retain your 
                  data as required by law or for legitimate business purposes. Termination shall not affect 
                  any accrued rights and liabilities.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 14: Changes to Terms */}
            <AccordionItem value="changes" id="changes" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                14. Changes to Terms
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  We may make changes to this Agreement from time to time. When we do, we will revise the 
                  "Last updated" date at the top of this page.
                </p>
                <p>
                  Modifications are effective immediately for new users who sign up on or after the date of 
                  publication, and <strong>30 days from the date of publication for all existing users</strong>.
                </p>
                <p>
                  If we make material changes, we will notify you by sending an email to the address associated 
                  with your Account before the changes take effect.
                </p>
                <p>
                  You may choose to terminate your agreement with us if you do not agree with the changes. 
                  Continued use of our Services beyond 30 days from the date we notify you of the changes 
                  will constitute your acceptance of the updated terms.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 15: General Provisions */}
            <AccordionItem value="general" id="general" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                15. General Provisions
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4>15.1 Entire Agreement</h4>
                <p>
                  This Agreement constitutes the entire agreement between you and NewtonAI and supersedes 
                  all previous agreements, understandings, and arrangements.
                </p>
                
                <h4>15.2 Assignment</h4>
                <p>
                  You may not assign, subcontract, or transfer any rights or obligations under this Agreement 
                  without our prior written consent.
                </p>
                
                <h4>15.3 Force Majeure</h4>
                <p>
                  Neither party shall be liable for delay or failure to perform obligations due to circumstances 
                  beyond reasonable control.
                </p>
                
                <h4>15.4 Severability</h4>
                <p>
                  If any provision of this Agreement is found invalid or unenforceable, the remaining provisions 
                  shall continue in full force and effect.
                </p>
                
                <h4>15.5 No Waiver</h4>
                <p>
                  No delay or omission in exercising any right shall be deemed a waiver of that right.
                </p>
                
                <h4>15.6 Governing Law</h4>
                <p>
                  This Agreement shall be governed by and construed in accordance with the laws of the 
                  jurisdiction in which NewtonAI operates, without regard to conflict of law principles.
                </p>
                
                <h4>15.7 Independent Parties</h4>
                <p>
                  The parties are independent businesses and not partners, principal and agent, or employer 
                  and employee.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 16: Contact */}
            <AccordionItem value="contact" id="contact" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                16. Contact Information
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  For any questions or concerns regarding these Terms of Service, please contact us:
                </p>
                <ul>
                  <li><strong>Email:</strong> legal@newtonai.com</li>
                  <li><strong>Address:</strong> NewtonAI Legal Department</li>
                  <li><strong>Contact Page:</strong> <Link to="/contact" className="text-primary hover:underline">/contact</Link></li>
                </ul>
                <p>
                  For support-related inquiries, please visit our <Link to="/faq" className="text-primary hover:underline">FAQ page</Link> or 
                  contact our support team through the <Link to="/contact" className="text-primary hover:underline">Contact page</Link>.
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

export default Terms;
