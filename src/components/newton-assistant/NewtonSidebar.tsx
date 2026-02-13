import { memo } from "react";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NewtonConversation } from "@/hooks/useNewtonConversations";

interface NewtonSidebarProps {
  groupedConversations: { label: string; items: NewtonConversation[] }[];
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const NewtonSidebar = memo(function NewtonSidebar({
  groupedConversations,
  activeConversationId,
  onSelect,
  onNewChat,
  onDelete,
  isLoading,
}: NewtonSidebarProps) {
  return (
    <div className="flex flex-col h-full w-64 border-r bg-muted/30">
      {/* New Chat button */}
      <div className="p-3 border-b">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start gap-2 h-10"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Conversations list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : groupedConversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No conversations yet
            </p>
          ) : (
            groupedConversations.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors",
                        conv.id === activeConversationId
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      onClick={() => onSelect(conv.id)}
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 truncate text-xs">{conv.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
});
