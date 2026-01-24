import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { TrendingUp, Flame, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface TrendingTopic {
  name: string;
  icon: string;
  count: number;
  gradient: string;
  isHot?: boolean;
}

// Static fallback topics
const staticTopics: TrendingTopic[] = [
  { name: "Organic Chemistry", icon: "🧪", count: 240, gradient: "from-pink-500 to-rose-500", isHot: true },
  { name: "Calculus II", icon: "∫", count: 180, gradient: "from-blue-500 to-cyan-500", isHot: true },
  { name: "Machine Learning", icon: "🤖", count: 150, gradient: "from-purple-500 to-violet-500" },
  { name: "World History", icon: "🌍", count: 120, gradient: "from-amber-500 to-orange-500" },
  { name: "Molecular Biology", icon: "🧬", count: 98, gradient: "from-emerald-500 to-green-500" },
  { name: "Statistics", icon: "📊", count: 87, gradient: "from-indigo-500 to-blue-500" },
  { name: "Spanish Language", icon: "🇪🇸", count: 75, gradient: "from-red-500 to-orange-500" },
  { name: "Economics 101", icon: "💹", count: 68, gradient: "from-teal-500 to-cyan-500" },
];

// Topic metadata for icons and gradients
const topicMeta: Record<string, { icon: string; gradient: string }> = {
  "Physics": { icon: "⚛️", gradient: "from-blue-500 to-cyan-500" },
  "Electronics": { icon: "🔌", gradient: "from-amber-500 to-orange-500" },
  "Chemistry": { icon: "🧪", gradient: "from-pink-500 to-rose-500" },
  "Biology": { icon: "🧬", gradient: "from-emerald-500 to-green-500" },
  "Calculus": { icon: "∫", gradient: "from-purple-500 to-violet-500" },
  "Mathematics": { icon: "📐", gradient: "from-indigo-500 to-blue-500" },
  "History": { icon: "📜", gradient: "from-amber-500 to-yellow-500" },
  "Economics": { icon: "📈", gradient: "from-teal-500 to-cyan-500" },
  "Programming": { icon: "💻", gradient: "from-indigo-500 to-blue-500" },
  "Language": { icon: "🗣️", gradient: "from-red-500 to-orange-500" },
  "Psychology": { icon: "🧠", gradient: "from-pink-500 to-purple-500" },
  "Literature": { icon: "📚", gradient: "from-amber-500 to-orange-500" },
  "Geography": { icon: "🌍", gradient: "from-green-500 to-teal-500" },
  "Astronomy": { icon: "🔭", gradient: "from-violet-500 to-indigo-500" },
  "Philosophy": { icon: "💭", gradient: "from-gray-500 to-slate-500" },
  "Medicine": { icon: "⚕️", gradient: "from-red-500 to-pink-500" },
  "Law": { icon: "⚖️", gradient: "from-slate-500 to-gray-500" },
  "Art": { icon: "🎨", gradient: "from-pink-500 to-orange-500" },
  "Music": { icon: "🎵", gradient: "from-purple-500 to-pink-500" },
  "General Studies": { icon: "📚", gradient: "from-gray-500 to-slate-500" },
};

// Extract topic category from content preview
const extractTopicCategory = (text: string | null): string => {
  if (!text) return "General Studies";
  const lowered = text.toLowerCase();
  
  // Physics
  if (/physics|friction|newton|velocity|acceleration|gravity|force|momentum|thermodynamics|quantum/.test(lowered)) return "Physics";
  // Electronics/Engineering
  if (/circuit|diode|transistor|resistor|capacitor|voltage|current|ohm|electronics|arduino/.test(lowered)) return "Electronics";
  // Chemistry
  if (/chemistry|molecule|atom|reaction|compound|acid|base|organic|inorganic|bond|electron/.test(lowered)) return "Chemistry";
  // Biology
  if (/biology|cell|dna|rna|gene|protein|organism|evolution|ecology|anatomy|photosynthesis/.test(lowered)) return "Biology";
  // Mathematics/Calculus
  if (/calculus|integral|derivative|limit|differential|equation|algebra|geometry|trigonometry|theorem/.test(lowered)) return "Calculus";
  if (/math|number|formula|calculation|arithmetic|logarithm/.test(lowered)) return "Mathematics";
  // History
  if (/history|war|century|empire|revolution|ancient|medieval|civilization|president|dynasty/.test(lowered)) return "History";
  // Economics
  if (/economics|market|price|demand|supply|gdp|inflation|trade|finance|investment|monetary/.test(lowered)) return "Economics";
  // Programming
  if (/programming|code|function|algorithm|variable|python|javascript|java|software|database|api/.test(lowered)) return "Programming";
  // Languages
  if (/spanish|french|german|mandarin|japanese|korean|language|grammar|vocabulary|translation/.test(lowered)) return "Language";
  // Psychology
  if (/psychology|behavior|cognitive|mental|therapy|emotion|brain|consciousness|personality/.test(lowered)) return "Psychology";
  // Literature
  if (/literature|novel|poetry|author|shakespeare|story|narrative|fiction|prose/.test(lowered)) return "Literature";
  // Geography
  if (/geography|continent|country|climate|population|region|map|terrain/.test(lowered)) return "Geography";
  // Astronomy
  if (/astronomy|planet|star|galaxy|universe|solar|moon|orbit|telescope/.test(lowered)) return "Astronomy";
  // Philosophy
  if (/philosophy|ethics|logic|metaphysics|epistemology|socrates|plato|aristotle/.test(lowered)) return "Philosophy";
  // Medicine
  if (/medicine|medical|disease|treatment|diagnosis|symptom|patient|health|clinical/.test(lowered)) return "Medicine";
  // Law
  if (/law|legal|court|justice|contract|constitutional|rights|legislation/.test(lowered)) return "Law";
  // Art
  if (/art|painting|sculpture|renaissance|artist|museum|aesthetic|design/.test(lowered)) return "Art";
  // Music
  if (/music|melody|rhythm|chord|composition|symphony|instrument|harmony/.test(lowered)) return "Music";
  
  return "General Studies";
};

interface ToolPageTrendingTopicsProps {
  className?: string;
}

export function ToolPageTrendingTopics({ className }: ToolPageTrendingTopicsProps) {
  const ref = useRef<HTMLElement>(null);
  const [topics, setTopics] = useState<TrendingTopic[]>(staticTopics);
  const [loading, setLoading] = useState(true);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  
  const titleY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  // Fetch real trending data from generation_history
  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        // Get records from last 7 days (no auth required for anonymous aggregation)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        const { data, error } = await supabase
          .from("generation_history")
          .select("source_preview, title")
          .gte("created_at", sevenDaysAgo)
          .order("created_at", { ascending: false })
          .limit(200);

        if (error || !data || data.length < 10) {
          // Use static fallback if not enough data
          setLoading(false);
          return;
        }

        // Client-side aggregation
        const topicCounts = new Map<string, number>();
        data.forEach(record => {
          const topic = extractTopicCategory(record.source_preview || record.title);
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        });

        // Convert to array and sort
        const sortedTopics = Array.from(topicCounts.entries())
          .map(([name, count]) => ({
            name,
            count,
            icon: topicMeta[name]?.icon || "📚",
            gradient: topicMeta[name]?.gradient || "from-gray-500 to-slate-500",
            isHot: count > data.length * 0.15, // Mark as "hot" if > 15% of total
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        if (sortedTopics.length >= 4) {
          setTopics(sortedTopics);
        }
      } catch (err) {
        console.error("Failed to fetch trending topics:", err);
        // Keep static fallback on error
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTopics();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 100, damping: 15 },
    },
  };

  // Format count for display
  const formatCount = (count: number): string => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <section ref={ref} className={cn("relative", className)}>
      {/* Section Header with Parallax */}
      <motion.div 
        style={{ y: titleY }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-4"
        >
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">Trending Now</span>
          <Flame className="h-4 w-4 text-destructive animate-pulse" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold text-foreground mb-2"
        >
          Popular Topics This Week
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground max-w-lg mx-auto"
        >
          See what other students are studying right now
        </motion.p>
      </motion.div>

      {/* Trending Topics Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4"
        >
          {topics.map((topic, index) => (
            <motion.div
              key={topic.name}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.03, 
                y: -4,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              className="group relative"
            >
              <div className={cn(
                "relative overflow-hidden rounded-xl border border-border/50 bg-card p-4",
                "transition-all duration-300 hover:border-primary/30 hover:shadow-lg",
                "cursor-pointer"
              )}>
                {/* Hot badge */}
                {topic.isHot && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05, type: "spring" }}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                  >
                    <Flame className="h-3 w-3" />
                    HOT
                  </motion.div>
                )}
                
                {/* Background gradient on hover */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                  `bg-gradient-to-br ${topic.gradient}`
                )} />
                
                {/* Content */}
                <div className="relative flex flex-col items-center text-center gap-2">
                  <motion.span 
                    className="text-2xl md:text-3xl"
                    whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    {topic.icon}
                  </motion.span>
                  
                  <div>
                    <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {topic.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {formatCount(topic.count)} this week
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
