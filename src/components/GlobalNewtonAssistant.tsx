import { useState, useEffect, useCallback, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNewtonChat } from "@/hooks/useNewtonChat";
import { NewtonTriggerButton } from "./newton-assistant/NewtonTriggerButton";
import { NewtonChatPanel } from "./newton-assistant/NewtonChatPanel";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";


/**
 * Global Newton AI Assistant - Fixed to bottom-right corner
 * Accessible from every page for asking questions
 */
export const GlobalNewtonAssistant = memo(function GlobalNewtonAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { messages, isLoading, error, sendMessage, cancelRequest, clearHistory } =
    useNewtonChat();

  // Keyboard shortcut: Ctrl+Shift+N or Cmd+Shift+N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "N") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Mobile: Use drawer
  if (isMobile) {
    return (
      <>
        {/* Trigger button */}
        <div className="fixed bottom-4 right-4 z-50">
          <NewtonTriggerButton isOpen={isOpen} onClick={handleToggle} />
        </div>

        {/* Mobile drawer */}
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="h-[85vh] max-h-[85vh]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Newton AI Assistant</DrawerTitle>
            </DrawerHeader>
            <div className="flex-1 overflow-hidden">
              <NewtonChatPanel
                messages={messages}
                isLoading={isLoading}
                error={error}
                onSend={sendMessage}
                onCancel={cancelRequest}
                onClear={clearHistory}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: Floating panel
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="w-[380px] h-[520px]"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <NewtonChatPanel
              messages={messages}
              isLoading={isLoading}
              error={error}
              onSend={sendMessage}
              onCancel={cancelRequest}
              onClear={clearHistory}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button */}
      <NewtonTriggerButton isOpen={isOpen} onClick={handleToggle} />
    </div>
  );
});

export default GlobalNewtonAssistant;
