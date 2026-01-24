import { cn } from "@/lib/utils";
import { ToolPageStatsBar } from "./ToolPageStatsBar";
import { ToolPageFeatures } from "./ToolPageFeatures";
import { ToolPageSubjects } from "./ToolPageSubjects";
import { ToolPageOtherTools } from "./ToolPageOtherTools";
import { ToolPageRecents } from "./ToolPageRecents";
import { ToolPageWhyUse } from "./ToolPageWhyUse";
import { toolPromoData, ToolId } from "./toolPromoData";

interface ToolPagePromoSectionsProps {
  toolId: ToolId;
  showRecents?: boolean;
  className?: string;
}

export function ToolPagePromoSections({ 
  toolId, 
  showRecents = true,
  className 
}: ToolPagePromoSectionsProps) {
  const data = toolPromoData[toolId];
  
  if (!data) {
    console.warn(`No promo data found for tool: ${toolId}`);
    return null;
  }

  return (
    <div className={cn("space-y-12 md:space-y-16 py-12 md:py-16", className)}>
      {/* Stats Bar */}
      <ToolPageStatsBar stats={data.stats} />
      
      {/* Features Grid */}
      <ToolPageFeatures features={data.features} />
      
      {/* Subjects Grid - Only for quiz, flashcards, homework-help */}
      {data.showSubjects && <ToolPageSubjects />}
      
      {/* Recents - Only if user is logged in */}
      {showRecents && <ToolPageRecents toolId={toolId} />}
      
      {/* Other Tools */}
      <ToolPageOtherTools currentToolId={toolId} />
      
      {/* Why Use Section */}
      <ToolPageWhyUse 
        title={data.whyUseTitle} 
        benefits={data.whyUseBenefits} 
      />
    </div>
  );
}
