import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Loader2, Network, Palette, ZoomIn, ZoomOut, Maximize2, LayoutGrid } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notebookLMTheme } from "./NotebookLMStyles";

// Sanitize text content to prevent XSS
const sanitizeText = (text: string): string => {
  if (!text) return "";
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

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

type ThemeKey = "notebookLM" | "ocean" | "forest" | "sunset" | "purple" | "monochrome";
type LayoutType = "radial" | "tree" | "fishbone" | "org";

const themes: Record<ThemeKey, { name: string; colors: string[]; bgGradient: string }> = {
  notebookLM: notebookLMTheme,
  ocean: {
    name: "Ocean",
    colors: ["#3B82F6", "#06B6D4", "#8B5CF6", "#10B981", "#6366F1", "#14B8A6"],
    bgGradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
  },
  forest: {
    name: "Forest",
    colors: ["#059669", "#84CC16", "#22C55E", "#10B981", "#65A30D", "#16A34A"],
    bgGradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
  },
  sunset: {
    name: "Sunset",
    colors: ["#DC2626", "#EA580C", "#F97316", "#FB923C", "#D97706", "#EF4444"],
    bgGradient: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)"
  },
  purple: {
    name: "Purple",
    colors: ["#7C3AED", "#8B5CF6", "#A855F7", "#9333EA", "#6D28D9", "#C084FC"],
    bgGradient: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)"
  },
  monochrome: {
    name: "Monochrome",
    colors: ["#374151", "#4B5563", "#6B7280", "#9CA3AF", "#1F2937", "#111827"],
    bgGradient: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)"
  }
};

const layouts: Record<LayoutType, { name: string; icon: string }> = {
  radial: { name: "Radial", icon: "🌐" },
  tree: { name: "Tree", icon: "🌳" },
  fishbone: { name: "Fishbone", icon: "🐟" },
  org: { name: "Hierarchy", icon: "📊" }
};

export const VisualMindMap = ({
  data,
  title,
  onClose,
  showVideoSlide = false
}: VisualMindMapProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("notebookLM");
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>("radial");
  const [zoom, setZoom] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  // NotebookLM-style node rendering
  const renderCentralNode = (text: string) => (
    <div 
      className="px-8 py-4 rounded-2xl font-display font-bold text-lg text-white shadow-lg border-2 border-white/20 transition-transform hover:scale-105"
      style={{ 
        background: `linear-gradient(135deg, ${getNodeColor(0, 0)} 0%, ${getNodeColor(0, 0)}dd 100%)`,
        boxShadow: `0 8px 32px ${getNodeColor(0, 0)}40`
      }}
    >
      {sanitizeText(text)}
    </div>
  );

  const renderBranchNode = (text: string, colorIndex: number) => (
    <div 
      className="px-4 py-2 rounded-xl font-display font-medium text-sm text-white shadow-md border border-white/10 cursor-pointer transition-all hover:scale-105 hover:shadow-lg whitespace-nowrap"
      style={{ 
        background: `linear-gradient(135deg, ${getNodeColor(1, colorIndex)} 0%, ${getNodeColor(1, colorIndex)}dd 100%)`,
        boxShadow: `0 4px 16px ${getNodeColor(1, colorIndex)}30`
      }}
    >
      {sanitizeText(text)}
    </div>
  );

  const renderLeafNode = (text: string, parentColor: string) => (
    <span 
      className="px-3 py-1.5 rounded-lg text-xs font-sans font-medium bg-white text-gray-700 shadow-sm border border-gray-200 whitespace-nowrap transition-all hover:shadow-md hover:border-gray-300"
      style={{ borderLeftColor: parentColor, borderLeftWidth: '3px' }}
    >
      {sanitizeText(text)}
    </span>
  );

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
              {child.children && child.children.length > 0 && (
                <div className="flex flex-col gap-2 items-end mr-3">
                  {child.children.slice(0, 4).map((sub, si) => (
                    <div key={sub.id} className="flex items-center gap-2">
                      {renderLeafNode(sub.text, getNodeColor(1, idx))}
                      <svg width="24" height="2">
                        <line x1="0" y1="1" x2="24" y2="1" stroke={getNodeColor(1, idx)} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
              {renderBranchNode(child.text, idx)}
              <svg width="60" height="40" className="flex-shrink-0">
                <path 
                  d={`M 0 20 Q 30 ${20 + (idx - leftChildren.length/2) * 6} 60 20`} 
                  fill="none" 
                  stroke={getNodeColor(1, idx)} 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />
              </svg>
            </div>
          ))}
        </div>

        {/* Center node */}
        {renderCentralNode(rootNode.text)}

        {/* Right branches */}
        <div className="flex flex-col gap-6">
          {rightChildren.map((child, idx) => (
            <div key={child.id} className="flex items-center gap-0">
              <svg width="60" height="40" className="flex-shrink-0">
                <path 
                  d={`M 0 20 Q 30 ${20 + (idx - rightChildren.length/2) * 6} 60 20`} 
                  fill="none" 
                  stroke={getNodeColor(1, leftChildren.length + idx)} 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />
              </svg>
              {renderBranchNode(child.text, leftChildren.length + idx)}
              {child.children && child.children.length > 0 && (
                <div className="flex flex-col gap-2 items-start ml-3">
                  {child.children.slice(0, 4).map((sub, si) => (
                    <div key={sub.id} className="flex items-center gap-2">
                      <svg width="24" height="2">
                        <line x1="0" y1="1" x2="24" y2="1" stroke={getNodeColor(1, leftChildren.length + idx)} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      {renderLeafNode(sub.text, getNodeColor(1, leftChildren.length + idx))}
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

  // Tree Layout
  const renderTreeLayout = (rootNode: MindMapNode) => {
    const renderBranch = (node: MindMapNode, depth: number, colorIdx: number) => {
      const color = getNodeColor(depth, colorIdx);
      const hasChildren = node.children && node.children.length > 0;
      
      return (
        <div key={node.id} className="flex items-center gap-0">
          {depth === 0 ? renderCentralNode(node.text) : (
            <div 
              className={cn(
                "rounded-full font-display text-white shadow-md whitespace-nowrap border border-white/10 transition-all hover:scale-105",
                depth === 1 && "px-4 py-2 text-sm font-medium",
                depth >= 2 && "px-3 py-1.5 text-xs font-medium"
              )}
              style={{ 
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                boxShadow: `0 4px 12px ${color}30`
              }}
            >
              {sanitizeText(node.text)}
            </div>
          )}
          
          {hasChildren && (
            <div className="flex items-center">
              <svg width="32" height="2">
                <line x1="0" y1="1" x2="32" y2="1" stroke={color} strokeWidth="2" strokeLinecap="round" />
              </svg>
              
              <div className="flex flex-col gap-1">
                {node.children!.slice(0, 5).map((child, idx) => {
                  const childColor = getNodeColor(depth + 1, idx);
                  
                  return (
                    <div key={child.id} className="flex items-center gap-0">
                      <svg width="24" height="20">
                        <path d="M 0 10 Q 12 10 24 10" fill="none" stroke={childColor} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap"
                        style={{ backgroundColor: childColor }}
                      >
                        {sanitizeText(child.text)}
                      </span>
                      
                      {child.children && child.children.length > 0 && (
                        <div className="flex items-center ml-1">
                          <svg width="16" height="2">
                            <line x1="0" y1="1" x2="16" y2="1" stroke={childColor} strokeWidth="1.5" strokeDasharray="3,2" />
                          </svg>
                          <div className="flex flex-col gap-0.5">
                            {child.children.slice(0, 3).map((gc, gIdx) => (
                              <span 
                                key={gc.id}
                                className="text-[10px] px-2 py-0.5 rounded bg-white text-gray-700 whitespace-nowrap border"
                                style={{ borderColor: childColor, borderLeftWidth: '2px' }}
                              >
                                {sanitizeText(gc.text)}
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
    };

    return (
      <div className="flex items-center justify-start py-8 px-12 overflow-x-auto">
        {renderBranch(rootNode, 0, 0)}
      </div>
    );
  };

  // Fishbone Layout
  const renderFishboneLayout = (rootNode: MindMapNode) => {
    const children = rootNode.children || [];
    const topChildren = children.filter((_, i) => i % 2 === 0);
    const bottomChildren = children.filter((_, i) => i % 2 === 1);

    return (
      <div className="flex flex-col items-center py-12 px-8">
        {/* Top branches */}
        <div className="flex justify-center gap-16 mb-4">
          {topChildren.map((child, idx) => (
            <div key={child.id} className="flex flex-col items-center">
              {child.children && (
                <div className="flex gap-2 mb-2 flex-wrap justify-center max-w-[140px]">
                  {child.children.slice(0, 3).map((sub) => (
                    <span key={sub.id} className="text-xs px-2 py-0.5 rounded-lg text-white font-medium" style={{ backgroundColor: getNodeColor(2, idx) }}>
                      {sanitizeText(sub.text)}
                    </span>
                  ))}
                </div>
              )}
              {renderBranchNode(child.text, idx * 2)}
              <svg width="2" height="32">
                <line x1="1" y1="0" x2="1" y2="32" stroke={getNodeColor(1, idx * 2)} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          ))}
        </div>

        {/* Main spine */}
        <div className="flex items-center">
          <div className="w-20 h-1 rounded-full" style={{ backgroundColor: getNodeColor(0, 0) }} />
          {renderCentralNode(rootNode.text)}
          <div className="w-20 h-1 rounded-full" style={{ backgroundColor: getNodeColor(0, 0) }} />
        </div>

        {/* Bottom branches */}
        <div className="flex justify-center gap-16 mt-4">
          {bottomChildren.map((child, idx) => (
            <div key={child.id} className="flex flex-col items-center">
              <svg width="2" height="32">
                <line x1="1" y1="0" x2="1" y2="32" stroke={getNodeColor(1, idx * 2 + 1)} strokeWidth="2" strokeLinecap="round" />
              </svg>
              {renderBranchNode(child.text, idx * 2 + 1)}
              {child.children && (
                <div className="flex gap-2 mt-2 flex-wrap justify-center max-w-[140px]">
                  {child.children.slice(0, 3).map((sub, si) => (
                    <span key={sub.id} className="text-xs px-2 py-0.5 rounded-lg text-white font-medium" style={{ backgroundColor: getNodeColor(2, si + 3) }}>
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
        {renderCentralNode(rootNode.text)}

        {rootNode.children && rootNode.children.length > 0 && (
          <>
            <div className="w-0.5 h-6 rounded-full" style={{ backgroundColor: getNodeColor(0, 0) }} />
            <div className="h-0.5 rounded-full" style={{ backgroundColor: getNodeColor(0, 0), width: `${Math.min(rootNode.children.length * 140, 800)}px` }} />

            <div className="flex gap-8 flex-wrap justify-center">
              {rootNode.children.map((child, idx) => (
                <div key={child.id} className="flex flex-col items-center gap-3">
                  <div className="w-0.5 h-4 rounded-full" style={{ backgroundColor: getNodeColor(1, idx) }} />
                  {renderBranchNode(child.text, idx)}
                  
                  {child.children && child.children.length > 0 && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-0.5 h-3 rounded-full" style={{ backgroundColor: getNodeColor(1, idx) }} />
                      <div className="flex gap-2 flex-wrap justify-center max-w-[160px]">
                        {child.children.slice(0, 4).map((sub, si) => (
                          <span 
                            key={sub.id}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-white text-center"
                            style={{ backgroundColor: getNodeColor(2, idx + si) }}
                          >
                            {sanitizeText(sub.text)}
                          </span>
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
    <div className={cn("fixed inset-0 z-50 bg-gray-50 flex flex-col", showVideoSlide && "pr-80")}>
      {/* Header */}
      <div className="p-4 border-b bg-white/80 backdrop-blur-sm flex items-center justify-between gap-4 flex-wrap sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm"
            style={{ backgroundColor: themes[selectedTheme].colors[0] }}
          >
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-gray-900">Mind Map</h2>
            <span className="text-sm text-gray-500 font-sans truncate max-w-[200px] block">{title}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layout selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 font-sans">
                <LayoutGrid className="w-4 h-4" />
                {layouts[selectedLayout].icon} {layouts[selectedLayout].name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white z-50">
              {(Object.keys(layouts) as LayoutType[]).map((layoutKey) => (
                <DropdownMenuItem 
                  key={layoutKey} 
                  onClick={() => setSelectedLayout(layoutKey)}
                  className="font-sans"
                >
                  {layouts[layoutKey].icon} {layouts[layoutKey].name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 font-sans">
                <Palette className="w-4 h-4" />
                {themes[selectedTheme].name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white z-50 w-48">
              {(Object.keys(themes) as ThemeKey[]).map((themeKey) => (
                <DropdownMenuItem 
                  key={themeKey} 
                  onClick={() => setSelectedTheme(themeKey)} 
                  className="gap-2 font-sans"
                >
                  <div className="flex gap-0.5">
                    {themes[themeKey].colors.slice(0, 4).map((color, i) => (
                      <div key={i} className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  {themes[themeKey].name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border rounded-lg px-1 bg-white">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs w-12 text-center font-sans text-gray-600">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fitToScreen} title="Fit to screen">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={downloadAsPDF} variant="outline" size="sm" disabled={isDownloading} className="gap-2 font-sans">
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
          className="transition-transform duration-200 origin-center p-8"
          style={{ transform: `scale(${zoom})` }}
        >
          {renderLayout()}
        </div>
      </div>

      {showVideoSlide && <div className="fixed inset-y-0 right-0 w-80 bg-white border-l" />}
    </div>
  );
};
