import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Layers, 
  FileQuestion, 
  Mic, 
  FileText, 
  BookOpen, 
  HelpCircle,
  Trash2,
  Youtube,
  Image,
  FileType,
  Headphones
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { GenerationRecord } from '@/hooks/useGenerationHistory';

interface GenerationCardProps {
  generation: GenerationRecord;
  onDelete: (id: string) => void;
  index: number;
}

const toolIcons: Record<string, React.ElementType> = {
  quiz: FileQuestion,
  flashcards: Layers,
  mind_map: Brain,
  podcast: Mic,
  summary: FileText,
  lecture_notes: BookOpen,
  homework_help: HelpCircle,
};

const toolColors: Record<string, string> = {
  quiz: 'text-blue-500 bg-blue-500/10',
  flashcards: 'text-green-500 bg-green-500/10',
  mind_map: 'text-purple-500 bg-purple-500/10',
  podcast: 'text-pink-500 bg-pink-500/10',
  summary: 'text-amber-500 bg-amber-500/10',
  lecture_notes: 'text-cyan-500 bg-cyan-500/10',
  homework_help: 'text-orange-500 bg-orange-500/10',
};

const sourceIcons: Record<string, React.ElementType> = {
  youtube: Youtube,
  pdf: FileType,
  image: Image,
  audio: Headphones,
  text: FileText,
};

export function GenerationCard({ generation, onDelete, index }: GenerationCardProps) {
  const ToolIcon = toolIcons[generation.tool_name] || FileQuestion;
  const SourceIcon = generation.source_type ? sourceIcons[generation.source_type] || FileText : null;
  const colorClass = toolColors[generation.tool_name] || 'text-muted-foreground bg-muted';

  const getToolLabel = (toolName: string) => {
    const labels: Record<string, string> = {
      quiz: 'Quiz',
      flashcards: 'Flashcards',
      mind_map: 'Mind Map',
      podcast: 'Podcast',
      summary: 'Summary',
      lecture_notes: 'Lecture Notes',
      homework_help: 'Homework Help',
    };
    return labels[toolName] || toolName;
  };

  const getResultPreview = () => {
    if (!generation.result_preview) return null;
    
    if (generation.tool_name === 'quiz' && generation.result_preview.questionCount) {
      return `${generation.result_preview.questionCount} questions`;
    }
    if (generation.tool_name === 'flashcards' && generation.result_preview.cardCount) {
      return `${generation.result_preview.cardCount} cards`;
    }
    if (generation.tool_name === 'podcast' && generation.result_preview.duration) {
      return `${Math.round(generation.result_preview.duration / 60)} min`;
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-4 hover:border-border transition-all group border-border/50">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <ToolIcon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium truncate">
                {generation.title || getToolLabel(generation.tool_name)}
              </span>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {getToolLabel(generation.tool_name)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {SourceIcon && (
                <span className="flex items-center gap-1">
                  <SourceIcon className="h-3 w-3" />
                  {generation.source_type}
                </span>
              )}
              {getResultPreview() && (
                <>
                  <span>•</span>
                  <span>{getResultPreview()}</span>
                </>
              )}
              <span>•</span>
              <span>{formatDistanceToNow(new Date(generation.created_at), { addSuffix: true })}</span>
            </div>
            
            {generation.source_preview && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {generation.source_preview}
              </p>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={() => onDelete(generation.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
