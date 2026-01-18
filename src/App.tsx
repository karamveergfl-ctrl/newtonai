import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CreditsProvider } from "@/contexts/CreditsContext";
import AuthRedirect from "@/components/AuthRedirect";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";
import Profile from "./pages/Profile";
import Credits from "./pages/Credits";
import Onboarding from "./pages/Onboarding";

// Tool pages
import HomeworkHelp from "./pages/tools/HomeworkHelp";
import AINotes from "./pages/tools/AINotes";
import AIFlashcards from "./pages/tools/AIFlashcards";
import AIQuiz from "./pages/tools/AIQuiz";
import AISummarizer from "./pages/tools/AISummarizer";
import AILectureNotes from "./pages/tools/AILectureNotes";
import MindMap from "./pages/tools/MindMap";
import CookieConsent from "./components/CookieConsent";

// Payment pages
import PaymentSuccess from "./pages/payment/Success";
import PaymentFailure from "./pages/payment/Failure";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CreditsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing page - redirect authenticated users to dashboard */}
            <Route path="/" element={
              <AuthRedirect redirectTo="/dashboard" whenAuthenticated={true}>
                <LandingPage />
              </AuthRedirect>
            } />
            
            {/* Dashboard - redirect unauthenticated users to landing */}
            <Route path="/dashboard" element={
              <AuthRedirect redirectTo="/" whenAuthenticated={false}>
                <Dashboard />
              </AuthRedirect>
            } />
            
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/credits" element={<Credits />} />
            
            {/* Payment Routes */}
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failure" element={<PaymentFailure />} />
            
            {/* Tool Routes - protected */}
            <Route path="/tools/homework-help" element={
              <AuthRedirect redirectTo="/auth" whenAuthenticated={false}>
                <HomeworkHelp />
              </AuthRedirect>
            } />
            <Route path="/tools/ai-notes" element={
              <AuthRedirect redirectTo="/auth" whenAuthenticated={false}>
                <AINotes />
              </AuthRedirect>
            } />
            <Route path="/tools/flashcards" element={
              <AuthRedirect redirectTo="/auth" whenAuthenticated={false}>
                <AIFlashcards />
              </AuthRedirect>
            } />
            <Route path="/tools/quiz" element={
              <AuthRedirect redirectTo="/auth" whenAuthenticated={false}>
                <AIQuiz />
              </AuthRedirect>
            } />
            <Route path="/tools/summarizer" element={
              <AuthRedirect redirectTo="/auth" whenAuthenticated={false}>
                <AISummarizer />
              </AuthRedirect>
            } />
            <Route path="/tools/lecture-notes" element={
              <AuthRedirect redirectTo="/auth" whenAuthenticated={false}>
                <AILectureNotes />
              </AuthRedirect>
            } />
            <Route path="/tools/mind-map" element={
              <AuthRedirect redirectTo="/auth" whenAuthenticated={false}>
                <MindMap />
              </AuthRedirect>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
        </BrowserRouter>
      </TooltipProvider>
    </CreditsProvider>
  </QueryClientProvider>
);

export default App;
