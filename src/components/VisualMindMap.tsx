import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Download, Loader2, Network, Palette } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MindMapNode {
  id: string;
  text: string;
  children?: MindMapNode[];
}

interface VisualMindMapProps {
  data: MindMapNode;
  title: string;
  onClose: () => void;
  showVideoSlide?: boolean;
}

type ThemeKey = "meister" | "prism" | "colorBurst" | "ocean" | "sunset" | "vintage" | "pastel" | "bubbles";

const themes: Record<ThemeKey, { name: string; colors: string[] }> = {
  meister: {
    name: "Meister",
    colors: ["hsl(45 93% 65%)", "hsl(140 55% 60%)", "hsl(220 70% 60%)", "hsl(190 65% 55%)", "hsl(280 60% 55%)"]
  },
  prism: {
    name: "Prism",
    colors: ["hsl(0 75% 60%)", "hsl(200 80% 55%)", "hsl(40 85% 60%)", "hsl(120 50% 55%)", "hsl(280 65% 60%)"]
  },
  colorBurst: {
    name: "Color Burst",
    colors: ["hsl(340 80% 55%)", "hsl(45 90% 55%)", "hsl(160 65% 50%)", "hsl(220 75% 55%)", "hsl(280 70% 55%)"]
  },
  ocean: {
    name: "Ocean",
    colors: ["hsl(200 80% 55%)", "hsl(180 70% 50%)", "hsl(220 75% 60%)", "hsl(190 65% 55%)", "hsl(210 80% 50%)"]
  },
  sunset: {
    name: "Sunset",
    colors: ["hsl(20 90% 55%)", "hsl(40 85% 60%)", "hsl(350 75% 55%)", "hsl(30 80% 55%)", "hsl(0 70% 50%)"]
  },
  vintage: {
    name: "Vintage",
    colors: ["hsl(35 60% 55%)", "hsl(20 50% 50%)", "hsl(160 40% 50%)", "hsl(200 45% 55%)", "hsl(350 50% 50%)"]
  },
  pastel: {
    name: "Pastel",
    colors: ["hsl(340 70% 75%)", "hsl(200 70% 75%)", "hsl(45 70% 75%)", "hsl(140 60% 70%)", "hsl(280 60% 75%)"]
  },
  bubbles: {
    name: "Bubbles",
    colors: ["hsl(45 85% 65%)", "hsl(140 60% 60%)", "hsl(190 70% 55%)", "hsl(220 65% 60%)", "hsl(280 55% 60%)"]
  }
};

export const VisualMindMap = ({
  data,
  title,
  onClose,
  showVideoSlide = false
}: VisualMindMapProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("bubbles");
  const [showThemes, setShowThemes] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const downloadAsPDF = async () => {
    if (!contentRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight() - 20));
      pdf.save(`MindMap_${title.slice(0, 30)}.pdf`);

      toast({
        title: "Downloaded",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getNodeColor = (depth: number, index: number) => {
    const colors = themes[selectedTheme].colors;
    return colors[(depth + index) % colors.length];
  };

  const renderNode = (node: MindMapNode, depth: number = 0, index: number = 0, isLast: boolean = true, parentColor?: string): JSX.Element => {
    const color = parentColor || getNodeColor(depth, index);
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id} className="flex items-start gap-0">
        {depth > 0 && (
          <div className="flex items-center h-10">
            <div 
              className="w-8 h-0.5 rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        )}
        <div className="flex flex-col">
          <div 
            className={cn(
              "px-4 py-2 rounded-full font-medium text-white shadow-md transition-all hover:scale-105 cursor-pointer",
              depth === 0 && "px-6 py-3 text-lg font-bold"
            )}
            style={{ 
              backgroundColor: color,
              boxShadow: `0 4px 12px ${color}40`
            }}
          >
            {node.text}
          </div>
          
          {hasChildren && (
            <div className="flex flex-col ml-4 mt-1">
              {node.children?.map((child, childIndex) => (
                <div key={child.id} className="flex items-start">
                  <div 
                    className="w-0.5 h-8"
                    style={{ backgroundColor: getNodeColor(depth + 1, childIndex) }}
                  />
                  {renderNode(child, depth + 1, childIndex, childIndex === (node.children?.length || 0) - 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Horizontal mind map layout
  const renderHorizontalMindMap = (rootNode: MindMapNode) => {
    const leftChildren = rootNode.children?.slice(0, Math.ceil((rootNode.children?.length || 0) / 2)) || [];
    const rightChildren = rootNode.children?.slice(Math.ceil((rootNode.children?.length || 0) / 2)) || [];

    return (
      <div className="flex items-center justify-center gap-0 min-w-max py-8">
        {/* Left side branches */}
        <div className="flex flex-col items-end gap-4">
          {leftChildren.map((child, index) => (
            <div key={child.id} className="flex items-center gap-0">
              {/* Sub-children on left side (further left) */}
              {child.children && child.children.length > 0 && (
                <div className="flex flex-col items-end gap-2 mr-0">
                  {child.children.map((subChild, subIndex) => (
                    <div key={subChild.id} className="flex items-center gap-0">
                      <div 
                        className="px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-md"
                        style={{ backgroundColor: getNodeColor(2, subIndex) }}
                      >
                        {subChild.text}
                      </div>
                      <svg width="40" height="20" className="flex-shrink-0">
                        <path 
                          d="M 40 10 Q 20 10 0 10" 
                          fill="none" 
                          stroke={getNodeColor(2, subIndex)} 
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Main branch node */}
              <div 
                className="px-4 py-2 rounded-xl font-semibold text-white shadow-lg"
                style={{ 
                  backgroundColor: getNodeColor(1, index),
                  boxShadow: `0 4px 15px ${getNodeColor(1, index)}50`
                }}
              >
                {child.text}
              </div>
              
              {/* Curved connector to center */}
              <svg width="60" height="60" className="flex-shrink-0">
                <path 
                  d={`M 60 30 C 30 30, 30 ${15 + index * 10}, 0 ${30 - (index - 1) * 15}`}
                  fill="none" 
                  stroke={getNodeColor(1, index)} 
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          ))}
        </div>

        {/* Center node */}
        <div 
          className="px-8 py-4 rounded-2xl font-bold text-xl text-white shadow-xl z-10"
          style={{ 
            backgroundColor: getNodeColor(0, 0),
            boxShadow: `0 8px 30px ${getNodeColor(0, 0)}60`
          }}
        >
          {rootNode.text}
        </div>

        {/* Right side branches */}
        <div className="flex flex-col items-start gap-4">
          {rightChildren.map((child, index) => (
            <div key={child.id} className="flex items-center gap-0">
              {/* Curved connector from center */}
              <svg width="60" height="60" className="flex-shrink-0">
                <path 
                  d={`M 0 30 C 30 30, 30 ${15 + index * 10}, 60 ${30 + (index - 1) * 15}`}
                  fill="none" 
                  stroke={getNodeColor(1, leftChildren.length + index)} 
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Main branch node */}
              <div 
                className="px-4 py-2 rounded-xl font-semibold text-white shadow-lg"
                style={{ 
                  backgroundColor: getNodeColor(1, leftChildren.length + index),
                  boxShadow: `0 4px 15px ${getNodeColor(1, leftChildren.length + index)}50`
                }}
              >
                {child.text}
              </div>
              
              {/* Sub-children on right side (further right) */}
              {child.children && child.children.length > 0 && (
                <div className="flex flex-col items-start gap-2 ml-0">
                  {child.children.map((subChild, subIndex) => (
                    <div key={subChild.id} className="flex items-center gap-0">
                      <svg width="40" height="20" className="flex-shrink-0">
                        <path 
                          d="M 0 10 Q 20 10 40 10" 
                          fill="none" 
                          stroke={getNodeColor(2, subIndex + leftChildren.length)} 
                          strokeWidth="2"
                        />
                      </svg>
                      <div 
                        className="px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-md"
                        style={{ backgroundColor: getNodeColor(2, subIndex + leftChildren.length) }}
                      >
                        {subChild.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-background flex flex-col",
      showVideoSlide && "pr-80"
    )}>
      {/* Header */}
      <div className="p-4 border-b bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Mind Map</h2>
          <span className="text-sm text-muted-foreground">- {title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowThemes(!showThemes)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Palette className="w-4 h-4" />
            {themes[selectedTheme].name}
          </Button>
          <Button
            onClick={downloadAsPDF}
            variant="outline"
            size="sm"
            disabled={isDownloading}
            className="gap-2"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download PDF
          </Button>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Theme selector panel */}
      {showThemes && (
        <div className="absolute right-4 top-16 z-20 bg-card border rounded-lg shadow-xl p-4 w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Themes</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowThemes(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(themes) as ThemeKey[]).map((themeKey) => (
              <button
                key={themeKey}
                onClick={() => {
                  setSelectedTheme(themeKey);
                  setShowThemes(false);
                }}
                className={cn(
                  "p-2 rounded-lg border-2 transition-all hover:scale-105",
                  selectedTheme === themeKey ? "border-primary" : "border-transparent"
                )}
              >
                <div className="flex gap-0.5 mb-1">
                  {themes[themeKey].colors.slice(0, 4).map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-xs">{themes[themeKey].name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div 
          ref={contentRef} 
          className="p-8 bg-white min-h-full flex items-center justify-center overflow-x-auto"
        >
          {renderHorizontalMindMap(data)}
        </div>
      </ScrollArea>

      {/* Video slide area */}
      {showVideoSlide && (
        <div className="fixed inset-y-0 right-0 w-80 bg-card border-l" />
      )}
    </div>
  );
};
