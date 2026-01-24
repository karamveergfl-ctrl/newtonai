import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { HelmetProvider } from "react-helmet-async";
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
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Tools from "./pages/Tools";

// Tool pages
import HomeworkHelp from "./pages/tools/HomeworkHelp";
import AIFlashcards from "./pages/tools/AIFlashcards";
import AIQuiz from "./pages/tools/AIQuiz";
import AISummarizer from "./pages/tools/AISummarizer";
import AILectureNotes from "./pages/tools/AILectureNotes";
import MindMap from "./pages/tools/MindMap";
import AIPodcast from "./pages/tools/AIPodcast";

// Compare pages
import Compare from "./pages/compare/Compare";
import CheggComparison from "./pages/compare/CheggComparison";
import QuizletComparison from "./pages/compare/QuizletComparison";
import StudocuComparison from "./pages/compare/StudocuComparison";
import CourseHeroComparison from "./pages/compare/CourseHeroComparison";
import ChatGPTComparison from "./pages/compare/ChatGPTComparison";
import StudyxComparison from "./pages/compare/StudyxComparison";
import StudyFetchComparison from "./pages/compare/StudyFetchComparison";

// Payment pages
import PaymentSuccess from "./pages/payment/Success";
import PaymentFailure from "./pages/payment/Failure";

// Admin pages
import { AdminRoute } from "./components/AdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
        <Route path="/dashboard" element={<PageTransition><ProtectedRoute><Dashboard /></ProtectedRoute></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/onboarding" element={<PageTransition><ProtectedRoute><Onboarding /></ProtectedRoute></PageTransition>} />
        <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/refund" element={<PageTransition><Refund /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><ProtectedRoute><Profile /></ProtectedRoute></PageTransition>} />
        <Route path="/credits" element={<PageTransition><ProtectedRoute><Credits /></ProtectedRoute></PageTransition>} />
        <Route path="/enterprise" element={<PageTransition><Enterprise /></PageTransition>} />
        <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
        <Route path="/blog/:slug" element={<PageTransition><BlogPost /></PageTransition>} />
        
        {/* Payment Routes */}
        <Route path="/payment/success" element={<PageTransition><ProtectedRoute><PaymentSuccess /></ProtectedRoute></PageTransition>} />
        <Route path="/payment/failure" element={<PageTransition><ProtectedRoute><PaymentFailure /></ProtectedRoute></PageTransition>} />
        
        {/* Tool Routes - All protected */}
        <Route path="/tools" element={<PageTransition><ProtectedRoute><Tools /></ProtectedRoute></PageTransition>} />
        <Route path="/tools/homework-help" element={<PageTransition><ProtectedRoute><HomeworkHelp /></ProtectedRoute></PageTransition>} />
        <Route path="/tools/flashcards" element={<PageTransition><ProtectedRoute><AIFlashcards /></ProtectedRoute></PageTransition>} />
        <Route path="/tools/quiz" element={<PageTransition><ProtectedRoute><AIQuiz /></ProtectedRoute></PageTransition>} />
        <Route path="/tools/summarizer" element={<PageTransition><ProtectedRoute><AISummarizer /></ProtectedRoute></PageTransition>} />
        <Route path="/tools/lecture-notes" element={<PageTransition><ProtectedRoute><AILectureNotes /></ProtectedRoute></PageTransition>} />
        <Route path="/tools/ai-podcast" element={<PageTransition><ProtectedRoute><AIPodcast /></ProtectedRoute></PageTransition>} />
        <Route path="/tools/mind-map" element={<PageTransition><ProtectedRoute><MindMap /></ProtectedRoute></PageTransition>} />
        
        {/* Compare Routes */}
        <Route path="/compare" element={<PageTransition><Compare /></PageTransition>} />
        <Route path="/compare/chegg" element={<PageTransition><CheggComparison /></PageTransition>} />
        <Route path="/compare/quizlet" element={<PageTransition><QuizletComparison /></PageTransition>} />
        <Route path="/compare/studocu" element={<PageTransition><StudocuComparison /></PageTransition>} />
        <Route path="/compare/course-hero" element={<PageTransition><CourseHeroComparison /></PageTransition>} />
        <Route path="/compare/chatgpt" element={<PageTransition><ChatGPTComparison /></PageTransition>} />
        <Route path="/compare/studyx" element={<PageTransition><StudyxComparison /></PageTransition>} />
        <Route path="/compare/studyfetch" element={<PageTransition><StudyFetchComparison /></PageTransition>} />
        
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
  <HelmetProvider>
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
  </HelmetProvider>
);

export default App;
