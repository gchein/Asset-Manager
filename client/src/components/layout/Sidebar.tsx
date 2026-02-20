import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMyProfile } from "@/hooks/use-data";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  LogOut,
  Building2,
  HardHat,
  MessageSquare,
} from "lucide-react";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function Sidebar() {
  const [location] = useLocation();
  const { data: profile } = useMyProfile();
  const { user, logout } = useAuth();

  const isOps = profile?.role === "ops";

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/", show: true },
    { icon: Building2, label: "Companies", href: "/companies", show: isOps },
    { icon: Briefcase, label: "Projects", href: "/projects", show: true },
    { icon: HardHat, label: "All Jobs", href: "/jobs", show: isOps },
    { icon: FileText, label: "My Jobs", href: "/my-jobs", show: !isOps },
    { icon: MessageSquare, label: "Messages", href: "/messages", show: true },
  ];

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/25 group-data-[collapsible=icon]:hidden">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div className="flex flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="flex flex-col min-w-0">
              <span className="font-display font-bold text-base leading-none truncate">
                SolarOps
              </span>
              <span className="text-xs text-sidebar-foreground/60 truncate">
                Enterprise Platform
              </span>
            </div>
          </div>
          <SidebarTrigger className="size-7 shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {user && (
          <SidebarGroup>
            <SidebarGroupContent className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <div className="flex items-center gap-2 rounded-lg p-2 bg-sidebar-accent/50 border border-sidebar-border w-full min-w-0 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:overflow-hidden">
                <img
                  src={
                    user.profileImageUrl ||
                    `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`
                  }
                  alt="Profile"
                  className="h-8 w-8 shrink-0 rounded-full border-2 border-sidebar-ring/20 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:h-full group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:rounded-none object-cover"
                />
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="font-medium text-sm truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
                    {profile?.role || "No Role"}
                  </p>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems
                .filter((item) => item.show)
                .map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.href}
                      tooltip={item.label}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          location === item.href &&
                            "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-black/10"
                        )}
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => logout()}
              tooltip="Sign Out"
            >
              <LogOut className="size-4 shrink-0" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
