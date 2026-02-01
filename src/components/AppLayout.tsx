import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { TopStatsBar } from "@/components/TopStatsBar";
import { AdBanner } from "@/components/AdBanner";
import { useUsageLimitNotifications } from "@/hooks/useUsageLimitNotifications";
import { FloatingUpgradeBanner } from "@/components/FloatingUpgradeBanner";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { useProcessingOverlay } from "@/contexts/ProcessingOverlayContext";
import { ScrollProvider, useScrollContext } from "@/contexts/ScrollContext";

function ScrollableContent({ children, showFooter }: { children: React.ReactNode; showFooter: boolean }) {
  const { setScrollPosition } = useScrollContext();
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setScrollPosition(scrollTop, scrollHeight, clientHeight);
  };

  return (
    <div 
      className="flex-1 flex flex-col overflow-auto min-h-0"
      onScroll={handleScroll}
    >
      {children}
      {showFooter && (
        <>
          <AdBanner className="mb-0" />
          <Footer />
        </>
      )}
    </div>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
  onToolSelect?: (tool: string) => void;
  onSignOut?: () => void;
  showSidebar?: boolean;
  showFooter?: boolean;
  showTopStats?: boolean;
}

export function AppLayout({ 
  children, 
  onToolSelect, 
  onSignOut,
  showSidebar = true,
  showFooter = true,
  showTopStats = true
}: AppLayoutProps) {
  // Show notifications when users are approaching their feature limits
  useUsageLimitNotifications();
  
  // Get global processing overlay state
  const { state: overlayState } = useProcessingOverlay();
  
  if (!showSidebar) {
    return (
      <div className="min-h-screen flex flex-col">
        {showTopStats && <TopStatsBar />}
        <div className="flex-1">{children}</div>
        {showFooter && <Footer />}
        <FloatingUpgradeBanner />
        {/* Global Processing Overlay - always mounted for instant video playback */}
        <ProcessingOverlay
          isVisible={overlayState.isVisible}
          message={overlayState.message}
          subMessage={overlayState.subMessage}
          progress={overlayState.progress}
          isIndeterminate={overlayState.isIndeterminate}
          canCancel={overlayState.canCancel}
          onCancel={overlayState.onCancel}
          variant={overlayState.variant}
        />
      </div>
    );
  }

  return (
    <ScrollProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar onToolSelect={onToolSelect} onSignOut={onSignOut} />
          <main className="flex-1 flex flex-col overflow-hidden min-h-0">
            {showTopStats && <TopStatsBar />}
            <ScrollableContent showFooter={showFooter}>
              {children}
            </ScrollableContent>
          </main>
        </div>
        <FloatingUpgradeBanner />
        {/* Global Processing Overlay - always mounted for instant video playback */}
        <ProcessingOverlay
          isVisible={overlayState.isVisible}
          message={overlayState.message}
          subMessage={overlayState.subMessage}
          progress={overlayState.progress}
          isIndeterminate={overlayState.isIndeterminate}
          canCancel={overlayState.canCancel}
          onCancel={overlayState.onCancel}
          variant={overlayState.variant}
        />
      </SidebarProvider>
    </ScrollProvider>
  );
}
