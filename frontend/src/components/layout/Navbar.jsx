import { BarChart3, LayoutGrid, ListChecks, LogOut, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import pirnavLogo from "@/assets/pirnav-logo.png";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn, getInitials, normalizeRole } from "@/lib/utils";

const navigationByRole = {
  Admin: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Tasks", href: "/tasks", icon: ListChecks },
    { label: "Reports", href: "/reports", icon: BarChart3 },
    { label: "Profile", href: "/profile", icon: UserRound },
  ],
  User: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "My Tasks", href: "/tasks", icon: ListChecks },
    { label: "Reports", href: "/reports", icon: BarChart3 },
    { label: "Profile", href: "/profile", icon: UserRound },
  ],
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const role = normalizeRole(user?.role);
  const navigationItems = navigationByRole[role] || navigationByRole.User;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1760px] px-3 py-4 sm:px-4 lg:px-6">
        <div className="rounded-[32px] border border-slate-200/70 bg-[linear-gradient(135deg,rgba(219,234,254,0.72),rgba(255,255,255,0.95)_24%,rgba(255,255,255,0.98)_68%,rgba(224,242,254,0.7))] px-4 py-4 sm:px-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_38px_rgba(59,130,246,0.08)]">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6 2xl:flex-1">
              <div className="flex flex-wrap items-center gap-4">
                <NavLink
                  to="/dashboard"
                  className="flex shrink-0 items-center rounded-[24px] border border-white/70 bg-white/80 px-4 py-3 shadow-sm"
                >
                  <img
                    src={pirnavLogo}
                    alt="PIRNAV logo"
                    className="h-auto max-h-[54px] w-auto min-w-[160px] object-contain"
                  />
                </NavLink>

                <div className="rounded-full border border-white/80 bg-white/75 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                  Delivery workspace
                </div>
              </div>

              <nav className="flex flex-wrap items-center gap-3 xl:justify-center">
                {navigationItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 rounded-[22px] border px-4 py-3 text-sm font-semibold transition duration-200",
                          isActive
                            ? "border-transparent bg-[linear-gradient(135deg,#3b82f6,#67e8f9)] text-white shadow-[0_12px_30px_rgba(59,130,246,0.28)]"
                            : "border-white/80 bg-white/78 text-slate-700 shadow-sm hover:bg-white hover:text-slate-900"
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end 2xl:pl-4">
              <NavLink
                to="/profile"
                className="flex min-w-0 items-center gap-3 rounded-[26px] border border-white/80 bg-white/82 px-4 py-3 shadow-sm"
              >
                <Avatar className="h-12 w-12 border border-blue-100 bg-blue-50 text-blue-600">
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                  <p className="truncate text-xs text-slate-500">{role}</p>
                </div>
              </NavLink>

              <Button
                className="h-14 shrink-0 rounded-[22px] border border-white/80 bg-white/82 px-6 text-base font-semibold text-slate-700 shadow-sm hover:bg-white"
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
