import { cn } from "@/lib/utils";

const Skeleton = ({ className, ...props }) => (
  <div
    className={cn("animate-pulse rounded-2xl bg-slate-100", className)}
    {...props}
  />
);

export { Skeleton };
