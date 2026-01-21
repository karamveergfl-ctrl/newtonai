import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CreditsProvider } from "@/contexts/CreditsContext";
import { PodcastProvider } from "@/contexts/PodcastContext";
import { PodcastMiniPlayer } from "@/components/PodcastMiniPlayer";
import { ScrollToTop } from "./components/ScrollToTop";
import { PageTransition } from "./components/PageTransition";
import CookieConsent from "./components/CookieConsent";

// Pages
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

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
        <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/refund" element={<PageTransition><Refund /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/credits" element={<PageTransition><Credits /></PageTransition>} />
        <Route path="/enterprise" element={<PageTransition><Enterprise /></PageTransition>} />
        
        {/* Payment Routes */}
        <Route path="/payment/success" element={<PageTransition><PaymentSuccess /></PageTransition>} />
        <Route path="/payment/failure" element={<PageTransition><PaymentFailure /></PageTransition>} />
        
        {/* Tool Routes */}
        <Route path="/tools/homework-help" element={<PageTransition><HomeworkHelp /></PageTransition>} />
        <Route path="/tools/flashcards" element={<PageTransition><AIFlashcards /></PageTransition>} />
        <Route path="/tools/quiz" element={<PageTransition><AIQuiz /></PageTransition>} />
        <Route path="/tools/summarizer" element={<PageTransition><AISummarizer /></PageTransition>} />
        <Route path="/tools/lecture-notes" element={<PageTransition><AILectureNotes /></PageTransition>} />
        <Route path="/tools/ai-podcast" element={<PageTransition><AIPodcast /></PageTransition>} />
        <Route path="/tools/mind-map" element={<PageTransition><MindMap /></PageTransition>} />
        
        {/* Admin Routes */}
        <Route path="/admin/analytics" element={<PageTransition><AdminRoute><AdminAnalytics /></AdminRoute></PageTransition>} />
        <Route path="/admin/users" element={<PageTransition><AdminRoute><AdminUsers /></AdminRoute></PageTransition>} />
        <Route path="/admin/inquiries" element={<PageTransition><AdminRoute><AdminInquiries /></AdminRoute></PageTransition>} />
        <Route path="/admin/redeem-codes" element={<PageTransition><AdminRoute><AdminRedeemCodes /></AdminRoute></PageTransition>} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CreditsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <PodcastProvider>
            <AnimatedRoutes />
            <PodcastMiniPlayer />
            <CookieConsent />
          </PodcastProvider>
        </BrowserRouter>
      </TooltipProvider>
    </CreditsProvider>
  </QueryClientProvider>
);

export default App;
