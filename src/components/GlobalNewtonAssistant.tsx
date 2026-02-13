import { useState, useEffect, useCallback, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNewtonChat } from "@/hooks/useNewtonChat";
import { useNewtonConversations } from "@/hooks/useNewtonConversations";
import { supabase } from "@/integrations/supabase/client";
import { NewtonTriggerButton } from "./newton-assistant/NewtonTriggerButton";
import { NewtonChatPanel } from "./newton-assistant/NewtonChatPanel";
import { NewtonSidebar } from "./newton-assistant/NewtonSidebar";
import { SignInRequiredModal } from "./SignInRequiredModal";
import type { Attachment } from "./newton-assistant/NewtonAttachmentButton";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export const GlobalNewtonAssistant = memo(function GlobalNewtonAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const isMobile = useIsMobile();

  const {
    groupedConversations,
    activeConversationId,
    setActiveConversationId,
    isLoading: convsLoading,
    createConversation,
    deleteConversation,
    startNewChat,
    fetchConversations,
  } = useNewtonConversations();

  const { messages, isLoading, error, sendMessage, cancelRequest, clearHistory } =
    useNewtonChat(activeConversationId);

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

  const handleSend = useCallback((content: string, attachment?: Attachment | null) => {
    sendMessage(content, async () => {
      const id = await createConversation();
      return id;
    }, attachment);
  }, [sendMessage, createConversation]);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    if (isMobile) setShowSidebar(false);
  }, [setActiveConversationId, isMobile]);

  const handleNewChat = useCallback(() => {
    startNewChat();
    clearHistory();
    if (isMobile) setShowSidebar(false);
  }, [startNewChat, clearHistory, isMobile]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    await deleteConversation(id);
    fetchConversations();
  }, [deleteConversation, fetchConversations]);

  // Refresh conversations when opening
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchConversations();
    }
  }, [isOpen, isAuthenticated, fetchConversations]);

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
            <div className="flex flex-col flex-1 overflow-hidden relative h-full">
              {showSidebar && (
                <>
                  <div className="absolute inset-0 bg-black/40 z-10" onClick={() => setShowSidebar(false)} />
                  <div className="absolute inset-y-0 left-0 z-20 w-[80%] max-w-[300px] h-full">
                    <NewtonSidebar
                      groupedConversations={groupedConversations}
                      activeConversationId={activeConversationId}
                      onSelect={handleSelectConversation}
                      onNewChat={handleNewChat}
                      onDelete={handleDeleteConversation}
                      isLoading={convsLoading}
                    />
                  </div>
                </>
              )}
              <div className="flex flex-col flex-1 overflow-hidden min-w-0 h-full">
                <NewtonChatPanel
                  messages={messages}
                  isLoading={isLoading}
                  error={error}
                  onSend={handleSend}
                  onCancel={cancelRequest}
                  onClear={handleNewChat}
                  onClose={handleClose}
                  onToggleSidebar={() => setShowSidebar((p) => !p)}
                  showSidebarToggle
                />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
        <SignInRequiredModal open={showSignIn} onOpenChange={setShowSignIn} />
      </>
    );
  }

  // Desktop: full screen with sidebar
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-4 z-50 flex rounded-2xl overflow-hidden border shadow-2xl bg-background"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Sidebar */}
            {showSidebar && (
              <NewtonSidebar
                groupedConversations={groupedConversations}
                activeConversationId={activeConversationId}
                onSelect={handleSelectConversation}
                onNewChat={handleNewChat}
                onDelete={handleDeleteConversation}
                isLoading={convsLoading}
              />
            )}

            {/* Chat panel */}
            <div className="flex-1 overflow-hidden min-w-0">
              <NewtonChatPanel
                messages={messages}
                isLoading={isLoading}
                error={error}
                onSend={handleSend}
                onCancel={cancelRequest}
                onClear={handleNewChat}
                onClose={handleClose}
                onToggleSidebar={() => setShowSidebar((p) => !p)}
                showSidebarToggle
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button */}
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
