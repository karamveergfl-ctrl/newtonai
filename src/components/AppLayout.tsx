import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  onToolSelect?: (tool: string) => void;
  onSignOut?: () => void;
  showSidebar?: boolean;
}

export function AppLayout({ 
  children, 
  onToolSelect, 
  onSignOut,
  showSidebar = true 
}: AppLayoutProps) {
  if (!showSidebar) {
    return <>{children}</>;
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
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
