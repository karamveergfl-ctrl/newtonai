import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Loader2, Network, Palette, ZoomIn, ZoomOut, Maximize2, LayoutGrid } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

// Sanitize text content to prevent XSS
const sanitizeText = (text: string): string => {
  if (!text) return "";
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

type ThemeKey = "radial" | "organic" | "corporate" | "neon" | "nature" | "sunset";
type LayoutType = "radial" | "tree" | "fishbone" | "org";

const themes: Record<ThemeKey, { name: string; colors: string[]; bgGradient: string }> = {
  radial: {
    name: "Ocean Depths",
    colors: ["#3B82F6", "#06B6D4", "#8B5CF6", "#10B981", "#6366F1", "#14B8A6"],
    bgGradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
  },
  organic: {
    name: "Forest",
    colors: ["#059669", "#84CC16", "#22C55E", "#10B981", "#65A30D", "#16A34A"],
    bgGradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
  },
  corporate: {
    name: "Professional",
    colors: ["#1E40AF", "#3B82F6", "#6366F1", "#4F46E5", "#2563EB", "#7C3AED"],
    bgGradient: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
  },
  neon: {
    name: "Neon Glow",
    colors: ["#F43F5E", "#EC4899", "#A855F7", "#8B5CF6", "#D946EF", "#F472B6"],
    bgGradient: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)"
  },
  nature: {
    name: "Earth Tones",
    colors: ["#92400E", "#B45309", "#D97706", "#CA8A04", "#A16207", "#78350F"],
    bgGradient: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)"
  },
  sunset: {
    name: "Sunset",
    colors: ["#DC2626", "#EA580C", "#F97316", "#FB923C", "#D97706", "#EF4444"],
    bgGradient: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)"
  }
};

const layouts: Record<LayoutType, { name: string; icon: string }> = {
  radial: { name: "Radial", icon: "🌐" },
  tree: { name: "Tree", icon: "🌳" },
  fishbone: { name: "Fishbone", icon: "🐟" },
  org: { name: "Organization", icon: "📊" }
};

export const VisualMindMap = ({
  data,
  title,
  onClose,
  showVideoSlide = false
}: VisualMindMapProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("radial");
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>("radial");
  const [showThemes, setShowThemes] = useState(false);
  const [zoom, setZoom] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-fit on mount and data change
  useEffect(() => {
    const timer = setTimeout(() => fitToScreen(), 100);
    return () => clearTimeout(timer);
  }, [data, selectedLayout]);

  const fitToScreen = useCallback(() => {
    if (!contentRef.current || !containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const content = contentRef.current.getBoundingClientRect();
    
    const scaleX = (container.width - 80) / (content.width / zoom);
    const scaleY = (container.height - 80) / (content.height / zoom);
    const newZoom = Math.min(scaleX, scaleY, 1.2);
    setZoom(Math.max(0.3, Math.min(newZoom, 1.5)));
  }, [zoom]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3));

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
      toast({ title: "Downloaded", description: "PDF downloaded successfully" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const getNodeColor = (depth: number, index: number) => {
    const colors = themes[selectedTheme].colors;
    return colors[(depth + index) % colors.length];
  };

  // Radial Layout - Central node with branches radiating out
  const renderRadialLayout = (rootNode: MindMapNode) => {
    const children = rootNode.children || [];
    const leftChildren = children.slice(0, Math.ceil(children.length / 2));
    const rightChildren = children.slice(Math.ceil(children.length / 2));

    return (
      <div className="flex items-center justify-center gap-4 py-8 px-12">
        {/* Left branches */}
        <div className="flex flex-col gap-6">
          {leftChildren.map((child, idx) => (
            <div key={child.id} className="flex items-center gap-0">
              {/* Sub-children */}
              {child.children && child.children.length > 0 && (
                <div className="flex flex-col gap-2 items-end mr-2">
                  {child.children.slice(0, 4).map((sub, si) => (
                    <div key={sub.id} className="flex items-center">
                      <span 
                        className="text-xs font-medium px-2 py-1 rounded-lg text-white whitespace-nowrap"
                        style={{ backgroundColor: getNodeColor(2, si) }}
                      >
                        {sanitizeText(sub.text)}
                      </span>
                      <svg width="30" height="2" className="ml-1">
                        <line x1="0" y1="1" x2="30" y2="1" stroke={getNodeColor(2, si)} strokeWidth="2" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
              {/* Branch node */}
              <div 
                className="px-4 py-2 rounded-xl font-semibold text-white shadow-lg whitespace-nowrap"
                style={{ backgroundColor: getNodeColor(1, idx), boxShadow: `0 4px 12px ${getNodeColor(1, idx)}40` }}
              >
                {sanitizeText(child.text)}
              </div>
              {/* Curved connector */}
              <svg width="80" height="50" className="flex-shrink-0">
                <path d={`M 0 25 Q 40 ${25 + (idx - leftChildren.length/2) * 8} 80 25`} fill="none" stroke={getNodeColor(1, idx)} strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          ))}
        </div>

        {/* Center node */}
        <div 
          className="px-8 py-5 rounded-full font-bold text-lg text-white shadow-2xl z-10 min-w-[120px] text-center"
          style={{ backgroundColor: getNodeColor(0, 0), boxShadow: `0 8px 30px ${getNodeColor(0, 0)}50` }}
        >
          {sanitizeText(rootNode.text)}
        </div>

        {/* Right branches */}
        <div className="flex flex-col gap-6">
          {rightChildren.map((child, idx) => (
            <div key={child.id} className="flex items-center gap-0">
              <svg width="80" height="50" className="flex-shrink-0">
                <path d={`M 0 25 Q 40 ${25 + (idx - rightChildren.length/2) * 8} 80 25`} fill="none" stroke={getNodeColor(1, leftChildren.length + idx)} strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div 
                className="px-4 py-2 rounded-xl font-semibold text-white shadow-lg whitespace-nowrap"
                style={{ backgroundColor: getNodeColor(1, leftChildren.length + idx), boxShadow: `0 4px 12px ${getNodeColor(1, leftChildren.length + idx)}40` }}
              >
                {sanitizeText(child.text)}
              </div>
              {child.children && child.children.length > 0 && (
                <div className="flex flex-col gap-2 items-start ml-2">
                  {child.children.slice(0, 4).map((sub, si) => (
                    <div key={sub.id} className="flex items-center">
                      <svg width="30" height="2" className="mr-1">
                        <line x1="0" y1="1" x2="30" y2="1" stroke={getNodeColor(2, si + 3)} strokeWidth="2" />
                      </svg>
                      <span 
                        className="text-xs font-medium px-2 py-1 rounded-lg text-white whitespace-nowrap"
                        style={{ backgroundColor: getNodeColor(2, si + 3) }}
                      >
                        {sanitizeText(sub.text)}
                      </span>
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

  // Tree Layout - Horizontal hierarchy with curved connectors (like reference image)
  const renderTreeLayout = (rootNode: MindMapNode) => {
    const renderBranch = (node: MindMapNode, depth: number, parentIdx: number) => {
      const color = getNodeColor(depth, parentIdx);
      const hasChildren = node.children && node.children.length > 0;
      
      return (
        <div key={node.id} className="flex items-center gap-0">
          {/* Current node */}
          <div 
            className={cn(
              "px-4 py-2 rounded-full font-medium text-white shadow-md whitespace-nowrap border-2 border-white/20",
              depth === 0 && "px-6 py-3 text-lg font-bold",
              depth === 1 && "px-4 py-2 text-sm font-semibold",
              depth >= 2 && "px-3 py-1.5 text-xs"
            )}
            style={{ 
              backgroundColor: color, 
              boxShadow: `0 4px 12px ${color}40` 
            }}
          >
            {sanitizeText(node.text)}
          </div>
          
          {/* Children with curved connectors */}
          {hasChildren && (
            <div className="flex items-center">
              {/* Horizontal line from node */}
              <svg width="40" height="2" className="flex-shrink-0">
                <line x1="0" y1="1" x2="40" y2="1" stroke={color} strokeWidth="2" />
              </svg>
              
              {/* Vertical distribution with curved branches */}
              <div className="relative flex flex-col gap-1">
                {node.children!.map((child, idx) => {
                  const childColor = getNodeColor(depth + 1, idx);
                  const hasGrandchildren = child.children && child.children.length > 0;
                  
                  return (
                    <div key={child.id} className="flex items-center gap-0">
                      {/* Curved connector */}
                      <svg width="30" height="24" className="flex-shrink-0">
                        <path 
                          d={`M 0 12 Q 15 12 30 12`} 
                          fill="none" 
                          stroke={childColor} 
                          strokeWidth="2" 
                          strokeLinecap="round"
                        />
                      </svg>
                      
                      {/* Child node */}
                      <div 
                        className={cn(
                          "px-3 py-1.5 rounded-full font-medium text-white shadow-sm whitespace-nowrap",
                          depth === 0 && "text-sm",
                          depth >= 1 && "text-xs px-2 py-1"
                        )}
                        style={{ backgroundColor: childColor }}
                      >
                        {sanitizeText(child.text)}
                      </div>
                      
                      {/* Grandchildren */}
                      {hasGrandchildren && (
                        <div className="flex items-center">
                          <svg width="25" height="2">
                            <line x1="0" y1="1" x2="25" y2="1" stroke={childColor} strokeWidth="1.5" />
                          </svg>
                          <div className="flex flex-col gap-0.5">
                            {child.children!.slice(0, 3).map((grandChild, gIdx) => {
                              const gcColor = getNodeColor(depth + 2, gIdx);
                              const hasGreatGrand = grandChild.children && grandChild.children.length > 0;
                              
                              return (
                                <div key={grandChild.id} className="flex items-center gap-0">
                                  <svg width="20" height="16">
                                    <path d="M 0 8 Q 10 8 20 8" fill="none" stroke={gcColor} strokeWidth="1.5" />
                                  </svg>
                                  <span 
                                    className="text-[10px] px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                                    style={{ backgroundColor: gcColor }}
                                  >
                                    {sanitizeText(grandChild.text)}
                                  </span>
                                  
                                  {/* Deepest level */}
                                  {hasGreatGrand && (
                                    <div className="flex items-center ml-1">
                                      <svg width="15" height="2">
                                        <line x1="0" y1="1" x2="15" y2="1" stroke={gcColor} strokeWidth="1" strokeDasharray="2,2" />
                                      </svg>
                                      <div className="flex flex-col gap-0.5">
                                        {grandChild.children!.slice(0, 2).map((leaf, lIdx) => (
                                          <span 
                                            key={leaf.id}
                                            className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 whitespace-nowrap border"
                                            style={{ borderColor: gcColor }}
                                          >
                                            {sanitizeText(leaf.text)}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="flex items-center justify-start py-8 px-12 overflow-x-auto">
        {renderBranch(rootNode, 0, 0)}
      </div>
    );
  };

  // Fishbone Layout - Diagonal branches
  const renderFishboneLayout = (rootNode: MindMapNode) => {
    const children = rootNode.children || [];
    const topChildren = children.filter((_, i) => i % 2 === 0);
    const bottomChildren = children.filter((_, i) => i % 2 === 1);

    return (
      <div className="flex flex-col items-center py-12 px-8">
        {/* Top branches */}
        <div className="flex justify-center gap-20 mb-4">
          {topChildren.map((child, idx) => (
            <div key={child.id} className="flex flex-col items-center">
              {child.children && (
                <div className="flex gap-2 mb-2 flex-wrap justify-center max-w-[150px]">
                  {child.children.slice(0, 3).map((sub, si) => (
                    <span key={sub.id} className="text-xs px-2 py-0.5 rounded text-white" style={{ backgroundColor: getNodeColor(2, si) }}>
                      {sanitizeText(sub.text)}
                    </span>
                  ))}
                </div>
              )}
              <div 
                className="px-4 py-2 rounded-xl font-semibold text-white shadow-lg"
                style={{ backgroundColor: getNodeColor(1, idx * 2) }}
              >
                {sanitizeText(child.text)}
              </div>
              <svg width="2" height="40">
                <line x1="1" y1="0" x2="1" y2="40" stroke={getNodeColor(1, idx * 2)} strokeWidth="2" />
              </svg>
            </div>
          ))}
        </div>

        {/* Main spine */}
        <div className="flex items-center">
          <div className="w-24 h-1 rounded" style={{ backgroundColor: getNodeColor(0, 0) }} />
          <div 
            className="px-8 py-4 rounded-full font-bold text-lg text-white shadow-2xl mx-4"
            style={{ backgroundColor: getNodeColor(0, 0), boxShadow: `0 8px 25px ${getNodeColor(0, 0)}50` }}
          >
            {sanitizeText(rootNode.text)}
          </div>
          <div className="w-24 h-1 rounded" style={{ backgroundColor: getNodeColor(0, 0) }} />
        </div>

        {/* Bottom branches */}
        <div className="flex justify-center gap-20 mt-4">
          {bottomChildren.map((child, idx) => (
            <div key={child.id} className="flex flex-col items-center">
              <svg width="2" height="40">
                <line x1="1" y1="0" x2="1" y2="40" stroke={getNodeColor(1, idx * 2 + 1)} strokeWidth="2" />
              </svg>
              <div 
                className="px-4 py-2 rounded-xl font-semibold text-white shadow-lg"
                style={{ backgroundColor: getNodeColor(1, idx * 2 + 1) }}
              >
                {sanitizeText(child.text)}
              </div>
              {child.children && (
                <div className="flex gap-2 mt-2 flex-wrap justify-center max-w-[150px]">
                  {child.children.slice(0, 3).map((sub, si) => (
                    <span key={sub.id} className="text-xs px-2 py-0.5 rounded text-white" style={{ backgroundColor: getNodeColor(2, si + 3) }}>
                      {sanitizeText(sub.text)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Organization Chart Layout
  const renderOrgLayout = (rootNode: MindMapNode) => {
    return (
      <div className="flex flex-col items-center py-8 gap-6">
        {/* Root card */}
        <div 
          className="px-8 py-4 rounded-xl font-bold text-lg text-white shadow-2xl border-4 border-white/30"
          style={{ backgroundColor: getNodeColor(0, 0), boxShadow: `0 10px 30px ${getNodeColor(0, 0)}50` }}
        >
          {sanitizeText(rootNode.text)}
        </div>

        {rootNode.children && rootNode.children.length > 0 && (
          <>
            {/* Connector line */}
            <div className="flex items-center">
              <div className="w-0.5 h-8" style={{ backgroundColor: getNodeColor(0, 0) }} />
            </div>
            <div className="h-0.5 w-full max-w-2xl" style={{ backgroundColor: getNodeColor(0, 0) }} />

            {/* Level 1 cards */}
            <div className="flex gap-8 flex-wrap justify-center">
              {rootNode.children.map((child, idx) => (
                <div key={child.id} className="flex flex-col items-center gap-4">
                  <div className="w-0.5 h-4" style={{ backgroundColor: getNodeColor(1, idx) }} />
                  <div 
                    className="px-5 py-3 rounded-lg font-semibold text-white shadow-lg min-w-[100px] text-center border-2 border-white/20"
                    style={{ backgroundColor: getNodeColor(1, idx), boxShadow: `0 4px 15px ${getNodeColor(1, idx)}40` }}
                  >
                    {sanitizeText(child.text)}
                  </div>
                  
                  {/* Level 2 */}
                  {child.children && child.children.length > 0 && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-0.5 h-4" style={{ backgroundColor: getNodeColor(1, idx) }} />
                      <div className="flex gap-2 flex-wrap justify-center max-w-[180px]">
                        {child.children.slice(0, 4).map((sub, si) => (
                          <div 
                            key={sub.id}
                            className="px-3 py-1.5 rounded text-xs font-medium text-white text-center"
                            style={{ backgroundColor: getNodeColor(2, idx + si) }}
                          >
                            {sanitizeText(sub.text)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderLayout = () => {
    switch (selectedLayout) {
      case "radial": return renderRadialLayout(data);
      case "tree": return renderTreeLayout(data);
      case "fishbone": return renderFishboneLayout(data);
      case "org": return renderOrgLayout(data);
      default: return renderRadialLayout(data);
    }
  };

  return (
    <div className={cn("fixed inset-0 z-50 bg-background flex flex-col", showVideoSlide && "pr-80")}>
      {/* Header */}
      <div className="p-4 border-b bg-card/50 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Mind Map</h2>
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">- {title}</span>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layout selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                {layouts[selectedLayout].icon} {layouts[selectedLayout].name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover z-50">
              {(Object.keys(layouts) as LayoutType[]).map((layoutKey) => (
                <DropdownMenuItem key={layoutKey} onClick={() => setSelectedLayout(layoutKey)}>
                  {layouts[layoutKey].icon} {layouts[layoutKey].name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Palette className="w-4 h-4" />
                {themes[selectedTheme].name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover z-50 w-48">
              {(Object.keys(themes) as ThemeKey[]).map((themeKey) => (
                <DropdownMenuItem key={themeKey} onClick={() => setSelectedTheme(themeKey)} className="gap-2">
                  <div className="flex gap-0.5">
                    {themes[themeKey].colors.slice(0, 4).map((color, i) => (
                      <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  {themes[themeKey].name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border rounded-lg px-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fitToScreen} title="Fit to screen">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={downloadAsPDF} variant="outline" size="sm" disabled={isDownloading} className="gap-2">
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            PDF
          </Button>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content with zoom */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-auto flex items-center justify-center p-4"
        style={{ background: themes[selectedTheme].bgGradient }}
      >
        <div 
          ref={contentRef} 
          className="transition-transform duration-200 origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {renderLayout()}
        </div>
      </div>

      {showVideoSlide && <div className="fixed inset-y-0 right-0 w-80 bg-card border-l" />}
    </div>
  );
};
