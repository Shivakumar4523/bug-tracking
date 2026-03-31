import { Card, CardContent } from "@/components/ui/card";

const OverviewStatCard = ({ icon, label, value, iconClassName = "" }) => (
  <Card className="stats-tile h-full">
    <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
      <div className="flex items-center gap-3 text-slate-500">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 ${iconClassName}`}
        >
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div>
        <p className="text-4xl font-semibold tracking-tight text-slate-900">{value}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">
          Live snapshot
        </p>
      </div>
    </CardContent>
  </Card>
);

export default OverviewStatCard;
