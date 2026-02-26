const routeImportMap: Record<string, () => Promise<unknown>> = {
  // Tool pages
  '/tools/homework-help': () => import('../pages/tools/HomeworkHelp'),
  '/tools/flashcards': () => import('../pages/tools/AIFlashcards'),
  '/tools/quiz': () => import('../pages/tools/AIQuiz'),
  '/tools/summarizer': () => import('../pages/tools/AISummarizer'),
  '/tools/lecture-notes': () => import('../pages/tools/AILectureNotes'),
  '/tools/mind-map': () => import('../pages/tools/MindMap'),
  '/tools/ai-podcast': () => import('../pages/tools/AIPodcast'),
  '/tools': () => import('../pages/Tools'),
  '/pdf-chat': () => import('../pages/PDFChat'),

  // Core pages
  '/dashboard': () => import('../pages/Index'),
  '/auth': () => import('../pages/Auth'),
  '/pricing': () => import('../pages/Pricing'),
  '/about': () => import('../pages/About'),
  '/contact': () => import('../pages/Contact'),
  '/faq': () => import('../pages/FAQ'),
  '/terms': () => import('../pages/Terms'),
  '/privacy': () => import('../pages/Privacy'),
  '/refund': () => import('../pages/Refund'),
  '/profile': () => import('../pages/Profile'),
  '/onboarding': () => import('../pages/Onboarding'),
  '/enterprise': () => import('../pages/Enterprise'),
  '/blog': () => import('../pages/Blog'),
  '/how-it-works': () => import('../pages/HowItWorks'),
  '/features': () => import('../pages/Features'),
  '/ai-for-students': () => import('../pages/AIForStudents'),

  // Guide pages
  '/guides': () => import('../pages/Guides'),
  '/guides/how-ai-learning-works': () => import('../pages/guides/HowAILearningWorks'),
  '/guides/spaced-repetition-guide': () => import('../pages/guides/SpacedRepetitionGuide'),
  '/guides/responsible-ai-use': () => import('../pages/guides/ResponsibleAIUse'),

  // SEO pages
  '/ai-study-assistant': () => import('../pages/seo/AIStudyAssistant'),
  '/ai-notes-generator': () => import('../pages/seo/AINotesGenerator'),
  '/pdf-study-tool': () => import('../pages/seo/PDFStudyTool'),
  '/ai-quiz-generator': () => import('../pages/seo/AIQuizGenerator'),
  '/exam-preparation-ai': () => import('../pages/seo/ExamPreparationAI'),
  '/about-newtonai-for-ai': () => import('../pages/seo/AboutNewtonAIForAI'),

  // Compare pages
  '/compare': () => import('../pages/compare/Compare'),
  '/compare/chegg': () => import('../pages/compare/CheggComparison'),
  '/compare/quizlet': () => import('../pages/compare/QuizletComparison'),
  '/compare/studocu': () => import('../pages/compare/StudocuComparison'),
  '/compare/course-hero': () => import('../pages/compare/CourseHeroComparison'),
  '/compare/chatgpt': () => import('../pages/compare/ChatGPTComparison'),
  '/compare/studyx': () => import('../pages/compare/StudyxComparison'),
  '/compare/studyfetch': () => import('../pages/compare/StudyFetchComparison'),

  // Payment pages
  '/payment/success': () => import('../pages/payment/Success'),
  '/payment/failure': () => import('../pages/payment/Failure'),

  // Admin pages
  '/admin/analytics': () => import('../pages/admin/Analytics'),
  '/admin/users': () => import('../pages/admin/Users'),
  '/admin/inquiries': () => import('../pages/admin/Inquiries'),
  '/admin/redeem-codes': () => import('../pages/admin/RedeemCodes'),

  // Pitch deck
  '/pitch-deck': () => import('../pages/PitchDeck'),
};

const prefetched = new Set<string>();

export function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  const loader = routeImportMap[path];
  if (loader) {
    prefetched.add(path);
    loader().catch(() => prefetched.delete(path));
  }
}

export function prefetchAllRoutes() {
  const paths = Object.keys(routeImportMap);
  let i = 0;

  function next() {
    if (i >= paths.length) return;
    prefetchRoute(paths[i++]);
    // Stagger imports to avoid saturating the network
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(next, { timeout: 2000 });
    } else {
      setTimeout(next, 100);
    }
  }

  next();
}
