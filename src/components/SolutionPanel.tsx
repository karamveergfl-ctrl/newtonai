import { Button } from "@/components/ui/button";
import { X, Image as ImageIcon, Loader2, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { SolutionChatInput } from "./SolutionChatInput";

interface SolutionPanelProps {
  content: string;
  isQuestion: boolean;
  onClose: () => void;
  capturedImage?: string;
  isStreaming?: boolean;
  onFollowUpQuestion?: (question: string) => void;
  isAnswering?: boolean;
  onFindSimilar?: () => void;
  isFindingSimilar?: boolean;
  onGetDetailedSolution?: () => void;
  isGettingDetailed?: boolean;
}

export const SolutionPanel = ({ 
  content, 
  isQuestion, 
  onClose, 
  capturedImage, 
  isStreaming,
  onFollowUpQuestion,
  isAnswering,
  onFindSimilar,
  isFindingSimilar,
  onGetDetailedSolution,
  isGettingDetailed
}: SolutionPanelProps) => {
  return (
    <div className="h-full flex flex-col bg-card border-l animate-fade-in">
      <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">
            {isQuestion ? "📝 Detailed Solution" : "💡 Topic Overview"}
          </h3>
          {(isStreaming || isAnswering) && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{isAnswering ? "Answering..." : "Solving..."}</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Captured Screenshot Display */}
          {capturedImage && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ImageIcon className="w-4 h-4" />
                <span>Captured Problem</span>
              </div>
              <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
                <img 
                  src={capturedImage} 
                  alt="Captured problem" 
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
          )}
          
          {/* LaTeX-rendered Solution */}
          <div className="prose prose-sm dark:prose-invert max-w-none
            prose-headings:text-foreground prose-headings:font-bold
            prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
            prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-foreground prose-p:leading-relaxed
            prose-strong:text-primary prose-strong:font-semibold
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg
            prose-ul:my-2 prose-li:my-0.5
            prose-hr:my-6 prose-hr:border-border
          ">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({ children, ...props }) => (
                  <p className="mb-3" {...props}>{children}</p>
                ),
                h2: ({ children, ...props }) => (
                  <h2 className="text-xl font-bold mt-6 mb-3 border-b border-border pb-2 text-foreground" {...props}>{children}</h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props}>{children}</h3>
                ),
                strong: ({ children, ...props }) => (
                  <strong className="font-semibold text-primary" {...props}>{children}</strong>
                ),
                hr: () => (
                  <hr className="my-6 border-border" />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-0.5" />
            )}
          </div>

          {/* Action Buttons */}
          {!isStreaming && content && (
            <div className="flex flex-col gap-2">
              {/* Detailed Solution Button */}
              {onGetDetailedSolution && (
                <Button
                  onClick={onGetDetailedSolution}
                  variant="default"
                  className="w-full"
                  disabled={isGettingDetailed}
                >
                  {isGettingDetailed ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting detailed solution...
                    </>
                  ) : (
                    "📖 Show Detailed Solution"
                  )}
                </Button>
              )}
              
              {/* Find Similar Questions Button */}
              {onFindSimilar && (
                <Button
                  onClick={onFindSimilar}
                  variant="outline"
                  className="w-full"
                  disabled={isFindingSimilar}
                >
                  {isFindingSimilar ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Finding similar problems...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Find Similar Questions to Practice
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Chat Input for Follow-up Questions */}
      {onFollowUpQuestion && !isStreaming && (
        <SolutionChatInput
          onSendMessage={onFollowUpQuestion}
          isLoading={isAnswering}
          placeholder="Ask a follow-up question..."
        />
      )}
    </div>
  );
};
