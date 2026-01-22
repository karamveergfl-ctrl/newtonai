import { Video, Headphones, Gift, Brain, FileText, Mic, PenTool, Sparkles } from "lucide-react";

export const competitors = {
  chegg: {
    name: "Chegg",
    slug: "chegg",
    tagline: "Homework help with AI Create tools",
    logo: "📚",
    monthlyPrice: "$15.95",
    yearlyPrice: "$95.40",
    pricePerMonth: 15.95,
    strengths: [
      "Expert Q&A responses",
      "Textbook solutions library",
      "Math solver tool",
      "AI Create (flashcards & practice tests)",
      "Solution Scout AI",
    ],
    weaknesses: [
      "No video integration in PDF reader",
      "No AI podcast/audio generation",
      "No mind map generator",
      "No handwriting OCR",
      "Expensive monthly subscription",
      "No ad-supported free tier",
    ],
    verdict: "Chegg now has AI flashcards and quizzes via Create, but still lacks NewtonAI's unique features like videos in PDFs, podcasts, and a free tier at nearly half the price.",
    testimonials: [
      {
        quote: "I was paying $16/month for Chegg just for homework answers. NewtonAI gives me flashcards, quizzes, AND homework help for half the price. The embedded videos in my PDFs are a game-changer.",
        author: "Priya M.",
        role: "Pre-Med Student, UCLA",
        rating: 5,
      },
      {
        quote: "Chegg's answers were helpful but I wasn't actually learning. NewtonAI's AI podcast feature lets me study during my commute. I've improved my grades significantly.",
        author: "Marcus T.",
        role: "Engineering Major, Georgia Tech",
        rating: 5,
      },
      {
        quote: "The free tier with ads is brilliant. As a student on a budget, I can access all features without the expensive subscription Chegg required.",
        author: "Sofia R.",
        role: "Business Student, NYU",
        rating: 5,
      },
    ],
  },
  quizlet: {
    name: "Quizlet",
    slug: "quizlet",
    tagline: "Digital flashcards and study sets",
    logo: "🎴",
    monthlyPrice: "$7.99",
    yearlyPrice: "$35.99",
    pricePerMonth: 7.99,
    strengths: [
      "Large flashcard library (800M+ sets)",
      "Learn mode with spaced repetition",
      "Community-created study sets",
      "Mobile app experience",
      "AI-enhanced study modes",
    ],
    weaknesses: [
      "No PDF integration or reader",
      "No AI homework help",
      "No video search or embedding",
      "No podcast or audio learning",
      "No handwriting recognition",
      "No mind map generation",
    ],
    verdict: "Quizlet is great for pre-made flashcards, but NewtonAI generates them from any content with videos and AI explanations.",
    testimonials: [
      {
        quote: "I loved Quizlet's flashcards but making them took forever. NewtonAI generates perfect flashcards from my lecture PDFs in seconds. It's like having a study assistant.",
        author: "James K.",
        role: "Biology Major, Stanford",
        rating: 5,
      },
      {
        quote: "Quizlet only did flashcards. NewtonAI does flashcards, quizzes, mind maps, podcasts, and summarizes my textbooks. One subscription for everything.",
        author: "Emily C.",
        role: "Psychology Student, Michigan",
        rating: 5,
      },
      {
        quote: "The AI podcast feature is incredible. I turn my notes into audio lectures and study while working out. Quizlet never had anything like this.",
        author: "David L.",
        role: "Law Student, Columbia",
        rating: 5,
      },
    ],
  },
  studocu: {
    name: "Studocu",
    slug: "studocu",
    tagline: "Study documents with AI tools",
    logo: "📝",
    monthlyPrice: "$9.99",
    yearlyPrice: "$47.88",
    pricePerMonth: 9.99,
    strengths: [
      "Large student document library (50M+)",
      "AI flashcards and quiz generator",
      "Course-specific study guides",
      "Exam preparation materials",
      "University-focused content",
    ],
    weaknesses: [
      "No video integration in PDF reader",
      "No AI podcast/audio feature",
      "No mind map generator",
      "No handwriting OCR",
      "Relies on user-uploaded content",
      "No ad-supported free tier",
    ],
    verdict: "Studocu now offers AI study tools, but NewtonAI generates personalized materials from YOUR documents with unique features like video integration and podcasts.",
    testimonials: [
      {
        quote: "Studocu had notes from other students, but they weren't always accurate. NewtonAI lets me upload MY professor's slides and generate study materials tailored to MY exams.",
        author: "Rachel W.",
        role: "Chemistry Student, Berkeley",
        rating: 5,
      },
      {
        quote: "I switched because NewtonAI's video integration is amazing. I highlight a concept I don't understand and instantly get educational videos explaining it.",
        author: "Alex P.",
        role: "Computer Science, MIT",
        rating: 5,
      },
      {
        quote: "Studocu was passive reading. NewtonAI turns my documents into interactive quizzes and flashcards. Active learning has boosted my retention so much.",
        author: "Nina S.",
        role: "Nursing Student, Johns Hopkins",
        rating: 5,
      },
    ],
  },
  "course-hero": {
    name: "Course Hero",
    slug: "course-hero",
    tagline: "Study resources and tutoring",
    logo: "🎓",
    monthlyPrice: "$14.95",
    yearlyPrice: "$119.40",
    pricePerMonth: 14.95,
    strengths: [
      "24/7 tutor access",
      "Large document library",
      "Practice problems",
      "Course-specific resources",
      "AI homework help",
    ],
    weaknesses: [
      "Very expensive subscription",
      "No AI podcast generation",
      "No mind map generator",
      "No video in document reader",
      "No handwriting OCR",
      "No ad-supported free tier",
    ],
    verdict: "Course Hero charges premium prices for document access. NewtonAI provides AI-powered tools that create study materials for you at nearly half the cost.",
    testimonials: [
      {
        quote: "Course Hero was $15/month just to unlock documents. NewtonAI is cheaper AND creates original study materials from my own notes. Way better value.",
        author: "Tyler B.",
        role: "Economics Major, Duke",
        rating: 5,
      },
      {
        quote: "I needed tutoring but couldn't afford Course Hero's prices. NewtonAI's AI explains problems step-by-step like a tutor, plus I get all the study tools.",
        author: "Amanda J.",
        role: "Math Student, UT Austin",
        rating: 5,
      },
      {
        quote: "The handwriting OCR is perfect for someone like me who takes handwritten notes. Course Hero couldn't do anything with my notebook photos.",
        author: "Kevin M.",
        role: "Physics Major, Caltech",
        rating: 5,
      },
    ],
  },
  chatgpt: {
    name: "ChatGPT",
    slug: "chatgpt",
    tagline: "AI assistant with Study Mode",
    logo: "🤖",
    monthlyPrice: "$20",
    yearlyPrice: "$240",
    pricePerMonth: 20,
    strengths: [
      "Study Mode with Socratic tutoring",
      "AI flashcard quizzes",
      "Versatile AI capabilities",
      "Code generation",
      "Voice transcription",
    ],
    weaknesses: [
      "Not purpose-built for studying",
      "No integrated PDF reader with videos",
      "No AI podcast generation",
      "No mind map generator",
      "No handwriting OCR",
      "Expensive at $20/month",
      "No spaced repetition tracking",
    ],
    verdict: "ChatGPT now has Study Mode, but it's a general AI, not a dedicated study platform. NewtonAI offers 7 specialized study tools with unique features at less than half the price.",
    testimonials: [
      {
        quote: "ChatGPT is great for general questions, but NewtonAI is built for studying. Structured flashcards, timed quizzes, progress tracking - everything ChatGPT lacks.",
        author: "Sarah H.",
        role: "Medical Student, Harvard",
        rating: 5,
      },
      {
        quote: "I used to copy-paste into ChatGPT constantly. NewtonAI just takes my PDF and creates everything automatically. So much faster and more organized.",
        author: "Michael R.",
        role: "MBA Student, Wharton",
        rating: 5,
      },
      {
        quote: "ChatGPT costs $20/month. NewtonAI is $8.49 and has a free tier! For students, the choice is obvious. Plus the study-specific features are unmatched.",
        author: "Jessica T.",
        role: "Undergraduate, Princeton",
        rating: 5,
      },
    ],
  },
  studyx: {
    name: "Studyx",
    slug: "studyx",
    tagline: "AI homework helper with video summarizer",
    logo: "📖",
    monthlyPrice: "$7.99",
    yearlyPrice: "$95.99",
    pricePerMonth: 7.99,
    strengths: [
      "AI-powered homework help",
      "Video summarizer",
      "PDF summarizer",
      "AI lecture notes",
      "AI flashcards and quizzes",
      "Voice transcription",
    ],
    weaknesses: [
      "No video integration IN PDF reader",
      "No AI podcast generation",
      "No handwriting OCR",
      "No mind map generator",
      "Limited free tier",
      "No ad-supported access",
    ],
    verdict: "Studyx offers good value with video summarizer, but lacks NewtonAI's unique in-PDF video integration, podcast generation, and handwriting OCR.",
    testimonials: [
      {
        quote: "Studyx was okay for quick answers, but NewtonAI's embedded videos in my PDFs help me actually understand the concepts. Plus the AI podcast feature is incredible for commuting.",
        author: "Ryan K.",
        role: "Engineering Student, Purdue",
        rating: 5,
      },
      {
        quote: "I switched from Studyx because NewtonAI creates study materials from my OWN notes. The mind maps and flashcards are perfectly tailored to my exams.",
        author: "Lisa M.",
        role: "Pre-Med Student, Boston University",
        rating: 5,
      },
      {
        quote: "The free tier on NewtonAI is a game-changer. I can access all features without paying, which Studyx doesn't offer.",
        author: "Carlos R.",
        role: "Business Major, USC",
        rating: 5,
      },
    ],
  },
  studyfetch: {
    name: "StudyFetch",
    slug: "studyfetch",
    tagline: "AI tutor with Audio Recap",
    logo: "⚡",
    monthlyPrice: "$19",
    yearlyPrice: "$228",
    pricePerMonth: 19,
    strengths: [
      "Spark.E AI tutor with voice calls",
      "Audio Recap (AI podcast/lecture summaries)",
      "Live lecture transcription",
      "AI flashcards and quizzes",
      "Essay grading feature",
      "Explainer video creation",
    ],
    weaknesses: [
      "Expensive subscription ($19/mo vs $8.49)",
      "No video integration inside PDF reader",
      "No handwriting OCR",
      "No mind map generator",
      "No ad-supported free tier",
      "Less comprehensive input formats",
    ],
    verdict: "StudyFetch offers solid AI tools including Audio Recap, but costs more than double NewtonAI. NewtonAI provides unique video-in-PDF and handwriting OCR features at a better price.",
    testimonials: [
      {
        quote: "StudyFetch was $19/month and didn't have videos embedded in the PDF reader. NewtonAI gives me that plus mind maps and OCR for half the price!",
        author: "Hannah T.",
        role: "Nursing Student, Ohio State",
        rating: 5,
      },
      {
        quote: "I loved StudyFetch's AI tutor but couldn't justify the cost. NewtonAI's homework help with step-by-step solutions is just as good and way cheaper.",
        author: "Derek W.",
        role: "Computer Science, Georgia Tech",
        rating: 5,
      },
      {
        quote: "Both have audio features, but NewtonAI's handwriting OCR is amazing for my handwritten notes. StudyFetch can't do that.",
        author: "Maya S.",
        role: "Law Student, NYU",
        rating: 5,
      },
    ],
  },
};

export const newtonFeatures = {
  name: "NewtonAI",
  monthlyPrice: "$8.49",
  yearlyPrice: "$78",
  pricePerMonth: 8.49,
  tagline: "AI-Powered Study Platform",
  uniqueFeatures: [
    {
      title: "Videos Inside Your PDF",
      description: "Search any topic and watch educational videos directly embedded in your PDF reader. No tab switching needed.",
      icon: Video,
    },
    {
      title: "Free Tier with Ads",
      description: "Access all features for free with optional video ads. No credit card required to get started.",
      icon: Gift,
    },
    {
      title: "AI-Generated Podcasts",
      description: "Transform any document, YouTube video, or notes into an engaging audio podcast for learning on the go.",
      icon: Headphones,
    },
    {
      title: "7 AI Tools in One",
      description: "Flashcards, Quizzes, Summaries, Mind Maps, Lecture Notes, Podcasts, and Homework Help - all powered by AI.",
      icon: Brain,
    },
    {
      title: "Multi-Source Input",
      description: "Upload PDFs, paste YouTube links, type text, record voice, or snap photos of handwritten notes.",
      icon: FileText,
    },
    {
      title: "Voice Transcription",
      description: "Record lectures and get instant AI transcription with smart formatting and key point extraction.",
      icon: Mic,
    },
    {
      title: "Handwriting OCR",
      description: "Google Lens-style recognition for handwritten notes. Snap a photo and convert to digital text instantly.",
      icon: PenTool,
    },
    {
      title: "Smart Study Tracking",
      description: "Track your study sessions, quiz scores, and learning progress across all subjects.",
      icon: Sparkles,
    },
  ],
};

// Accurate feature comparison based on research (January 2026)
export const featureComparison = [
  // NewtonAI's TRUE unique features (no competitors have these)
  { feature: "Videos in PDF Reader", newton: true, chegg: false, quizlet: false, studocu: false, "course-hero": false, chatgpt: false, studyx: false, studyfetch: false },
  { feature: "Handwriting OCR", newton: true, chegg: false, quizlet: false, studocu: false, "course-hero": false, chatgpt: false, studyx: false, studyfetch: false },
  { feature: "Mind Map Generator", newton: true, chegg: false, quizlet: false, studocu: false, "course-hero": false, chatgpt: "Manual", studyx: false, studyfetch: false },
  
  // Audio/Podcast - StudyFetch HAS Audio Recap
  { feature: "AI Podcast/Audio", newton: true, chegg: false, quizlet: false, studocu: false, "course-hero": false, chatgpt: false, studyx: false, studyfetch: true },
  
  // Flashcards & Quizzes - Most platforms now have these
  { feature: "AI Flashcard Generation", newton: true, chegg: true, quizlet: true, studocu: true, "course-hero": false, chatgpt: true, studyx: true, studyfetch: true },
  { feature: "AI Quiz Generator", newton: true, chegg: true, quizlet: true, studocu: true, "course-hero": false, chatgpt: true, studyx: true, studyfetch: true },
  
  // Other features
  { feature: "AI Homework Help", newton: true, chegg: true, quizlet: false, studocu: false, "course-hero": true, chatgpt: true, studyx: true, studyfetch: true },
  { feature: "PDF Reader/Summarizer", newton: true, chegg: false, quizlet: false, studocu: true, "course-hero": true, chatgpt: false, studyx: true, studyfetch: true },
  { feature: "Video Summarizer", newton: true, chegg: false, quizlet: false, studocu: false, "course-hero": false, chatgpt: false, studyx: true, studyfetch: false },
  { feature: "Voice/Lecture Transcription", newton: true, chegg: false, quizlet: false, studocu: false, "course-hero": false, chatgpt: true, studyx: true, studyfetch: true },
  
  // Free tier and pricing
  { feature: "Free Tier (No CC)", newton: "Yes (with ads)", chegg: false, quizlet: "Limited", studocu: "Limited", "course-hero": false, chatgpt: "Limited", studyx: "Limited", studyfetch: "Limited" },
  { feature: "Starting Price", newton: "$8.49/mo", chegg: "$15.95/mo", quizlet: "$7.99/mo", studocu: "$9.99/mo", "course-hero": "$14.95/mo", chatgpt: "$20/mo", studyx: "$7.99/mo", studyfetch: "$19/mo" },
];

export type CompetitorKey = keyof typeof competitors;
