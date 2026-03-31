import { Bell, LogOut, Menu, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, getInitials } from "@/lib/utils";

const pageMeta = {
  "/dashboard": {
    title: "My Work Dashboard",
    description: "See only your assigned tasks, update statuses quickly, and report new issues without admin clutter.",
  },
  "/projects": {
    title: "Project Space",
    description: "Create projects, manage members, and keep delivery scopes well defined.",
  },
  "/issues": {
    title: "Issue Board",
    description: "Move work across the Kanban board, assign owners, and discuss progress.",
  },
};

const Topbar = ({ pathname, onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const meta = pageMeta[pathname] || pageMeta["/dashboard"];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <Button
            className="lg:hidden"
            variant="secondary"
            size="icon"
            type="button"
            onClick={onOpenSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-blue-600">
              <Sparkles className="h-3.5 w-3.5" />
              Premium Workspace
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{meta.title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                {meta.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <Search className="h-4 w-4 text-slate-400" />
            <span>Focused sprint planning</span>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Bell className="h-4 w-4 text-slate-400" />
            <div className="text-sm">
              <p className="font-medium text-slate-900">Realtime-ready shell</p>
              <p className="text-slate-500">{formatDate(new Date())}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Avatar className="h-11 w-11">
              <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" type="button" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
