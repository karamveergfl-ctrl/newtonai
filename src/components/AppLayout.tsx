import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Footer from "@/components/Footer";

interface AppLayoutProps {
  children: React.ReactNode;
  onToolSelect?: (tool: string) => void;
  onSignOut?: () => void;
  showSidebar?: boolean;
  showFooter?: boolean;
}

export function AppLayout({ 
  children, 
  onToolSelect, 
  onSignOut,
  showSidebar = true,
  showFooter = true
}: AppLayoutProps) {
  if (!showSidebar) {
    return (
      <div className="min-h-screen flex flex-col">
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
          {/* Mobile trigger */}
          <div className="md:hidden flex items-center h-12 px-4 border-b border-border bg-background">
            <SidebarTrigger />
          </div>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
          {showFooter && <Footer />}
        </main>
      </div>
    </SidebarProvider>
  );
}
