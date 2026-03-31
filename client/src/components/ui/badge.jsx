import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-blue-200 bg-blue-50 text-blue-600",
        secondary: "border-slate-200 bg-slate-50 text-slate-600",
        success: "border-emerald-200 bg-emerald-50 text-emerald-600",
        warning: "border-amber-200 bg-amber-50 text-amber-600",
        danger: "border-rose-200 bg-rose-50 text-rose-600",
        outline: "border-slate-200 text-slate-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Badge = ({ className, variant, ...props }) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { Badge, badgeVariants };
