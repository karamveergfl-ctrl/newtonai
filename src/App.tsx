import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CreditsProvider } from "@/contexts/CreditsContext";
import { PodcastProvider } from "@/contexts/PodcastContext";
import { PodcastMiniPlayer } from "@/components/PodcastMiniPlayer";
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
import Enterprise from "./pages/Enterprise";

// Tool pages
import HomeworkHelp from "./pages/tools/HomeworkHelp";

import AIFlashcards from "./pages/tools/AIFlashcards";
import AIQuiz from "./pages/tools/AIQuiz";
import AISummarizer from "./pages/tools/AISummarizer";
import AILectureNotes from "./pages/tools/AILectureNotes";
import MindMap from "./pages/tools/MindMap";
import AIPodcast from "./pages/tools/AIPodcast";
import CookieConsent from "./components/CookieConsent";
import { ScrollToTop } from "./components/ScrollToTop";

// Payment pages
import PaymentSuccess from "./pages/payment/Success";
import PaymentFailure from "./pages/payment/Failure";

// Admin pages
import { AdminRoute } from "./components/AdminRoute";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminUsers from "./pages/admin/Users";
import AdminInquiries from "./pages/admin/Inquiries";
import AdminRedeemCodes from "./pages/admin/RedeemCodes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CreditsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <PodcastProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
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
              <Route path="/enterprise" element={<Enterprise />} />
              
              {/* Payment Routes */}
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/failure" element={<PaymentFailure />} />
              
              {/* Tool Routes */}
              <Route path="/tools/homework-help" element={<HomeworkHelp />} />
              
              <Route path="/tools/flashcards" element={<AIFlashcards />} />
              <Route path="/tools/quiz" element={<AIQuiz />} />
              <Route path="/tools/summarizer" element={<AISummarizer />} />
              <Route path="/tools/lecture-notes" element={<AILectureNotes />} />
              <Route path="/tools/ai-podcast" element={<AIPodcast />} />
              <Route path="/tools/mind-map" element={<MindMap />} />
              
              {/* Admin Routes */}
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/inquiries" element={<AdminRoute><AdminInquiries /></AdminRoute>} />
              <Route path="/admin/redeem-codes" element={<AdminRoute><AdminRedeemCodes /></AdminRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <PodcastMiniPlayer />
            <CookieConsent />
          </PodcastProvider>
        </BrowserRouter>
      </TooltipProvider>
    </CreditsProvider>
  </QueryClientProvider>
);

export default App;
