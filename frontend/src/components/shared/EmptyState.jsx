import { Card, CardContent } from "@/components/ui/card";

const EmptyState = ({ title, description, action, icon }) => (
  <Card className="border-dashed border-slate-300 bg-slate-50 shadow-none">
    <CardContent className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
      {icon ? (
        <div className="mb-4 rounded-full border border-slate-200 bg-white p-3 text-slate-500">
          {icon}
        </div>
      ) : null}
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </CardContent>
  </Card>
);

export default EmptyState;
