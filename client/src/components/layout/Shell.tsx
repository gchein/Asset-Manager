import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import {
  SidebarProvider,
  Sidebar as UiSidebarPrimitive,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";

export function Shell({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <UiSidebarPrimitive collapsible="icon">
        <Sidebar />
      </UiSidebarPrimitive>
      <SidebarRail />
      <SidebarInset>
        <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
            <div className="container mx-auto max-w-7xl p-6 md:p-8 lg:p-10 animate-in fade-in duration-500 slide-in-from-bottom-4">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground text-lg">{description}</p>}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
