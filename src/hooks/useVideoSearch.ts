import { useState, useCallback } from "react";
import { getAuthHeaders } from "@/lib/getAuthHeaders";
import { parseSSEStream } from "@/lib/parseSSEStream";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  videoId: string;
  duration?: string;
  viewCount?: string;
}

interface SolutionData {
  content: string;
  isQuestion: boolean;
  capturedImage?: string;
  isStreaming?: boolean;
}

export function useVideoSearch() {
  const { toast } = useToast();
  const [animationVideos, setAnimationVideos] = useState<Video[]>([]);
  const [explanationVideos, setExplanationVideos] = useState<Video[]>([]);
  const [animationNextPageToken, setAnimationNextPageToken] = useState<string | null>(null);
  const [explanationNextPageToken, setExplanationNextPageToken] = useState<string | null>(null);
  const [isLoadingMoreVideos, setIsLoadingMoreVideos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showVideosPanel, setShowVideosPanel] = useState(false);
  const [solutionData, setSolutionData] = useState<SolutionData | null>(null);
  const [isTopicSearching, setIsTopicSearching] = useState(false);

  const handleSearch = useCallback(async (query: string, imageData?: string) => {
    setIsSearching(true);
    try {
      const { headers } = await getAuthHeaders();

      if (imageData) {
        setSolutionData({ content: "", isQuestion: true, capturedImage: imageData, isStreaming: true });
        setShowVideosPanel(false);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-text`,
          { method: "POST", headers, body: JSON.stringify({ imageData, stream: true }) }
        );
        if (!response.ok) throw new Error("Failed to analyze text");

        const fullContent = await parseSSEStream(response, (accumulated) => {
          setSolutionData(prev => prev ? { ...prev, content: accumulated } : null);
        });

        setSolutionData(prev => prev ? { ...prev, isStreaming: false } : null);

        const lines = fullContent.split("\n");
        let topic = "Problem Solution";
        if (lines[0]?.startsWith("TOPIC:")) {
          topic = lines[0].replace("TOPIC:", "").trim();
          const solutionContent = lines.slice(1).join("\n").trim();
          setSolutionData(prev => prev ? { ...prev, content: solutionContent } : null);
        }
        setSearchQuery(topic);

        // Fetch videos in background
        try {
          const videoResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-text`,
            { method: "POST", headers, body: JSON.stringify({ imageData, stream: false }) }
          );
          if (videoResponse.ok) {
            const videoData = await videoResponse.json();
            setAnimationVideos(videoData.animationVideos || []);
            setExplanationVideos(videoData.explanationVideos || []);
            setShowVideosPanel(true);
            toast({ title: "Videos Found!", description: `Found ${videoData.explanationVideos?.length || 0} explanation videos` });
          }
        } catch (videoError) {
          console.error("Error fetching videos:", videoError);
        }
      } else {
        setSearchQuery(query);
        setShowVideosPanel(false);
        setAnimationNextPageToken(null);
        setExplanationNextPageToken(null);

        const [animRes, explRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-youtube`, { method: "POST", headers, body: JSON.stringify({ query, type: "animation" }) }),
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-youtube`, { method: "POST", headers, body: JSON.stringify({ query, type: "explanation" }) }),
        ]);

        if (!animRes.ok || !explRes.ok) throw new Error("Failed to search videos");

        const [animData, explData] = await Promise.all([animRes.json(), explRes.json()]);
        setAnimationVideos(animData.videos || []);
        setExplanationVideos(explData.videos || []);
        setAnimationNextPageToken(animData.nextPageToken || null);
        setExplanationNextPageToken(explData.nextPageToken || null);
        setShowVideosPanel(true);
        toast({ title: "Videos Found!", description: `Found ${animData.videos?.length || 0} animations and ${explData.videos?.length || 0} explanations for "${query}"` });
      }

      // Track search
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("search_history").insert({
            user_id: user.id,
            search_query: query || "image analysis",
            is_question: !!imageData,
          });
        }
      } catch {}
    } catch (error) {
      console.error("Error analyzing text:", error);
      setSolutionData(null);
      toast({ title: "Error", description: "Failed to search. Please try again.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  const handleTopicSearch = useCallback(async (topic: string) => {
    setIsTopicSearching(true);
    setSearchQuery(topic);
    setAnimationVideos([]);
    setExplanationVideos([]);
    setAnimationNextPageToken(null);
    setExplanationNextPageToken(null);

    try {
      const { headers } = await getAuthHeaders();
      const [animRes, explRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-youtube`, { method: "POST", headers, body: JSON.stringify({ query: topic, type: "animation" }) }),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-youtube`, { method: "POST", headers, body: JSON.stringify({ query: topic, type: "explanation" }) }),
      ]);

      if (!animRes.ok || !explRes.ok) throw new Error("Failed to search videos");

      const [animData, explData] = await Promise.all([animRes.json(), explRes.json()]);
      setAnimationVideos(animData.videos || []);
      setExplanationVideos(explData.videos || []);
      setAnimationNextPageToken(animData.nextPageToken || null);
      setExplanationNextPageToken(explData.nextPageToken || null);
      setShowVideosPanel(true);
      toast({ title: "Videos Found!", description: `Found ${animData.videos?.length || 0} animations and ${explData.videos?.length || 0} explanations` });
    } catch (error) {
      console.error("Error searching topic:", error);
      toast({ title: "Error", description: "Failed to search videos", variant: "destructive" });
    } finally {
      setIsTopicSearching(false);
    }
  }, [toast]);

  const handleLoadMoreVideos = useCallback(async (type: "animation" | "explanation") => {
    const pageToken = type === "animation" ? animationNextPageToken : explanationNextPageToken;
    if (!pageToken || isLoadingMoreVideos) return;
    setIsLoadingMoreVideos(true);

    try {
      const { headers } = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-youtube`,
        { method: "POST", headers, body: JSON.stringify({ query: searchQuery, type, pageToken }) }
      );
      if (!response.ok) throw new Error("Failed to load more videos");
      const data = await response.json();

      if (type === "animation") {
        setAnimationVideos(prev => [...prev, ...(data.videos || [])]);
        setAnimationNextPageToken(data.nextPageToken || null);
      } else {
        setExplanationVideos(prev => [...prev, ...(data.videos || [])]);
        setExplanationNextPageToken(data.nextPageToken || null);
      }
      toast({ title: "More Videos Loaded", description: `Loaded ${data.videos?.length || 0} more videos` });
    } catch (error) {
      console.error("Error loading more videos:", error);
      toast({ title: "Error", description: "Failed to load more videos", variant: "destructive" });
    } finally {
      setIsLoadingMoreVideos(false);
    }
  }, [animationNextPageToken, explanationNextPageToken, isLoadingMoreVideos, searchQuery, toast]);

  const handleCloseVideosPanel = useCallback(() => {
    setShowVideosPanel(false);
    setSelectedVideoId(null);
  }, []);

  const handleVideoClick = useCallback((videoId: string) => setSelectedVideoId(videoId), []);
  const handleClosePlayer = useCallback(() => setSelectedVideoId(null), []);

  const resetSearch = useCallback(() => {
    setAnimationVideos([]);
    setExplanationVideos([]);
    setSearchQuery("");
    setSelectedVideoId(null);
    setShowVideosPanel(false);
    setSolutionData(null);
  }, []);

  return {
    animationVideos, explanationVideos,
    animationNextPageToken, explanationNextPageToken,
    isLoadingMoreVideos, searchQuery, isSearching,
    selectedVideoId, showVideosPanel,
    solutionData, setSolutionData,
    isTopicSearching,
    handleSearch, handleTopicSearch, handleLoadMoreVideos,
    handleCloseVideosPanel, handleVideoClick, handleClosePlayer,
    resetSearch,
    setAnimationVideos, setExplanationVideos, setShowVideosPanel,
  };
}
