import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { useDeferredLoad } from "@/hooks/useDeferredLoad";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { newtonOpenRef } from "@/lib/newtonOpenRef";

import { HelmetProvider } from "react-helmet-async";
import { PodcastProvider } from "@/contexts/PodcastContext";
import { ProcessingOverlayProvider } from "@/contexts/ProcessingOverlayContext";
import { StudyProvider } from "@/contexts/StudyContext";
import { GuestTrialProvider } from "@/contexts/GuestTrialContext";
import { ScrollToTop } from "./components/ScrollToTop";
import { PageTransition } from "./components/PageTransition";
import { ChunkErrorBoundary } from "./components/ChunkErrorBoundary";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { OfflineBanner } from "./components/OfflineBanner";
import { PageSkeleton } from "./components/PageSkeleton";

// Non-critical global components lazy-loaded to reduce main thread blocking
const PodcastMiniPlayer = lazy(() => import("@/components/PodcastMiniPlayer").then(m => ({ default: m.PodcastMiniPlayer })));
const CookieConsent = lazy(() => import("./components/CookieConsent"));
const VideoPreloader = lazy(() => import("./components/VideoPreloader").then(m => ({ default: m.VideoPreloader })));
const GlobalNewtonAssistant = lazy(() => import("./components/GlobalNewtonAssistant").then(m => ({ default: m.GlobalNewtonAssistant })));

// Landing page lazy-loaded to break up main thread long task (improves Max Potential FID)
const LandingPage = lazy(() => import("./pages/LandingPage"));

// All other pages lazy-loaded
const Dashboard = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Refund = lazy(() => import("./pages/Refund"));
const Profile = lazy(() => import("./pages/Profile"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Enterprise = lazy(() => import("./pages/Enterprise"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Tools = lazy(() => import("./pages/Tools"));
const Guides = lazy(() => import("./pages/Guides"));
const HowAILearningWorks = lazy(() => import("./pages/guides/HowAILearningWorks"));
const SpacedRepetitionGuide = lazy(() => import("./pages/guides/SpacedRepetitionGuide"));
const ResponsibleAIUse = lazy(() => import("./pages/guides/ResponsibleAIUse"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Features = lazy(() => import("./pages/Features"));
const AIForStudents = lazy(() => import("./pages/AIForStudents"));

// SEO Pages
const AIStudyAssistant = lazy(() => import("./pages/seo/AIStudyAssistant"));
const AINotesGenerator = lazy(() => import("./pages/seo/AINotesGenerator"));
const PDFStudyTool = lazy(() => import("./pages/seo/PDFStudyTool"));
const AIQuizGeneratorSEO = lazy(() => import("./pages/seo/AIQuizGenerator"));
const ExamPreparationAI = lazy(() => import("./pages/seo/ExamPreparationAI"));
const AboutNewtonAIForAI = lazy(() => import("./pages/seo/AboutNewtonAIForAI"));

// Tool pages
const HomeworkHelp = lazy(() => import("./pages/tools/HomeworkHelp"));
const AIFlashcards = lazy(() => import("./pages/tools/AIFlashcards"));
const AIQuiz = lazy(() => import("./pages/tools/AIQuiz"));
const AISummarizer = lazy(() => import("./pages/tools/AISummarizer"));
const AILectureNotes = lazy(() => import("./pages/tools/AILectureNotes"));
const MindMap = lazy(() => import("./pages/tools/MindMap"));
const AIPodcast = lazy(() => import("./pages/tools/AIPodcast"));
const PDFChat = lazy(() => import("./pages/PDFChat"));

// Compare pages
const Compare = lazy(() => import("./pages/compare/Compare"));
const CheggComparison = lazy(() => import("./pages/compare/CheggComparison"));
const QuizletComparison = lazy(() => import("./pages/compare/QuizletComparison"));
const StudocuComparison = lazy(() => import("./pages/compare/StudocuComparison"));
const CourseHeroComparison = lazy(() => import("./pages/compare/CourseHeroComparison"));
const ChatGPTComparison = lazy(() => import("./pages/compare/ChatGPTComparison"));
const StudyxComparison = lazy(() => import("./pages/compare/StudyxComparison"));
const StudyFetchComparison = lazy(() => import("./pages/compare/StudyFetchComparison"));

// Payment pages
const PaymentSuccess = lazy(() => import("./pages/payment/Success"));
const PaymentFailure = lazy(() => import("./pages/payment/Failure"));

// Route guards - lazy loaded to reduce initial bundle
const AdminRoute = lazy(() => import("./components/AdminRoute").then(m => ({ default: m.AdminRoute })));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute").then(m => ({ default: m.ProtectedRoute })));
const OnboardingGate = lazy(() => import("./components/OnboardingGate").then(m => ({ default: m.OnboardingGate })));
const RoleRoute = lazy(() => import("./components/RoleRoute").then(m => ({ default: m.RoleRoute })));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminInquiries = lazy(() => import("./pages/admin/Inquiries"));
const AdminRedeemCodes = lazy(() => import("./pages/admin/RedeemCodes"));
const PitchDeck = lazy(() => import("./pages/PitchDeck"));

// Teacher pages
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const ClassDetail = lazy(() => import("./pages/teacher/ClassDetail"));

// Student class pages
const StudentClasses = lazy(() => import("./pages/student/StudentClasses"));
const StudentClassView = lazy(() => import("./pages/student/StudentClassView"));
const JoinClass = lazy(() => import("./pages/JoinClass"));
const PostSessionNotesReview = lazy(() => import("./pages/SessionNotesPage"));
const TeacherReportRoute = lazy(() => import("./pages/TeacherReportRoute"));
const StudentReportRoute = lazy(() => import("./pages/StudentReportRoute"));

// Institution pages
const InstitutionDashboard = lazy(() => import("./pages/institution/InstitutionDashboard"));
const DepartmentsPage = lazy(() => import("./pages/institution/DepartmentsPage"));
const CoursesPage = lazy(() => import("./pages/institution/CoursesPage"));
const AcademicRecordsPage = lazy(() => import("./pages/institution/AcademicRecordsPage"));
const InstitutionRoute = lazy(() => import("./components/InstitutionRoute").then(m => ({ default: m.InstitutionRoute })));
const InstitutionAnalyticsPage = lazy(() => import("./pages/institution/InstitutionAnalyticsPage"));
const ResultProcessingPage = lazy(() => import("./pages/institution/ResultProcessingPage"));
const FacultyMonitoringPage = lazy(() => import("./pages/institution/FacultyMonitoringPage"));
const CompliancePage = lazy(() => import("./pages/institution/CompliancePage"));
const InstitutionBillingPage = lazy(() => import("./pages/institution/InstitutionBillingPage"));

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  
  useEffect(() => {
    const start = () => {
      import("@/lib/prefetchRoutes").then(m => m.prefetchAllRoutes());
    };
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(start, { timeout: 5000 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const id = setTimeout(start, 3000);
      return () => clearTimeout(id);
    }
  }, []);
  
  return (
    <ChunkErrorBoundary>
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
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
        <Route path="/ai-study-assistant" element={<PageTransition><AIStudyAssistant /></PageTransition>} />
        <Route path="/ai-notes-generator" element={<PageTransition><AINotesGenerator /></PageTransition>} />
        <Route path="/pdf-study-tool" element={<PageTransition><PDFStudyTool /></PageTransition>} />
        <Route path="/ai-quiz-generator" element={<PageTransition><AIQuizGeneratorSEO /></PageTransition>} />
        <Route path="/exam-preparation-ai" element={<PageTransition><ExamPreparationAI /></PageTransition>} />
        <Route path="/about-newtonai-for-ai" element={<PageTransition><AboutNewtonAIForAI /></PageTransition>} />
        
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
        
        {/* Teacher Routes */}
        <Route path="/teacher" element={<PageTransition><ProtectedRoute><OnboardingGate><RoleRoute role="teacher"><TeacherDashboard /></RoleRoute></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/teacher/classes/:id" element={<PageTransition><ProtectedRoute><OnboardingGate><RoleRoute role="teacher"><ClassDetail /></RoleRoute></OnboardingGate></ProtectedRoute></PageTransition>} />
        
        {/* Student Class Routes */}
        <Route path="/student/classes" element={<PageTransition><ProtectedRoute><OnboardingGate><StudentClasses /></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/student/class/:id" element={<PageTransition><ProtectedRoute><OnboardingGate><StudentClassView /></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/join-class" element={<PageTransition><ProtectedRoute><JoinClass /></ProtectedRoute></PageTransition>} />
        <Route path="/session-notes/:sessionId" element={<PageTransition><ProtectedRoute><OnboardingGate><PostSessionNotesReview /></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/report/teacher/:sessionId" element={<PageTransition><ProtectedRoute><OnboardingGate><RoleRoute role="teacher"><TeacherReportRoute /></RoleRoute></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/report/student/:sessionId" element={<PageTransition><ProtectedRoute><OnboardingGate><StudentReportRoute /></OnboardingGate></ProtectedRoute></PageTransition>} />
        
        {/* Institution Routes */}
        <Route path="/institution" element={<PageTransition><ProtectedRoute><OnboardingGate><InstitutionRoute><InstitutionDashboard /></InstitutionRoute></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/institution/departments" element={<PageTransition><ProtectedRoute><OnboardingGate><InstitutionRoute><DepartmentsPage /></InstitutionRoute></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/institution/courses" element={<PageTransition><ProtectedRoute><OnboardingGate><InstitutionRoute><CoursesPage /></InstitutionRoute></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/institution/academic-records" element={<PageTransition><ProtectedRoute><OnboardingGate><InstitutionRoute><AcademicRecordsPage /></InstitutionRoute></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/institution/analytics" element={<PageTransition><ProtectedRoute><OnboardingGate><InstitutionRoute><InstitutionAnalyticsPage /></InstitutionRoute></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/institution/results" element={<PageTransition><ProtectedRoute><OnboardingGate><InstitutionRoute><ResultProcessingPage /></InstitutionRoute></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/institution/faculty" element={<PageTransition><ProtectedRoute><OnboardingGate><InstitutionRoute><FacultyMonitoringPage /></InstitutionRoute></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/institution/compliance" element={<PageTransition><ProtectedRoute><OnboardingGate><InstitutionRoute><CompliancePage /></InstitutionRoute></OnboardingGate></ProtectedRoute></PageTransition>} />
        <Route path="/institution/billing" element={<PageTransition><ProtectedRoute><OnboardingGate><InstitutionRoute><InstitutionBillingPage /></InstitutionRoute></OnboardingGate></ProtectedRoute></PageTransition>} />
        
        {/* Admin Routes */}
        <Route path="/admin/analytics" element={<PageTransition><AdminRoute><AdminAnalytics /></AdminRoute></PageTransition>} />
        <Route path="/admin/users" element={<PageTransition><AdminRoute><AdminUsers /></AdminRoute></PageTransition>} />
        <Route path="/admin/inquiries" element={<PageTransition><AdminRoute><AdminInquiries /></AdminRoute></PageTransition>} />
        <Route path="/admin/redeem-codes" element={<PageTransition><AdminRoute><AdminRedeemCodes /></AdminRoute></PageTransition>} />
        
        {/* Pitch Deck */}
        <Route path="/pitch-deck" element={<PitchDeck />} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </Suspense>
    </ChunkErrorBoundary>
  );
}




function DeferredComponents() {
  const ready = useDeferredLoad(8000);
  if (!ready) return null;
  return (
    <>
      <Suspense fallback={null}><VideoPreloader /></Suspense>
      <Suspense fallback={null}><PodcastMiniPlayer /></Suspense>
      <Suspense fallback={null}><CookieConsent /></Suspense>
      <Suspense fallback={null}><GlobalNewtonAssistant onRegisterOpen={(fn) => { newtonOpenRef.current = fn; }} /></Suspense>
      <MobileBottomNav />
    </>
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
            {/* VideoPreloader moved to DeferredComponents */}
            <BrowserRouter>
              <ScrollToTop />
              <GuestTrialProvider>
                <PodcastProvider>
                  <AnimatedRoutes />
                  <DeferredComponents />
                </PodcastProvider>
              </GuestTrialProvider>
            </BrowserRouter>
          </TooltipProvider>
        </StudyProvider>
      </ProcessingOverlayProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
