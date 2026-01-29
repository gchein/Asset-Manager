import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMyProfile } from "@/hooks/use-data";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Building2,
  HardHat,
  MessageSquare
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { data: profile } = useMyProfile();
  const { user, logout } = useAuth();

  const isOps = profile?.role === "ops";
  const isEngineer = profile?.role === "engineer";
  
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/", show: true },
    { icon: Building2, label: "Companies", href: "/companies", show: isOps },
    { icon: Briefcase, label: "Projects", href: "/projects", show: isOps || isEngineer },
    { icon: HardHat, label: "All Jobs", href: "/jobs", show: isOps },
    { icon: FileText, label: "My Jobs", href: "/my-jobs", show: !isOps },
    { icon: MessageSquare, label: "Messages", href: "/messages", show: true },
  ];

  return (
    <aside className="hidden h-screen w-72 flex-col bg-sidebar border-r border-sidebar-border md:flex text-sidebar-foreground">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/25">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-xl leading-none">SolarOps</h1>
            <span className="text-xs text-sidebar-foreground/60">Enterprise Platform</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        {user && (
          <div className="mb-8 px-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
              <img 
                src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`} 
                alt="Profile" 
                className="h-10 w-10 rounded-full border-2 border-sidebar-ring/20"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{profile?.role || "No Role"}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="space-y-1.5">
          {navItems.filter(item => item.show).map((item) => (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
              location === item.href 
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-black/10" 
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
            )}>
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                location === item.href ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-white"
              )} />
              {item.label}
              {location === item.href && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <button 
          onClick={() => logout()}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
