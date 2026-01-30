import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, Play, Eye, ChevronRight, Sparkles, BookOpen, Video, RefreshCw, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { MixedContent } from './LaTeXRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import { SolutionPipeline, PipelineStage } from './SolutionPipeline';
import { VideoGate } from './VideoGate';
import { CreditBadge } from './CreditBadge';
import { VideoPlayer } from './VideoPlayer';
import { FEATURE_COSTS } from '@/lib/creditConfig';
import { useStudyContext } from '@/contexts/StudyContext';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: string;
  viewCount?: string;
}

interface SolutionStep {
  stepNumber: number;
  title: string;
  content: string;
  explanation?: string;
}

interface InlineSolutionPanelProps {
  screenshot: {
    imageBase64: string;
    mimeType: string;
  };
  onClose: () => void;
}

export function InlineSolutionPanel({ screenshot, onClose }: InlineSolutionPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState<PipelineStage>('extracting');
  const [extractedText, setExtractedText] = useState('');
  const [structuredProblem, setStructuredProblem] = useState<any>(null);
  const [solution, setSolution] = useState<SolutionStep[]>([]);
  const [finalAnswer, setFinalAnswer] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('solution');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isLoadingMoreVideos, setIsLoadingMoreVideos] = useState(false);
  const [videoPageToken, setVideoPageToken] = useState<string | null>(null);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const solutionScrollRef = useRef<HTMLDivElement>(null);
  const videosScrollRef = useRef<HTMLDivElement>(null);
  const { setDeepStudy } = useStudyContext();
  
  // Swipe gesture state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  // Lock body scroll when panel is open and set deep study mode
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    setDeepStudy(true);
    return () => {
      document.body.style.overflow = '';
      setDeepStudy(false);
    };
  }, [setDeepStudy]);

  useEffect(() => {
    processProblem();
  }, [screenshot]);

  // Handle scroll to show/hide scroll-to-top button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setShowScrollTop(target.scrollTop > 300);
  };

  const scrollToTop = () => {
    const scrollRef = activeTab === 'solution' ? solutionScrollRef : videosScrollRef;
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Swipe gesture handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && activeTab === 'solution') {
      setActiveTab('videos');
    } else if (isRightSwipe && activeTab === 'videos') {
      setActiveTab('solution');
    }
    
    // Reset
    touchStartX.current = null;
    touchEndX.current = null;
  }, [activeTab]);

  const processProblem = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Extract text from image
      setLoadingStage('extracting');
      const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-text', {
        body: { imageBase64: screenshot.imageBase64, mimeType: screenshot.mimeType }
      });

      if (extractError || !extractData?.success) {
        throw new Error(extractData?.error || 'Failed to extract text from image');
      }
      setExtractedText(extractData.extractedText);

      // Step 2: Structure the problem
      setLoadingStage('structuring');
      const { data: structureData, error: structureError } = await supabase.functions.invoke('structure-problem', {
        body: { extractedText: extractData.extractedText }
      });

      if (structureError || !structureData?.success) {
        throw new Error(structureData?.error || 'Failed to structure problem');
      }
      setStructuredProblem(structureData.structuredProblem);

      // Step 3: Solve the problem
      setLoadingStage('solving');
      const { data: solveData, error: solveError } = await supabase.functions.invoke('solve-problem', {
        body: { 
          structuredProblem: structureData.structuredProblem,
          extractedText: extractData.extractedText
        }
      });

      if (solveError || !solveData?.success) {
        throw new Error(solveData?.error || 'Failed to solve problem');
      }
      setSolution(solveData.steps || []);
      setFinalAnswer(solveData.finalAnswer || '');

      // Step 4: Search for related videos
      setLoadingStage('videos');
      const searchQuery = structureData.structuredProblem?.topic || extractData.extractedText.slice(0, 100);
      const { data: videoData } = await supabase.functions.invoke('search-videos', {
        body: { query: searchQuery, maxResults: 6 }
      });

      if (videoData?.videos) {
        setVideos(videoData.videos);
        setVideoPageToken(videoData.nextPageToken || null);
        setHasMoreVideos(!!videoData.nextPageToken);
      }

      setLoadingStage('complete');

    } catch (err: any) {
      console.error('Problem solving error:', err);
      setError(err.message || 'An error occurred while solving the problem');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreVideos = async () => {
    if (isLoadingMoreVideos || !hasMoreVideos) return;
    
    try {
      setIsLoadingMoreVideos(true);
      const searchQuery = structuredProblem?.topic || extractedText.slice(0, 100);
      
      const { data: videoData } = await supabase.functions.invoke('search-videos', {
        body: { 
          query: searchQuery, 
          maxResults: 6,
          pageToken: videoPageToken 
        }
      });

      if (videoData?.videos) {
        setVideos(prev => [...prev, ...videoData.videos]);
        setVideoPageToken(videoData.nextPageToken || null);
        setHasMoreVideos(!!videoData.nextPageToken);
      } else {
        setHasMoreVideos(false);
      }
    } catch (err) {
      console.error('Error loading more videos:', err);
      setHasMoreVideos(false);
    } finally {
      setIsLoadingMoreVideos(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">AI Problem Solver</h2>
            <p className="text-sm text-muted-foreground hidden sm:block">Step-by-step solution with explanations</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content - flex-1 with min-h-0 for proper scroll */}
      <div className="flex-1 flex min-h-0">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            {/* Visual Pipeline */}
            <div className="w-full max-w-2xl mb-8">
              <SolutionPipeline currentStage={loadingStage} />
            </div>
            
            {/* Screenshot preview during loading */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 max-w-xs"
            >
              <p className="text-sm text-muted-foreground text-center mb-3">Processing your problem...</p>
              <div className="rounded-lg overflow-hidden border border-border shadow-lg">
                <img
                  src={`data:${screenshot.mimeType};base64,${screenshot.imageBase64}`}
                  alt="Captured problem"
                  className="w-full h-auto max-h-48 object-contain bg-muted/50"
                />
              </div>
            </motion.div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto mb-4">
                <X className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Error Processing Problem</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={processProblem} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="flex-1 flex min-h-0 overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Main solution area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                {/* Tab buttons styled like chip options */}
                <div className="px-3 sm:px-6 pt-3 sm:pt-4 shrink-0">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    <button
                      onClick={() => setActiveTab('solution')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        activeTab === 'solution'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <BookOpen className="h-4 w-4" />
                      Solution
                    </button>
                    <button
                      onClick={() => setActiveTab('videos')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                        activeTab === 'videos'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Video className="h-4 w-4" />
                      Videos ({videos.length})
                    </button>
                  </div>
                </div>

                <TabsContent value="solution" className="flex-1 mt-0 min-h-0 relative data-[state=inactive]:hidden">
                  <ScrollArea className="h-full" onScrollCapture={handleScroll} ref={solutionScrollRef as any}>
                    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                      {/* Problem Statement */}
                      {structuredProblem && (
                        <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border overflow-hidden">
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <span className="p-1.5 rounded-full bg-primary text-primary-foreground shrink-0">
                              <span className="text-xs font-bold">1</span>
                            </span>
                            Problem
                          </h3>
                          <div className="text-sm break-words overflow-x-auto">
                            <MixedContent content={structuredProblem.problemStatement || extractedText} />
                          </div>
                          {structuredProblem.given && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <span className="text-xs font-medium text-primary uppercase">Given:</span>
                              <div className="mt-1.5 text-sm break-words overflow-x-auto">
                                <MixedContent content={structuredProblem.given} />
                              </div>
                            </div>
                          )}
                          {structuredProblem.find && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-primary uppercase">Find:</span>
                              <div className="mt-1 text-sm break-words overflow-x-auto">
                                <MixedContent content={structuredProblem.find} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Solution Steps */}
                      <div className="space-y-3 sm:space-y-4">
                        <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                          Step-by-Step Solution:
                        </h3>
                        
                        {solution.map((step, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative pl-7 sm:pl-8"
                          >
                            {/* Step connector line */}
                            {index < solution.length - 1 && (
                              <div className="absolute left-[11px] sm:left-3 top-7 sm:top-8 bottom-0 w-0.5 bg-border" />
                            )}
                            
                            {/* Step number */}
                            <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                              {step.stepNumber || index + 1}
                            </div>
                            
                            <div className="p-3 sm:p-4 rounded-lg bg-card border border-border overflow-hidden">
                              <h4 className="font-medium mb-2 text-sm sm:text-base break-words">{step.title}</h4>
                              <div className="text-sm text-muted-foreground break-words overflow-x-auto">
                                <MixedContent content={step.content} />
                              </div>
                              {step.explanation && (
                                <div className="mt-3 p-2.5 sm:p-3 rounded bg-muted/50 text-sm overflow-hidden">
                                  <span className="text-xs font-medium text-primary uppercase block mb-1">Explanation: </span>
                                  <div className="break-words overflow-x-auto">
                                    <MixedContent content={step.explanation} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Final Answer */}
                      {finalAnswer && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 overflow-hidden"
                        >
                          <h3 className="font-semibold mb-2 flex items-center gap-2 text-primary text-sm sm:text-base">
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                            Final Answer
                          </h3>
                          <div className="text-base sm:text-lg font-medium break-words overflow-x-auto">
                            <MixedContent content={finalAnswer} />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="videos" className="flex-1 mt-0 min-h-0 relative data-[state=inactive]:hidden">
                  <ScrollArea className="h-full" onScrollCapture={handleScroll} ref={videosScrollRef as any}>
                    <div className="p-3 sm:p-6">
                      {/* Show search context */}
                      {structuredProblem?.topic && (
                        <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-lg bg-muted/50 border border-border text-xs sm:text-sm">
                          <span className="text-muted-foreground">Related videos for: </span>
                          <span className="font-medium break-words">{structuredProblem.topic}</span>
                        </div>
                      )}
                      {videos.length > 0 ? (
                        <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {videos.map((video) => (
                            <VideoGate
                              key={video.id}
                              videoId={video.id}
                              videoTitle={video.title}
                              onUnlock={() => setSelectedVideoId(video.id)}
                            >
                              <div className="group block rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors cursor-pointer">
                                <div className="relative aspect-video">
                                  <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Play className="h-12 w-12 text-white" />
                                  </div>
                                  {video.duration && (
                                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white">
                                      {video.duration}
                                    </div>
                                  )}
                                  {/* Credit cost badge */}
                                  <CreditBadge cost={FEATURE_COSTS.watch_video} className="absolute bottom-2 right-2" />
                                </div>
                                <div className="p-3">
                                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                    {video.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
                                  {video.viewCount && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                      <Eye className="h-3 w-3" />
                                      {video.viewCount} views
                                    </div>
                                  )}
                                </div>
                              </div>
                            </VideoGate>
                          ))}
                        </div>
                        
                        {/* Load More Button */}
                        {hasMoreVideos && (
                          <div className="flex justify-center mt-6">
                            <Button
                              variant="outline"
                              onClick={loadMoreVideos}
                              disabled={isLoadingMoreVideos}
                              className="gap-2"
                            >
                              {isLoadingMoreVideos ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <Video className="h-4 w-4" />
                                  Load More Videos
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No related videos found</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                {/* Floating Scroll-to-Top Button */}
                <AnimatePresence>
                  {showScrollTop && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute bottom-4 right-4 z-10"
                    >
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={scrollToTop}
                        className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <ArrowUp className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Tabs>
            </div>

            {/* Screenshot preview sidebar */}
            <div className="hidden lg:block w-64 border-l border-border bg-muted/20">
              <div className="p-4">
                <h3 className="font-medium text-sm mb-3">Captured Problem</h3>
                <div className="rounded-lg overflow-hidden border border-border">
                  <img
                    src={`data:${screenshot.mimeType};base64,${screenshot.imageBase64}`}
                    alt="Captured problem"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedVideoId && (
        <VideoPlayer videoId={selectedVideoId} onClose={() => setSelectedVideoId(null)} />
      )}
    </motion.div>
  );
}
