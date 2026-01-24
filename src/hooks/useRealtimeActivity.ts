import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RealtimeActivity {
  topicCounts: Map<string, number>;
  totalActiveUsers: number;
  lastUpdated: Date;
}

// Topic keywords for categorization
const topicKeywords: Record<string, RegExp> = {
  "Physics": /physics|friction|newton|velocity|acceleration|gravity|force|momentum|thermodynamics|quantum/i,
  "Electronics": /circuit|diode|transistor|resistor|capacitor|voltage|current|ohm|electronics|arduino/i,
  "Chemistry": /chemistry|molecule|atom|reaction|compound|acid|base|organic|inorganic|bond|electron/i,
  "Biology": /biology|cell|dna|rna|gene|protein|organism|evolution|ecology|anatomy|photosynthesis/i,
  "Calculus": /calculus|integral|derivative|limit|differential|equation|algebra|geometry|trigonometry|theorem/i,
  "Mathematics": /math|number|formula|calculation|arithmetic|logarithm/i,
  "History": /history|war|century|empire|revolution|ancient|medieval|civilization|president|dynasty/i,
  "Economics": /economics|market|price|demand|supply|gdp|inflation|trade|finance|investment|monetary/i,
  "Programming": /programming|code|function|algorithm|variable|python|javascript|java|software|database|api/i,
  "Language": /spanish|french|german|mandarin|japanese|korean|language|grammar|vocabulary|translation/i,
  "Psychology": /psychology|behavior|cognitive|mental|therapy|emotion|brain|consciousness|personality/i,
  "Literature": /literature|novel|poetry|author|shakespeare|story|narrative|fiction|prose/i,
  "Geography": /geography|continent|country|climate|population|region|map|terrain/i,
  "Astronomy": /astronomy|planet|star|galaxy|universe|solar|moon|orbit|telescope/i,
  "Philosophy": /philosophy|ethics|logic|metaphysics|epistemology|socrates|plato|aristotle/i,
  "Medicine": /medicine|medical|disease|treatment|diagnosis|symptom|patient|health|clinical/i,
  "Law": /law|legal|court|justice|contract|constitutional|rights|legislation/i,
  "Art": /art|painting|sculpture|renaissance|artist|museum|aesthetic|design/i,
  "Music": /music|melody|rhythm|chord|composition|symphony|instrument|harmony/i,
};

const extractTopicCategory = (text: string | null): string => {
  if (!text) return "General Studies";
  
  for (const [topic, regex] of Object.entries(topicKeywords)) {
    if (regex.test(text)) return topic;
  }
  
  return "General Studies";
};

export function useRealtimeActivity() {
  const [activity, setActivity] = useState<RealtimeActivity>({
    topicCounts: new Map(),
    totalActiveUsers: 0,
    lastUpdated: new Date(),
  });
  const [isConnected, setIsConnected] = useState(false);

  // Aggregate recent activity into topic counts
  const aggregateActivity = useCallback((records: Array<{ source_preview: string | null; title: string | null }>) => {
    const counts = new Map<string, number>();
    
    records.forEach(record => {
      const topic = extractTopicCategory(record.source_preview || record.title);
      counts.set(topic, (counts.get(topic) || 0) + 1);
    });
    
    return counts;
  }, []);

  // Fetch initial activity data
  const fetchInitialActivity = useCallback(async () => {
    try {
      // Get records from last 5 minutes to simulate "active now"
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from("generation_history")
        .select("source_preview, title, user_id")
        .gte("created_at", fiveMinutesAgo)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const topicCounts = aggregateActivity(data);
        const uniqueUsers = new Set(data.map(r => r.user_id));
        
        setActivity({
          topicCounts,
          totalActiveUsers: uniqueUsers.size,
          lastUpdated: new Date(),
        });
      }
    } catch (err) {
      console.error("Failed to fetch initial activity:", err);
    }
  }, [aggregateActivity]);

  useEffect(() => {
    // Fetch initial data
    fetchInitialActivity();

    // Set up realtime subscription
    const channel = supabase
      .channel('realtime-activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'generation_history',
        },
        (payload) => {
          const newRecord = payload.new as { source_preview: string | null; title: string | null; user_id: string };
          const topic = extractTopicCategory(newRecord.source_preview || newRecord.title);
          
          setActivity(prev => {
            const newCounts = new Map(prev.topicCounts);
            newCounts.set(topic, (newCounts.get(topic) || 0) + 1);
            
            return {
              topicCounts: newCounts,
              totalActiveUsers: prev.totalActiveUsers + 1,
              lastUpdated: new Date(),
            };
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Refresh activity data every 30 seconds
    const refreshInterval = setInterval(fetchInitialActivity, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [fetchInitialActivity]);

  // Get count for a specific topic
  const getTopicActiveCount = useCallback((topic: string): number => {
    return activity.topicCounts.get(topic) || 0;
  }, [activity.topicCounts]);

  return {
    activity,
    isConnected,
    getTopicActiveCount,
    totalActiveUsers: activity.totalActiveUsers,
  };
}
