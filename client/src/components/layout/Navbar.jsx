import { LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import pirnavLogo from "@/assets/pirnav-logo.png";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn, getInitials, normalizeRole } from "@/lib/utils";

const navigationByRole = {
  Admin: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Tasks", href: "/tasks" },
    { label: "Reports", href: "/reports" },
    { label: "Profile", href: "/profile" },
  ],
  User: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Tasks", href: "/tasks" },
    { label: "Reports", href: "/reports" },
    { label: "Profile", href: "/profile" },
  ],
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const role = normalizeRole(user?.role);
  const navigationItems = navigationByRole[role] || navigationByRole.User;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 shadow-[0_1px_0_rgba(148,163,184,0.08)] backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-4 xl:flex-1 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <NavLink to="/dashboard" className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
                  <img
                    src={pirnavLogo}
                    alt="PIRNAV logo"
                    className="h-auto max-h-[34px] w-auto object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold uppercase tracking-[0.34em] text-blue-600 sm:text-base">
                    PIRNAV
                  </p>
                  <p className="truncate text-base font-semibold leading-tight text-slate-700 sm:text-[1.1rem]">
                    Software Solutions Pvt. Ltd.
                  </p>
                </div>
              </NavLink>

              <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 md:inline-flex">
                Delivery workspace
              </div>
            </div>

            <nav className="flex items-center gap-2 overflow-x-auto pb-1 xl:justify-center xl:pb-0">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition duration-200",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200/80"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <NavLink
              to="/profile"
              className="flex min-w-0 items-center gap-3 rounded-[22px] border border-slate-200/90 bg-white px-3 py-2.5 shadow-sm"
            >
              <Avatar className="h-10 w-10 border border-blue-100 bg-blue-50 text-blue-600">
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">{role}</p>
              </div>
            </NavLink>

            <Button
              className="shrink-0"
              variant="ghost"
              size="icon"
              type="button"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
