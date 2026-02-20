import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Network, Palette, ZoomIn, ZoomOut, Maximize2, LayoutGrid, Info, ArrowLeft, FileImage, FileText } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { notebookLMTheme } from "./NotebookLMStyles";

// Sanitize text content to prevent XSS
const sanitizeText = (text: string): string => {
  if (!text) return "";
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

interface MindMapNode {
  id: string;
  text: string;
  definition?: string;
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

const themes: Record<ThemeKey, { name: string; colors: string[]; bgGradient: string; bgGradientDark: string }> = {
  notebookLM: notebookLMTheme,
  ocean: {
    name: "Ocean",
    colors: ["#3B82F6", "#06B6D4", "#8B5CF6", "#10B981", "#6366F1", "#14B8A6"],
    bgGradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    bgGradientDark: "linear-gradient(135deg, #0c1929 0%, #0f172a 100%)"
  },
  forest: {
    name: "Forest",
    colors: ["#059669", "#84CC16", "#22C55E", "#10B981", "#65A30D", "#16A34A"],
    bgGradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    bgGradientDark: "linear-gradient(135deg, #0a1f0f 0%, #052e16 100%)"
  },
  sunset: {
    name: "Sunset",
    colors: ["#DC2626", "#EA580C", "#F97316", "#FB923C", "#D97706", "#EF4444"],
    bgGradient: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
    bgGradientDark: "linear-gradient(135deg, #1c130a 0%, #2a1a0a 100%)"
  },
  purple: {
    name: "Purple",
    colors: ["#7C3AED", "#8B5CF6", "#A855F7", "#9333EA", "#6D28D9", "#C084FC"],
    bgGradient: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
    bgGradientDark: "linear-gradient(135deg, #1a0a2e 0%, #2e1065 100%)"
  },
  monochrome: {
    name: "Monochrome",
    colors: ["#374151", "#4B5563", "#6B7280", "#9CA3AF", "#1F2937", "#111827"],
    bgGradient: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
    bgGradientDark: "linear-gradient(135deg, #111827 0%, #1f2937 100%)"
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
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Pan/drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    if (containerRef.current) {
      setScrollStart({ 
        x: containerRef.current.scrollLeft, 
        y: containerRef.current.scrollTop 
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !containerRef.current) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    containerRef.current.scrollLeft = scrollStart.x - dx;
    containerRef.current.scrollTop = scrollStart.y - dy;
  };

  const handleMouseUp = () => setIsPanning(false);
  const handleMouseLeave = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.3, Math.min(prev + delta, 2)));
  };

  useEffect(() => {
    const timer = setTimeout(() => fitToScreen(), 100);
    return () => clearTimeout(timer);
  }, [data, selectedLayout]);

  const fitToScreen = useCallback(() => {
    if (!contentRef.current || !containerRef.current) return;
    
    // Reset zoom first to get accurate content dimensions
    setZoom(1);
    
    setTimeout(() => {
      if (!contentRef.current || !containerRef.current) return;
      const container = containerRef.current.getBoundingClientRect();
      const content = contentRef.current.getBoundingClientRect();
      
      // Calculate scale with more padding margin
      const scaleX = (container.width - 64) / content.width;
      const scaleY = (container.height - 64) / content.height;
      const newZoom = Math.min(scaleX, scaleY, 1);
      setZoom(Math.max(0.25, newZoom));
      
      // Center the scroll position after zoom
      setTimeout(() => {
        if (!containerRef.current) return;
        const scrollWidth = containerRef.current.scrollWidth;
        const scrollHeight = containerRef.current.scrollHeight;
        const clientWidth = containerRef.current.clientWidth;
        const clientHeight = containerRef.current.clientHeight;
        containerRef.current.scrollLeft = (scrollWidth - clientWidth) / 2;
        containerRef.current.scrollTop = (scrollHeight - clientHeight) / 2;
      }, 50);
    }, 50);
  }, []);

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

  const downloadAsPNG = async () => {
    if (!contentRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `MindMap_${title.slice(0, 30)}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast({ title: "Downloaded", description: "PNG image downloaded successfully" });
    } catch (error) {
      console.error("Error generating PNG:", error);
      toast({ title: "Error", description: "Failed to generate PNG", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const getNodeColor = (depth: number, index: number) => {
    const colors = themes[selectedTheme].colors;
    return colors[(depth + index) % colors.length];
  };

  // NotebookLM-style node rendering with click for definition
  const renderCentralNode = (node: MindMapNode) => (
    <Popover>
      <PopoverTrigger asChild>
        <div 
          className="px-8 py-4 rounded-2xl font-display font-bold text-lg text-white shadow-lg border-2 border-white/20 transition-transform hover:scale-105 cursor-pointer relative group"
          style={{ 
            background: `linear-gradient(135deg, ${getNodeColor(0, 0)} 0%, ${getNodeColor(0, 0)}dd 100%)`,
            boxShadow: `0 8px 32px ${getNodeColor(0, 0)}40`
          }}
        >
          {sanitizeText(node.text)}
          {node.definition && (
            <Info className="w-3.5 h-3.5 absolute -top-1 -right-1 bg-background text-muted-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </PopoverTrigger>
      {node.definition && (
        <PopoverContent className="w-72 p-3 bg-popover shadow-xl border-0 rounded-xl">
          <div className="space-y-2">
            <h4 className="font-display font-semibold text-sm text-foreground">{sanitizeText(node.text)}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{sanitizeText(node.definition)}</p>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );

  const renderBranchNode = (node: MindMapNode, colorIndex: number) => (
    <Popover>
      <PopoverTrigger asChild>
        <div 
          className="px-4 py-2 rounded-xl font-display font-medium text-sm text-white shadow-md border border-white/10 cursor-pointer transition-all hover:scale-105 hover:shadow-lg whitespace-nowrap relative group"
          style={{ 
            background: `linear-gradient(135deg, ${getNodeColor(1, colorIndex)} 0%, ${getNodeColor(1, colorIndex)}dd 100%)`,
            boxShadow: `0 4px 16px ${getNodeColor(1, colorIndex)}30`
          }}
        >
          {sanitizeText(node.text)}
          {node.definition && (
            <Info className="w-3 h-3 absolute -top-0.5 -right-0.5 bg-background text-muted-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </PopoverTrigger>
      {node.definition && (
        <PopoverContent className="w-64 p-3 bg-popover shadow-xl border-0 rounded-xl z-50">
          <div className="space-y-2">
            <h4 className="font-display font-semibold text-sm text-foreground">{sanitizeText(node.text)}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{sanitizeText(node.definition)}</p>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );

  const renderLeafNode = (node: MindMapNode, parentColor: string) => (
    <Popover>
      <PopoverTrigger asChild>
        <span 
          className="px-3 py-1.5 rounded-lg text-xs font-sans font-medium bg-card text-foreground shadow-sm border border-border whitespace-nowrap transition-all hover:shadow-md hover:border-muted-foreground/50 cursor-pointer relative group"
          style={{ borderLeftColor: parentColor, borderLeftWidth: '3px' }}
        >
          {sanitizeText(node.text)}
          {node.definition && (
            <Info className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 bg-muted text-muted-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </span>
      </PopoverTrigger>
      {node.definition && (
        <PopoverContent className="w-56 p-2.5 bg-popover shadow-xl border-0 rounded-lg z-50">
          <div className="space-y-1.5">
            <h4 className="font-display font-semibold text-xs text-foreground">{sanitizeText(node.text)}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{sanitizeText(node.definition)}</p>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );

  // Radial Layout - Central node with branches radiating out
  const renderRadialLayout = (rootNode: MindMapNode) => {
    const children = rootNode.children || [];
    const leftChildren = children.slice(0, Math.ceil(children.length / 2));
    const rightChildren = children.slice(Math.ceil(children.length / 2));

    return (
      <div className="flex items-center justify-center gap-4 py-8 px-24">
        {/* Left branches */}
        <div className="flex flex-col gap-6">
          {leftChildren.map((child, idx) => (
            <div key={child.id} className="flex items-center gap-0">
              {child.children && child.children.length > 0 && (
                <div className="flex flex-col gap-2 items-end mr-3">
                  {child.children.slice(0, 4).map((sub, si) => (
                    <div key={sub.id} className="flex items-center gap-2">
                      {renderLeafNode(sub, getNodeColor(1, idx))}
                      <svg width="24" height="2">
                        <line x1="0" y1="1" x2="24" y2="1" stroke={getNodeColor(1, idx)} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
              {renderBranchNode(child, idx)}
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
        {renderCentralNode(rootNode)}

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
              {renderBranchNode(child, leftChildren.length + idx)}
              {child.children && child.children.length > 0 && (
                <div className="flex flex-col gap-2 items-start ml-3">
                  {child.children.slice(0, 4).map((sub, si) => (
                    <div key={sub.id} className="flex items-center gap-2">
                      <svg width="24" height="2">
                        <line x1="0" y1="1" x2="24" y2="1" stroke={getNodeColor(1, leftChildren.length + idx)} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      {renderLeafNode(sub, getNodeColor(1, leftChildren.length + idx))}
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

  // Tree Layout - Horizontal tree with definitions on click
  const renderTreeLayout = (rootNode: MindMapNode) => {
    const renderTreeNode = (node: MindMapNode, depth: number, colorIdx: number) => {
      const color = getNodeColor(depth, colorIdx);
      
      if (depth === 0) {
        return renderCentralNode(node);
      }
      
      return (
        <Popover>
          <PopoverTrigger asChild>
            <div 
              className={cn(
                "rounded-xl font-display text-white shadow-md whitespace-nowrap border border-white/10 transition-all hover:scale-105 cursor-pointer relative group",
                depth === 1 && "px-4 py-2 text-sm font-medium",
                depth >= 2 && "px-3 py-1.5 text-xs font-medium"
              )}
              style={{ 
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                boxShadow: `0 4px 12px ${color}30`
              }}
            >
              {sanitizeText(node.text)}
              {node.definition && (
                <Info className="w-3 h-3 absolute -top-0.5 -right-0.5 bg-background text-muted-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </PopoverTrigger>
          {node.definition && (
            <PopoverContent className="w-64 p-3 bg-popover shadow-xl border-0 rounded-xl z-50">
              <div className="space-y-2">
                <h4 className="font-display font-semibold text-sm text-foreground">{sanitizeText(node.text)}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{sanitizeText(node.definition)}</p>
              </div>
            </PopoverContent>
          )}
        </Popover>
      );
    };

    const renderTreeLeaf = (node: MindMapNode, parentColor: string) => (
      <Popover>
        <PopoverTrigger asChild>
          <span 
            className="text-[11px] px-2.5 py-1 rounded-lg bg-card text-foreground whitespace-nowrap border border-border shadow-sm transition-all hover:shadow-md cursor-pointer relative group"
            style={{ borderColor: parentColor, borderLeftWidth: '3px' }}
          >
            {sanitizeText(node.text)}
            {node.definition && (
              <Info className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 bg-muted text-muted-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        </PopoverTrigger>
        {node.definition && (
          <PopoverContent className="w-56 p-2.5 bg-popover shadow-xl border-0 rounded-lg z-50">
            <div className="space-y-1.5">
              <h4 className="font-display font-semibold text-xs text-foreground">{sanitizeText(node.text)}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{sanitizeText(node.definition)}</p>
            </div>
          </PopoverContent>
        )}
      </Popover>
    );

    const children = rootNode.children || [];

    return (
      <div className="flex items-center justify-start py-8 px-12 overflow-x-auto">
        {renderCentralNode(rootNode)}
        
        {children.length > 0 && (
          <div className="flex items-center">
            <svg width="48" height="2">
              <line x1="0" y1="1" x2="48" y2="1" stroke={getNodeColor(0, 0)} strokeWidth="3" strokeLinecap="round" />
            </svg>
            
            <div className="flex flex-col gap-4">
              {children.slice(0, 6).map((child, idx) => {
                const childColor = getNodeColor(1, idx);
                
                return (
                  <div key={child.id} className="flex items-center gap-0">
                    <svg width="32" height="20">
                      <path d="M 0 10 Q 16 10 32 10" fill="none" stroke={childColor} strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    
                    {renderTreeNode(child, 1, idx)}
                    
                    {child.children && child.children.length > 0 && (
                      <div className="flex items-center ml-2">
                        <svg width="24" height="2">
                          <line x1="0" y1="1" x2="24" y2="1" stroke={childColor} strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <div className="flex flex-col gap-1.5">
                          {child.children.slice(0, 4).map((gc, gIdx) => (
                            <div key={gc.id} className="flex items-center gap-1">
                              <svg width="16" height="2">
                                <line x1="0" y1="1" x2="16" y2="1" stroke={childColor} strokeWidth="1.5" strokeDasharray="4,2" />
                              </svg>
                              {renderTreeLeaf(gc, childColor)}
                            </div>
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

  // Fishbone Layout - with definitions on click
  const renderFishboneLayout = (rootNode: MindMapNode) => {
    const children = rootNode.children || [];
    const topChildren = children.filter((_, i) => i % 2 === 0);
    const bottomChildren = children.filter((_, i) => i % 2 === 1);

    const renderFishboneLeaf = (node: MindMapNode, color: string) => (
      <Popover>
        <PopoverTrigger asChild>
          <span 
            className="text-xs px-2.5 py-1 rounded-lg text-white font-medium cursor-pointer transition-all hover:scale-105 hover:shadow-md relative group"
            style={{ backgroundColor: color }}
          >
            {sanitizeText(node.text)}
            {node.definition && (
              <Info className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 bg-background text-muted-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        </PopoverTrigger>
        {node.definition && (
          <PopoverContent className="w-56 p-2.5 bg-popover shadow-xl border-0 rounded-lg z-50">
            <div className="space-y-1.5">
              <h4 className="font-display font-semibold text-xs text-foreground">{sanitizeText(node.text)}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{sanitizeText(node.definition)}</p>
            </div>
          </PopoverContent>
        )}
      </Popover>
    );

    return (
      <div className="flex flex-col items-center py-12 px-8">
        {/* Top branches */}
        <div className="flex justify-center gap-16 mb-4">
          {topChildren.map((child, idx) => (
            <div key={child.id} className="flex flex-col items-center">
              {child.children && (
                <div className="flex gap-2 mb-2 flex-wrap justify-center max-w-[160px]">
                  {child.children.slice(0, 3).map((sub, si) => (
                    <div key={sub.id}>
                      {renderFishboneLeaf(sub, getNodeColor(2, idx + si))}
                    </div>
                  ))}
                </div>
              )}
              {renderBranchNode(child, idx * 2)}
              <svg width="2" height="32">
                <line x1="1" y1="0" x2="1" y2="32" stroke={getNodeColor(1, idx * 2)} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          ))}
        </div>

        {/* Main spine */}
        <div className="flex items-center">
          <div className="w-24 h-1 rounded-full" style={{ backgroundColor: getNodeColor(0, 0) }} />
          {renderCentralNode(rootNode)}
          <div className="w-24 h-1 rounded-full" style={{ backgroundColor: getNodeColor(0, 0) }} />
        </div>

        {/* Bottom branches */}
        <div className="flex justify-center gap-16 mt-4">
          {bottomChildren.map((child, idx) => (
            <div key={child.id} className="flex flex-col items-center">
              <svg width="2" height="32">
                <line x1="1" y1="0" x2="1" y2="32" stroke={getNodeColor(1, idx * 2 + 1)} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              {renderBranchNode(child, idx * 2 + 1)}
              {child.children && (
                <div className="flex gap-2 mt-2 flex-wrap justify-center max-w-[160px]">
                  {child.children.slice(0, 3).map((sub, si) => (
                    <div key={sub.id}>
                      {renderFishboneLeaf(sub, getNodeColor(2, si + 3))}
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

  // Organization/Hierarchy Chart Layout - with definitions on click
  const renderOrgLayout = (rootNode: MindMapNode) => {
    const renderOrgLeaf = (node: MindMapNode, color: string) => (
      <Popover>
        <PopoverTrigger asChild>
          <span 
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white text-center cursor-pointer transition-all hover:scale-105 hover:shadow-md relative group"
            style={{ backgroundColor: color }}
          >
            {sanitizeText(node.text)}
            {node.definition && (
              <Info className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 bg-background text-muted-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        </PopoverTrigger>
        {node.definition && (
          <PopoverContent className="w-56 p-2.5 bg-popover shadow-xl border-0 rounded-lg z-50">
            <div className="space-y-1.5">
              <h4 className="font-display font-semibold text-xs text-foreground">{sanitizeText(node.text)}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{sanitizeText(node.definition)}</p>
            </div>
          </PopoverContent>
        )}
      </Popover>
    );

    return (
      <div className="flex flex-col items-center py-8 gap-6">
        {renderCentralNode(rootNode)}

        {rootNode.children && rootNode.children.length > 0 && (
          <>
            <div className="w-0.5 h-8 rounded-full" style={{ backgroundColor: getNodeColor(0, 0) }} />
            <div className="h-0.5 rounded-full" style={{ backgroundColor: getNodeColor(0, 0), width: `${Math.min(rootNode.children.length * 160, 900)}px` }} />

            <div className="flex gap-10 flex-wrap justify-center">
              {rootNode.children.map((child, idx) => (
                <div key={child.id} className="flex flex-col items-center gap-3">
                  <div className="w-0.5 h-5 rounded-full" style={{ backgroundColor: getNodeColor(1, idx) }} />
                  {renderBranchNode(child, idx)}
                  
                  {child.children && child.children.length > 0 && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-0.5 h-4 rounded-full" style={{ backgroundColor: getNodeColor(1, idx) }} />
                      <div className="flex gap-2 flex-wrap justify-center max-w-[180px]">
                        {child.children.slice(0, 4).map((sub, si) => (
                          <div key={sub.id}>
                            {renderOrgLeaf(sub, getNodeColor(2, idx + si))}
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
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between gap-4 flex-wrap sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm"
            style={{ backgroundColor: themes[selectedTheme].colors[0] }}
          >
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-foreground">Mind Map</h2>
            <span className="text-sm text-muted-foreground font-sans truncate max-w-[200px] block">{title}</span>
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
            <DropdownMenuContent align="end" className="bg-popover z-50">
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
            <DropdownMenuContent align="end" className="bg-popover z-50 w-48">
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
          <div className="flex items-center gap-1 border rounded-lg px-1 bg-card">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs w-12 text-center font-sans text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fitToScreen} title="Fit to screen">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isDownloading} className="gap-2 font-sans">
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover z-50">
              <DropdownMenuItem onClick={downloadAsPNG} className="gap-2 font-sans cursor-pointer">
                <FileImage className="w-4 h-4" />
                Save as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadAsPDF} className="gap-2 font-sans cursor-pointer">
                <FileText className="w-4 h-4" />
                Save as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={onClose} variant="outline" size="sm" className="gap-2 font-sans">
            <ArrowLeft className="w-4 h-4" />
            Return to PDF
          </Button>
        </div>
      </div>

      {/* Content with zoom and pan */}
      <div 
        ref={containerRef} 
        className={cn(
          "flex-1 overflow-auto flex items-center justify-center w-full h-full select-none",
          isPanning ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ background: isDarkMode ? themes[selectedTheme].bgGradientDark : themes[selectedTheme].bgGradient }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        <div 
          ref={contentRef} 
          className="transition-transform duration-200 origin-center min-w-max min-h-max flex items-center justify-center p-16"
          style={{ transform: `scale(${zoom})` }}
        >
          {renderLayout()}
        </div>
      </div>
    </div>
  );
};
