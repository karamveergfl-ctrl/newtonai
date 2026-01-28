import { cn } from "@/lib/utils";
import { ToolPageStatsBar } from "./ToolPageStatsBar";
import { ToolPageFeatures } from "./ToolPageFeatures";
import { ToolPageTrendingTopics } from "./ToolPageTrendingTopics";
import { ToolPageSubjects } from "./ToolPageSubjects";
import { ToolPageOtherTools } from "./ToolPageOtherTools";
import { ToolPageRecents } from "./ToolPageRecents";
import { ToolPageWhyUse } from "./ToolPageWhyUse";
import { ToolPageFAQ } from "./ToolPageFAQ";
import { FloatingScrollTop } from "./FloatingScrollTop";
import { toolPromoData, ToolId } from "./toolPromoData";
import { AdsterraNativeBanner } from "@/components/AdsterraNativeBanner";
import { AdsterraBanner } from "@/components/AdsterraBanner";

interface ToolPagePromoSectionsProps {
  toolId: ToolId;
  showRecents?: boolean;
  className?: string;
}

export function ToolPagePromoSections({ 
  toolId, 
  showRecents = false, // Default to false since we use InlineRecents now
  className 
}: ToolPagePromoSectionsProps) {
  const data = toolPromoData[toolId];
  
  if (!data) {
    console.warn(`No promo data found for tool: ${toolId}`);
    return null;
  }

  return (
    <div className={cn("space-y-12 md:space-y-16 py-12 md:py-16", className)}>
      {/* Floating Scroll to Top Button */}
      <FloatingScrollTop />
      
      {/* Stats Bar */}
      <ToolPageStatsBar stats={data.stats} />
      
      {/* Features Grid */}
      <ToolPageFeatures features={data.features} />
      
      {/* Ads between Features and Trending Topics */}
      <AdsterraBanner />
      <AdsterraNativeBanner instanceId={`${toolId}-features`} />
      
      {/* Trending Topics - Between Features and Subjects */}
      <ToolPageTrendingTopics />
      
      {/* Subjects Grid - Only for quiz, flashcards, homework-help */}
      {data.showSubjects && <ToolPageSubjects />}
      
      {/* Ad between Subjects/Trending and Other Tools */}
      <AdsterraNativeBanner instanceId={`${toolId}-subjects`} />
      
      {/* Recents - Only if user is logged in */}
      {showRecents && <ToolPageRecents toolId={toolId} />}
      
      {/* Other Tools */}
      <ToolPageOtherTools currentToolId={toolId} />
      
      {/* FAQ Section - Above Why Use */}
      <ToolPageFAQ toolId={toolId} />
      
      {/* Why Use Section (CTA) */}
      <ToolPageWhyUse 
        title={data.whyUseTitle} 
        benefits={data.whyUseBenefits} 
      />
    </div>
  );
}
