import {
  LayoutDashboard,
  ListTodo,
  ReceiptText,
  UserCircle2,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import pirnavLogo from "@/assets/pirnav-logo.png";
import { Button } from "@/components/ui/button";
import { cn, normalizeRole } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navigationByRole = {
  Admin: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Task List", href: "/tasks", icon: ListTodo },
    { label: "Reports", href: "/reports", icon: ReceiptText },
    { label: "Profile", href: "/profile", icon: UserCircle2 },
  ],
  User: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Tasks", href: "/tasks", icon: ListTodo },
    { label: "Reports", href: "/reports", icon: ReceiptText },
    { label: "Profile", href: "/profile", icon: UserCircle2 },
  ],
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const navigationItems = navigationByRole[role];

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
          "fixed inset-y-4 left-4 z-40 flex w-[280px] flex-col rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_40px_rgba(15,23,42,0.08)] transition-transform duration-300 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-[120%]"
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={pirnavLogo}
              alt="PIRNAV logo"
              className="h-auto max-h-[48px] w-auto max-w-[180px] object-contain"
            />
          </div>

          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon"
            type="button"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition duration-200",
                    isActive
                      ? "border-sky-200 bg-sky-100 text-slate-900"
                      : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-blue-600">
              Team Session
            </div>
            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="mt-1 text-sm text-slate-500">{role}</p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <img
                src={pirnavLogo}
                alt="PIRNAV logo"
                className="h-auto max-h-[60px] w-full max-w-[200px] object-contain"
              />
              <p className="text-xs leading-5 text-slate-500">
                PIRNAV Software Solutions Pvt. Ltd.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
