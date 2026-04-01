import { LogOut, Menu, ShieldCheck, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import pirnavLogo from "@/assets/pirnav-logo.png";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn, getInitials, normalizeRole } from "@/lib/utils";
import { workspaceNavItems } from "@/lib/workspace";

const Navbar = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const role = normalizeRole(user?.role);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1880px] px-3 py-4 sm:px-4 lg:px-6">
        <div className="rounded-[30px] border border-slate-200/80 bg-[linear-gradient(115deg,rgba(248,250,252,0.88),rgba(255,255,255,0.98)_36%,rgba(239,246,255,0.92)_100%)] px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_20px_44px_rgba(15,23,42,0.08)] sm:px-5">
          <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)_auto] xl:items-center xl:gap-4">
            <div className="flex min-w-0 items-center gap-2.5 xl:max-w-[360px]">
              <Button
                className="lg:hidden"
                size="icon"
                type="button"
                variant="secondary"
                onClick={onOpenSidebar}
              >
                <Menu className="h-4 w-4" />
              </Button>

              <NavLink
                to="/dashboard"
                className="flex shrink-0 items-center rounded-[22px] border border-white/90 bg-white/90 px-3 py-2.5 shadow-sm"
              >
                <img
                  src={pirnavLogo}
                  alt="PIRNAV logo"
                  className="h-auto max-h-[42px] w-auto min-w-[132px] object-contain"
                />
              </NavLink>

              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  cn(
                    "hidden shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold shadow-sm md:inline-flex",
                    isActive
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white/80 text-slate-600 hover:text-slate-900"
                  )
                }
              >
                <Sparkles className="h-4 w-4" />
                Sprint Board
              </NavLink>
            </div>

            <nav className="flex min-w-0 flex-wrap items-center gap-2 xl:flex-nowrap xl:justify-center">
              {workspaceNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "flex shrink-0 items-center gap-2 rounded-[18px] border px-3.5 py-2.5 text-[13px] font-semibold transition duration-200",
                        isActive
                          ? "border-transparent bg-[linear-gradient(135deg,#0f766e,#2dd4bf)] text-white shadow-[0_14px_30px_rgba(13,148,136,0.2)]"
                          : "border-white/90 bg-white/82 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900"
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start xl:flex-nowrap xl:justify-end">
              <div className="hidden rounded-[20px] border border-white/90 bg-white/82 px-3.5 py-2.5 shadow-sm lg:block">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Active Role
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">{role}</p>
              </div>

              <NavLink
                to="/profile"
                className="flex min-w-0 items-center gap-3 rounded-[20px] border border-white/90 bg-white/86 px-3.5 py-2.5 shadow-sm"
              >
                <Avatar className="h-10 w-10 border border-teal-100 bg-teal-50 text-teal-700">
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
              </NavLink>

              <Button
                className="h-11 shrink-0 rounded-[18px] px-4"
                variant="secondary"
                type="button"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
