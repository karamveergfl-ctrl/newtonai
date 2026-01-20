import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { TopStatsBar } from "@/components/TopStatsBar";

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
  if (!showSidebar) {
    return (
      <div className="min-h-screen flex flex-col">
        {showTopStats && <TopStatsBar />}
        <div className="flex-1">{children}</div>
        {showFooter && <Footer />}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onToolSelect={onToolSelect} onSignOut={onSignOut} />
        <main className="flex-1 flex flex-col overflow-hidden">
          {showTopStats && <TopStatsBar />}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
          {showFooter && <Footer />}
        </main>
      </div>
    </SidebarProvider>
  );
}
