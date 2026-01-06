import { motion } from "framer-motion";
import { 
  FileText, 
  Brain, 
  Layers, 
  Video, 
  Mic, 
  Sparkles, 
  Upload,
  Search,
  BookOpen,
  Zap,
  TrendingUp,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GamificationBadge } from "@/components/GamificationBadge";
import { StudyTracker } from "@/components/StudyTracker";
import { UploadZone } from "@/components/UploadZone";
import { LectureRecorder } from "@/components/LectureRecorder";
import { TextToVideoSearch } from "@/components/TextToVideoSearch";
import { GlobalSearchBox } from "@/components/GlobalSearchBox";

interface UploadData {
  pdfUrl: string;
  pdfName: string;
}

interface DashboardHomeProps {
  onUploadComplete: (data: UploadData) => void;
  onTopicSearch: (query: string) => void;
  isTopicSearching: boolean;
  onOCRUpload: () => void;
  onNotesGenerated: (notes: string, title: string) => void;
}

const quickTools = [
  {
    id: "homework",
    label: "Homework Help",
    icon: Brain,
    description: "Get step-by-step solutions",
    color: "from-blue-500 to-blue-600",
    path: "/tools/homework-help"
  },
  {
    id: "flashcards",
    label: "AI Flashcards",
    icon: Layers,
    description: "Create flashcards instantly",
    color: "from-green-500 to-green-600",
    path: "/tools/flashcards"
  },
  {
    id: "quiz",
    label: "AI Quiz",
    icon: Sparkles,
    description: "Test your knowledge",
    color: "from-purple-500 to-purple-600",
    path: "/tools/quiz"
  },
  {
    id: "notes",
    label: "AI Notes",
    icon: FileText,
    description: "Smart note-taking",
    color: "from-orange-500 to-orange-600",
    path: "/tools/ai-notes"
  },
  {
    id: "video",
    label: "Video Summarizer",
    icon: Video,
    description: "Summarize any video",
    color: "from-red-500 to-red-600",
    path: "/tools/video-summarizer"
  },
  {
    id: "mindmap",
    label: "Mind Map",
    icon: BookOpen,
    description: "Visualize concepts",
    color: "from-cyan-500 to-cyan-600",
    path: "/tools/mind-map"
  }
];

const stats = [
  { label: "Study Sessions", value: "12", icon: Clock, trend: "+3 this week" },
  { label: "Cards Created", value: "156", icon: Layers, trend: "+24 today" },
  { label: "Quizzes Taken", value: "8", icon: Sparkles, trend: "85% avg score" },
];

export function DashboardHome({
  onUploadComplete,
  onTopicSearch,
  isTopicSearching,
  onOCRUpload,
  onNotesGenerated
}: DashboardHomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                Welcome back! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                What would you like to learn today?
              </p>
            </div>
            <div className="flex items-center gap-3">
              <GamificationBadge />
              <Button onClick={onOCRUpload} variant="outline" size="sm" className="gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Rewrite Handwritten</span>
              </Button>
            </div>
          </motion.div>

          {/* Main Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-2 border-primary/20 bg-card/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Search & Learn</h2>
                </div>
                <TextToVideoSearch onSearch={onTopicSearch} isSearching={isTopicSearching} />
                <div className="mt-4">
                  <GlobalSearchBox onTopicSearch={onTopicSearch} isSearching={isTopicSearching} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            {stats.map((stat, index) => (
              <Card key={stat.label} className="bg-card/60 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Quick Tools Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Quick Tools</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickTools.map((tool, index) => (
                <motion.a
                  key={tool.id}
                  href={tool.path}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group"
                >
                  <Card className="h-full bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.color} mb-3 group-hover:scale-110 transition-transform`}>
                        <tool.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-sm font-medium text-foreground mb-1">{tool.label}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
                    </CardContent>
                  </Card>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Study Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <StudyTracker />
          </motion.div>

          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Get Started</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UploadZone onUploadComplete={onUploadComplete} />
              <LectureRecorder onNotesGenerated={onNotesGenerated} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
