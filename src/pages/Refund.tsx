import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertCircle, CheckCircle2, XCircle, Clock, Mail } from "lucide-react";

const breadcrumbs = [
  { name: "Home", href: "/" },
  { name: "Refund Policy", href: "/refund" },
];

const Refund = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Refund Policy"
        description="NewtonAI's refund policy explained. 14-day money-back guarantee, pro-rata refunds for annual plans, and how to request a refund."
        canonicalPath="/refund"
        breadcrumbs={breadcrumbs}
        keywords="refund policy, money back guarantee, subscription refund, NewtonAI refunds, cancellation policy"
      />
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
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
            <h1 className="text-4xl font-bold font-display">Refund Policy</h1>
            <p className="text-muted-foreground">Last updated: January 21, 2026</p>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-green-700 dark:text-green-400">14-Day Guarantee</h3>
              <p className="text-sm text-muted-foreground">Full refund within 14 days of purchase</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-700 dark:text-blue-400">5-10 Business Days</h3>
              <p className="text-sm text-muted-foreground">Refund processing time</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
              <Mail className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-700 dark:text-purple-400">Easy Process</h3>
              <p className="text-sm text-muted-foreground">Email refunds@newtonai.com</p>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="bg-muted/50 rounded-lg p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li><a href="#overview" className="hover:text-foreground transition-colors">Overview</a></li>
              <li><a href="#eligibility" className="hover:text-foreground transition-colors">Refund Eligibility</a></li>
              <li><a href="#how-to-request" className="hover:text-foreground transition-colors">How to Request a Refund</a></li>
              <li><a href="#non-refundable" className="hover:text-foreground transition-colors">Non-Refundable Items</a></li>
              <li><a href="#cancellation" className="hover:text-foreground transition-colors">Subscription Cancellation</a></li>
              <li><a href="#chargebacks" className="hover:text-foreground transition-colors">Chargebacks</a></li>
              <li><a href="#exceptions" className="hover:text-foreground transition-colors">Exceptions and Special Circumstances</a></li>
              <li><a href="#contact" className="hover:text-foreground transition-colors">Contact Information</a></li>
            </ol>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {/* Section 1: Overview */}
            <AccordionItem value="overview" id="overview" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                1. Overview
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  At NewtonAI, we want you to be completely satisfied with your purchase. We understand 
                  that sometimes a product may not meet your expectations, and we've designed our refund 
                  policy to be fair and transparent.
                </p>
                <p>
                  This Refund Policy outlines the terms and conditions under which you may request a refund 
                  for our Services. By purchasing a subscription or any paid features, you agree to the 
                  terms of this policy.
                </p>
                <p>
                  We are committed to:
                </p>
                <ul>
                  <li>Providing clear and straightforward refund guidelines;</li>
                  <li>Processing all valid refund requests promptly;</li>
                  <li>Treating all customers fairly and consistently;</li>
                  <li>Resolving disputes in a reasonable manner.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Eligibility */}
            <AccordionItem value="eligibility" id="eligibility" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                2. Refund Eligibility
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4>2.1 14-Day Money-Back Guarantee</h4>
                <p>
                  You may request a <strong>full refund within fourteen (14) days</strong> of:
                </p>
                <ul>
                  <li>Your initial subscription purchase; or</li>
                  <li>The most recent renewal date of an existing subscription.</li>
                </ul>
                <p>
                  This guarantee applies to all subscription plans (monthly and annual).
                </p>

                <h4>2.2 Annual Plan Pro-Rata Refunds</h4>
                <p>
                  If you have an annual subscription and request a refund after the 14-day period, you may 
                  be eligible for a pro-rata refund of unused months, subject to the following conditions:
                </p>
                <ul>
                  <li>At least 3 full months must remain on your subscription;</li>
                  <li>A 15% administrative fee will be deducted;</li>
                  <li>Any promotional discounts will be recalculated at standard rates.</li>
                </ul>

                <h4>2.3 Conditions for Eligibility</h4>
                <p>To be eligible for a refund, you must:</p>
                <ul>
                  <li>Submit your request within the applicable timeframe;</li>
                  <li>Provide your account email and reason for the refund;</li>
                  <li>Not have previously received a refund for the same subscription type;</li>
                  <li>Not have violated our Terms of Service.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 3: How to Request */}
            <AccordionItem value="how-to-request" id="how-to-request" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                3. How to Request a Refund
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4>Step 1: Contact Us</h4>
                <p>
                  Send an email to <strong>refunds@newtonai.com</strong> with the subject line 
                  "Refund Request - [Your Email]".
                </p>

                <h4>Step 2: Provide Required Information</h4>
                <p>Include the following in your email:</p>
                <ul>
                  <li>Your account email address;</li>
                  <li>Date of purchase;</li>
                  <li>Subscription plan (Monthly/Annual, plan tier);</li>
                  <li>Reason for requesting a refund;</li>
                  <li>Any relevant order or transaction ID.</li>
                </ul>

                <h4>Step 3: Await Confirmation</h4>
                <p>
                  We will acknowledge your request within <strong>2 business days</strong> and provide 
                  a decision within <strong>5 business days</strong>.
                </p>

                <h4>Step 4: Receive Your Refund</h4>
                <p>
                  If approved, refunds are processed within <strong>5-10 business days</strong> to your 
                  original payment method. The exact timing depends on your payment provider.
                </p>

                <div className="bg-muted/50 rounded-lg p-4 mt-4">
                  <p className="text-sm">
                    <strong>Note:</strong> Refunds are issued to the original payment method. We cannot 
                    transfer refunds to different accounts or payment methods.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 4: Non-Refundable */}
            <AccordionItem value="non-refundable" id="non-refundable" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                4. Non-Refundable Items
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>The following are <strong>not eligible for refunds</strong>:</p>
                
                <div className="space-y-4 mt-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Consumed AI Credits</h5>
                      <p className="text-sm text-muted-foreground">
                        AI credits that have been used for generating content, flashcards, quizzes, 
                        or other AI-powered features.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Completed Billing Periods</h5>
                      <p className="text-sm text-muted-foreground">
                        Monthly subscriptions after the billing period has ended.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Promotional or Free Trial Conversions</h5>
                      <p className="text-sm text-muted-foreground">
                        Subscriptions purchased at promotional rates after a free trial, where the 
                        promotional terms explicitly stated non-refundability.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Accounts Terminated for Violations</h5>
                      <p className="text-sm text-muted-foreground">
                        Accounts suspended or terminated for violating our Terms of Service or 
                        Acceptable Use Policy.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Gift Subscriptions</h5>
                      <p className="text-sm text-muted-foreground">
                        Subscriptions purchased as gifts for other users (refund requests must come 
                        from the purchaser, not the recipient).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Promotional/Free Subscriptions</h5>
                      <p className="text-sm text-muted-foreground">
                        Premium access obtained through 100% discount promotional codes or free campaigns 
                        is not eligible for refunds as no payment was made.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium">Requests Outside Eligibility Window</h5>
                      <p className="text-sm text-muted-foreground">
                        Refund requests submitted after the 14-day window (except for annual plan 
                        pro-rata refunds as described above).
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 5: Cancellation */}
            <AccordionItem value="cancellation" id="cancellation" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                5. Subscription Cancellation
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4>5.1 How to Cancel</h4>
                <p>You can cancel your subscription at any time by:</p>
                <ul>
                  <li>Going to your Account Settings → Subscription → Cancel Subscription;</li>
                  <li>Emailing support@newtonai.com with your cancellation request.</li>
                </ul>

                <h4>5.2 Effect of Cancellation</h4>
                <p>When you cancel:</p>
                <ul>
                  <li>Your subscription will remain active until the end of your current billing period;</li>
                  <li>You will retain access to all premium features until that date;</li>
                  <li>No further charges will be made to your payment method;</li>
                  <li>After the billing period ends, your account will revert to the free tier.</li>
                </ul>

                <h4>5.3 No Partial Refunds for Monthly Plans</h4>
                <p>
                  Monthly subscriptions that are cancelled mid-cycle are <strong>not eligible for partial 
                  refunds</strong>. You will continue to have access until the end of your billing period.
                </p>

                <h4>5.4 Reactivation</h4>
                <p>
                  You can reactivate your subscription at any time. If you reactivate within 30 days of 
                  cancellation, your previous settings and data will be preserved.
                </p>
                
                <h4>5.5 Promotional/Free Premium Access</h4>
                <p>
                  If you obtained premium access through a 100% discount promotional code, the following terms apply:
                </p>
                <ul>
                  <li>Promotional premium access is not eligible for refunds as no payment was made;</li>
                  <li>You may voluntarily downgrade to the free tier at any time from your <Link to="/profile" className="text-primary hover:underline">Profile settings</Link>;</li>
                  <li>No compensation or credits will be provided upon cancellation of promotional access;</li>
                  <li>NewtonAI reserves the right to terminate promotional access for policy violations;</li>
                  <li>Upon termination, your account will revert to the free tier with standard limitations.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Section 6: Chargebacks */}
            <AccordionItem value="chargebacks" id="chargebacks" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                6. Chargebacks
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                      <strong>Important:</strong> We encourage you to contact us directly for refunds 
                      rather than filing a chargeback with your payment provider.
                    </p>
                  </div>
                </div>

                <h4>6.1 Chargeback Policy</h4>
                <p>
                  If you file a chargeback or dispute with your credit card company or payment provider 
                  without first attempting to resolve the issue with us:
                </p>
                <ul>
                  <li>Your account may be immediately suspended;</li>
                  <li>You may be responsible for any chargeback fees incurred (up to $25 USD);</li>
                  <li>We reserve the right to dispute the chargeback;</li>
                  <li>Future purchases may be restricted.</li>
                </ul>

                <h4>6.2 Fraudulent Chargebacks</h4>
                <p>
                  Filing a chargeback while continuing to use our Services, or filing a chargeback for 
                  services that were delivered as described, may be considered fraud. We reserve the right 
                  to pursue legal remedies in such cases.
                </p>

                <h4>6.3 Resolution</h4>
                <p>
                  If you have a billing dispute, please contact us at billing@newtonai.com. We are 
                  committed to resolving issues fairly and promptly.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 7: Exceptions */}
            <AccordionItem value="exceptions" id="exceptions" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                7. Exceptions and Special Circumstances
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <h4>7.1 Technical Issues</h4>
                <p>
                  If you experience significant technical issues that prevent you from using the Services, 
                  and we are unable to resolve them within a reasonable timeframe, you may be eligible for:
                </p>
                <ul>
                  <li>A full or partial refund;</li>
                  <li>An extension of your subscription period;</li>
                  <li>Credit towards future purchases.</li>
                </ul>

                <h4>7.2 Service Unavailability</h4>
                <p>
                  Extended service outages (exceeding 24 consecutive hours or 72 hours total in a billing 
                  period) may qualify for pro-rata credits or refunds.
                </p>

                <h4>7.3 Billing Errors</h4>
                <p>
                  If you were charged incorrectly due to a system error or were double-charged, we will 
                  refund the erroneous charge in full, regardless of the refund window.
                </p>

                <h4>7.4 Exceptional Circumstances</h4>
                <p>
                  We understand that exceptional circumstances (medical emergencies, natural disasters, etc.) 
                  may arise. We review such cases on an individual basis with compassion and flexibility. 
                  Please contact us to discuss your situation.
                </p>

                <h4>7.5 Student Hardship</h4>
                <p>
                  We recognize that students may face financial challenges. If you are experiencing 
                  financial hardship, please reach out to us. We may be able to offer alternative 
                  solutions or accommodations.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Section 8: Contact */}
            <AccordionItem value="contact" id="contact" className="border border-border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                8. Contact Information
              </AccordionTrigger>
              <AccordionContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  For refund requests or questions about this policy, please contact us:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h5 className="font-medium mb-2">Refund Requests</h5>
                    <p className="text-sm text-muted-foreground">refunds@newtonai.com</p>
                    <p className="text-xs text-muted-foreground mt-1">Response within 2 business days</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h5 className="font-medium mb-2">Billing Questions</h5>
                    <p className="text-sm text-muted-foreground">billing@newtonai.com</p>
                    <p className="text-xs text-muted-foreground mt-1">Response within 1 business day</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h5 className="font-medium mb-2">General Support</h5>
                    <p className="text-sm text-muted-foreground">support@newtonai.com</p>
                    <p className="text-xs text-muted-foreground mt-1">Response within 24 hours</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h5 className="font-medium mb-2">Contact Page</h5>
                    <Link to="/contact" className="text-sm text-primary hover:underline">/contact</Link>
                    <p className="text-xs text-muted-foreground mt-1">Contact form available</p>
                  </div>
                </div>

                <p className="mt-4">
                  This Refund Policy is part of our <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>. 
                  By using our Services, you agree to both documents.
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

export default Refund;
