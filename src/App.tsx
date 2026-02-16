import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import { HelmetProvider } from "react-helmet-async";
import { PodcastProvider } from "@/contexts/PodcastContext";
import { ProcessingOverlayProvider } from "@/contexts/ProcessingOverlayContext";
import { StudyProvider } from "@/contexts/StudyContext";
import { PodcastMiniPlayer } from "@/components/PodcastMiniPlayer";
import { ScrollToTop } from "./components/ScrollToTop";
import { PageTransition } from "./components/PageTransition";
import CookieConsent from "./components/CookieConsent";
import { VideoPreloader } from "./components/VideoPreloader";
import { GlobalNewtonAssistant } from "./components/GlobalNewtonAssistant";

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
import Onboarding from "./pages/Onboarding";
import Enterprise from "./pages/Enterprise";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Tools from "./pages/Tools";
import Guides from "./pages/Guides";
import HowAILearningWorks from "./pages/guides/HowAILearningWorks";
import SpacedRepetitionGuide from "./pages/guides/SpacedRepetitionGuide";
import ResponsibleAIUse from "./pages/guides/ResponsibleAIUse";
import HowItWorks from "./pages/HowItWorks";
import Features from "./pages/Features";
import AIForStudents from "./pages/AIForStudents";

// SEO Pages (lazy loaded)
import { lazy, Suspense } from "react";
const AIStudyAssistant = lazy(() => import("./pages/seo/AIStudyAssistant"));
const AINotesGenerator = lazy(() => import("./pages/seo/AINotesGenerator"));
const PDFStudyTool = lazy(() => import("./pages/seo/PDFStudyTool"));
const AIQuizGeneratorSEO = lazy(() => import("./pages/seo/AIQuizGenerator"));
const ExamPreparationAI = lazy(() => import("./pages/seo/ExamPreparationAI"));
const AboutNewtonAIForAI = lazy(() => import("./pages/seo/AboutNewtonAIForAI"));

// Tool pages
import HomeworkHelp from "./pages/tools/HomeworkHelp";
import AIFlashcards from "./pages/tools/AIFlashcards";
import AIQuiz from "./pages/tools/AIQuiz";
import AISummarizer from "./pages/tools/AISummarizer";
import AILectureNotes from "./pages/tools/AILectureNotes";
import MindMap from "./pages/tools/MindMap";
import AIPodcast from "./pages/tools/AIPodcast";
import PDFChat from "./pages/PDFChat";

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
import { OnboardingGate } from "./components/OnboardingGate";
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
        <Route path="/dashboard" element={<PageTransition><ProtectedRoute><OnboardingGate><Dashboard /></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/onboarding" element={<PageTransition><ProtectedRoute><Onboarding /></ProtectedRoute></PageTransition>} />
        <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/refund" element={<PageTransition><Refund /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><ProtectedRoute><OnboardingGate><Profile /></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/enterprise" element={<PageTransition><Enterprise /></PageTransition>} />
        <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
        <Route path="/blog/:slug" element={<PageTransition><BlogPost /></PageTransition>} />
        
        {/* Guide Routes */}
        <Route path="/guides" element={<PageTransition><Guides /></PageTransition>} />
        <Route path="/guides/how-ai-learning-works" element={<PageTransition><HowAILearningWorks /></PageTransition>} />
        <Route path="/guides/spaced-repetition-guide" element={<PageTransition><SpacedRepetitionGuide /></PageTransition>} />
        <Route path="/guides/responsible-ai-use" element={<PageTransition><ResponsibleAIUse /></PageTransition>} />
        
        {/* New Content Pages */}
        <Route path="/how-it-works" element={<PageTransition><HowItWorks /></PageTransition>} />
        <Route path="/features" element={<PageTransition><Features /></PageTransition>} />
        <Route path="/ai-for-students" element={<PageTransition><AIForStudents /></PageTransition>} />
        
        {/* SEO Content Pages */}
        <Route path="/ai-study-assistant" element={<Suspense fallback={<div />}><PageTransition><AIStudyAssistant /></PageTransition></Suspense>} />
        <Route path="/ai-notes-generator" element={<Suspense fallback={<div />}><PageTransition><AINotesGenerator /></PageTransition></Suspense>} />
        <Route path="/pdf-study-tool" element={<Suspense fallback={<div />}><PageTransition><PDFStudyTool /></PageTransition></Suspense>} />
        <Route path="/ai-quiz-generator" element={<Suspense fallback={<div />}><PageTransition><AIQuizGeneratorSEO /></PageTransition></Suspense>} />
        <Route path="/exam-preparation-ai" element={<Suspense fallback={<div />}><PageTransition><ExamPreparationAI /></PageTransition></Suspense>} />
        <Route path="/about-newtonai-for-ai" element={<Suspense fallback={<div />}><PageTransition><AboutNewtonAIForAI /></PageTransition></Suspense>} />
        
        {/* Payment Routes */}
        <Route path="/payment/success" element={<PageTransition><ProtectedRoute><OnboardingGate><PaymentSuccess /></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/payment/failure" element={<PageTransition><ProtectedRoute><OnboardingGate><PaymentFailure /></OnboardingGate></ProtectedRoute></PageTransition>} />
        
        {/* Tool Routes - Public for crawlability, auth checked inside components */}
        <Route path="/tools" element={<PageTransition><Tools /></PageTransition>} />
        <Route path="/pdf-chat" element={<PageTransition><PDFChat /></PageTransition>} />
        <Route path="/tools/homework-help" element={<PageTransition><HomeworkHelp /></PageTransition>} />
        <Route path="/tools/flashcards" element={<PageTransition><AIFlashcards /></PageTransition>} />
        <Route path="/tools/quiz" element={<PageTransition><AIQuiz /></PageTransition>} />
        <Route path="/tools/summarizer" element={<PageTransition><AISummarizer /></PageTransition>} />
        <Route path="/tools/lecture-notes" element={<PageTransition><AILectureNotes /></PageTransition>} />
        <Route path="/tools/ai-podcast" element={<PageTransition><AIPodcast /></PageTransition>} />
        <Route path="/tools/mind-map" element={<PageTransition><MindMap /></PageTransition>} />
        
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
      <ProcessingOverlayProvider>
        <StudyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {/* Global video preloader - forces browser to download & decode video at app startup */}
            <VideoPreloader />
            <BrowserRouter>
              <ScrollToTop />
              <PodcastProvider>
                <AnimatedRoutes />
                <PodcastMiniPlayer />
                <CookieConsent />
                <GlobalNewtonAssistant />
              </PodcastProvider>
            </BrowserRouter>
          </TooltipProvider>
        </StudyProvider>
      </ProcessingOverlayProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
