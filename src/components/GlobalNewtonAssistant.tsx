import { useState, useEffect, useCallback, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNewtonChat } from "@/hooks/useNewtonChat";
import { supabase } from "@/integrations/supabase/client";
import { NewtonTriggerButton } from "./newton-assistant/NewtonTriggerButton";
import { NewtonChatPanel } from "./newton-assistant/NewtonChatPanel";
import { SignInRequiredModal } from "./SignInRequiredModal";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export const GlobalNewtonAssistant = memo(function GlobalNewtonAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const isMobile = useIsMobile();
  const { messages, isLoading, error, sendMessage, cancelRequest, clearHistory } =
    useNewtonChat();

  // Auth state tracking
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "N") {
        e.preventDefault();
        if (!isAuthenticated) { setShowSignIn(true); return; }
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isAuthenticated]);

  const handleToggle = useCallback(() => {
    if (!isAuthenticated) { setShowSignIn(true); return; }
    setIsOpen((prev) => !prev);
  }, [isAuthenticated]);

  const handleClose = useCallback(() => setIsOpen(false), []);

  // Mobile: drawer
  if (isMobile) {
    return (
      <>
        <div className="fixed bottom-4 right-4 z-50">
          <NewtonTriggerButton isOpen={isOpen} onClick={handleToggle} />
        </div>
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
                isFullScreen={true}
              />
            </div>
          </DrawerContent>
        </Drawer>
        <SignInRequiredModal open={showSignIn} onOpenChange={setShowSignIn} />
      </>
    );
  }

  // Desktop: always full screen
  return (
    <>
      {/* Full screen chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-4 z-50"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="absolute top-2 right-2 z-[51] h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </Button>
            <NewtonChatPanel
              messages={messages}
              isLoading={isLoading}
              error={error}
              onSend={sendMessage}
              onCancel={cancelRequest}
              onClear={clearHistory}
              isFullScreen={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button - only when closed */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-50">
          <NewtonTriggerButton isOpen={isOpen} onClick={handleToggle} />
        </div>
      )}

      <SignInRequiredModal open={showSignIn} onOpenChange={setShowSignIn} />
    </>
  );
});

export default GlobalNewtonAssistant;
