import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, FolderGit2, LoaderCircle, X } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { fetchProjects } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { workspaceQuickLinks } from "@/lib/workspace";

const Sidebar = ({ isOpen, isCollapsed, onClose, onToggleCollapse }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentProjectId = searchParams.get("project") || "";
  const currentView = searchParams.get("view") || "sprint";
  const {
    data: projects = [],
    isLoading,
  } = useQuery({
    queryKey: ["projects", "sidebar"],
    queryFn: fetchProjects,
  });

  const quickLinks = useMemo(
    () =>
      workspaceQuickLinks.map((item) => {
        const url = new URL(item.href, "http://workspace.local");

        if (
          currentProjectId &&
          ["/dashboard", "/filters"].includes(url.pathname) &&
          !url.searchParams.has("project")
        ) {
          url.searchParams.set("project", currentProjectId);
        }

        return {
          ...item,
          href: `${url.pathname}${url.search}`,
        };
      }),
    [currentProjectId]
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-4 left-4 z-40 flex flex-col rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_24px_50px_rgba(15,23,42,0.09)] transition-all duration-300 lg:sticky lg:top-[110px] lg:inset-y-auto lg:h-[calc(100vh-136px)] lg:translate-x-0",
          isCollapsed ? "lg:w-[104px]" : "lg:w-[320px]",
          isOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className={cn("min-w-0", isCollapsed && "lg:hidden")}>
            <p className="text-xs uppercase tracking-[0.26em] text-slate-500">
              Project Rail
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Boards, backlog, and settings
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button className="hidden lg:inline-flex" variant="ghost" size="icon" type="button" onClick={onToggleCollapse}>
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button className="lg:hidden" variant="ghost" size="icon" type="button" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4 overflow-hidden">
          <div>
            <p className={cn("px-2 text-xs uppercase tracking-[0.24em] text-slate-500", isCollapsed && "lg:hidden")}>
              Quick Navigation
            </p>
            <nav className="mt-3 space-y-2">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                const url = new URL(item.href, "http://workspace.local");
                const isActive =
                  location.pathname === url.pathname &&
                  (url.pathname !== "/dashboard" ||
                    (url.searchParams.get("view") || "sprint") === currentView);

                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-[22px] border px-3 py-3 text-sm font-medium transition duration-200",
                      isActive
                        ? "border-teal-200 bg-teal-50 text-teal-700"
                        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900",
                      isCollapsed && "lg:justify-center"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className={cn(isCollapsed && "lg:hidden")}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-[26px] border border-slate-200 bg-white/80">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className={cn(isCollapsed && "lg:hidden")}>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Projects</p>
                <p className="text-sm font-semibold text-slate-900">{projects.length} workspaces</p>
              </div>
              <Badge className={cn(isCollapsed && "lg:mx-auto")} variant="secondary">
                {projects.length}
              </Badge>
            </div>

            <ScrollArea className="h-[calc(100vh-430px)] min-h-[260px] lg:h-[calc(100vh-470px)]">
              <div className="space-y-2 p-3">
                {isLoading ? (
                  <div className="flex items-center justify-center rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-sm text-slate-500">
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    <span className={cn(isCollapsed && "lg:hidden")}>Loading projects</span>
                  </div>
                ) : projects.length ? (
                  projects.map((project) => {
                    const isSelected = currentProjectId
                      ? currentProjectId === project._id
                      : location.pathname === "/dashboard" && project === projects[0];
                    const href = `/dashboard?project=${project._id}&view=${currentView}`;

                    return (
                      <Link
                        key={project._id}
                        to={href}
                        onClick={onClose}
                        className={cn(
                          "flex items-start gap-3 rounded-[22px] border px-3 py-3 transition duration-200",
                          isSelected
                            ? "border-slate-900 bg-slate-900 text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)]"
                            : "border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white",
                          isCollapsed && "lg:justify-center"
                        )}
                        title={isCollapsed ? project.name : undefined}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold",
                            isSelected
                              ? "border-white/20 bg-white/10 text-white"
                              : "border-slate-200 bg-white text-slate-700"
                          )}
                        >
                          {project.key?.slice(0, 2) || "PR"}
                        </div>
                        <div className={cn("min-w-0 flex-1", isCollapsed && "lg:hidden")}>
                          <p className="truncate text-sm font-semibold">{project.name}</p>
                          <p className={cn("mt-1 text-xs", isSelected ? "text-slate-200" : "text-slate-500")}>
                            {project.issueCount || 0} issues · {project.members?.length || 0} members
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className={cn("rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500", isCollapsed && "lg:text-center")}>
                    <FolderGit2 className="mb-2 h-4 w-4" />
                    <span className={cn(isCollapsed && "lg:hidden")}>Projects appear here once created.</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
