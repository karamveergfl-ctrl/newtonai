import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  History, 
  Trash2, 
  Brain, 
  Layers, 
  FileQuestion, 
  Mic, 
  FileText, 
  BookOpen, 
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { useGenerationHistory, ToolFilter } from '@/hooks/useGenerationHistory';
import { GenerationCard } from './GenerationCard';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const filterOptions: { value: ToolFilter; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: History },
  { value: 'quiz', label: 'Quiz', icon: FileQuestion },
  { value: 'flashcards', label: 'Cards', icon: Layers },
  { value: 'mind_map', label: 'Maps', icon: Brain },
  { value: 'podcast', label: 'Podcast', icon: Mic },
  { value: 'summary', label: 'Summary', icon: FileText },
  { value: 'lecture_notes', label: 'Notes', icon: BookOpen },
  { value: 'homework_help', label: 'Help', icon: HelpCircle },
];

export function GenerationHistory() {
  const { generations, loading, filter, setFilter, deleteGeneration, clearHistory } = useGenerationHistory();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Usage Dashboard Button */}
      <Button 
        variant="outline" 
        className="w-full justify-start gap-2"
        onClick={() => navigate('/profile?tab=usage')}
      >
        <BarChart3 className="h-4 w-4" />
        View Usage Dashboard
      </Button>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as ToolFilter)}>
        <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {filterOptions.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-3 py-1.5 rounded-full"
            >
              <Icon className="h-3 w-3 mr-1.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Clear History */}
      {generations.length > 0 && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-1.5" />
                Clear History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Generation History?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your generation history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Generation List */}
      {generations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg mb-1">No generations yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Start using our study tools to see your generation history here
            </p>
            <Button className="mt-4" onClick={() => navigate('/tools')}>
              Explore Tools
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {generations.map((generation, index) => (
            <GenerationCard
              key={generation.id}
              generation={generation}
              onDelete={deleteGeneration}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
