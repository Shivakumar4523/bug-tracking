import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChartNoAxesColumn, CircleCheckBig, Clock3, Flame, SearchCheck } from "lucide-react";
import { fetchMyTasks, fetchTasks } from "@/lib/api";
import OverviewStatCard from "@/components/dashboard/OverviewStatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { normalizeRole } from "@/lib/utils";
import { getTaskPriorityLabel, getTaskStatusLabel } from "@/lib/workspace";

const ReportsPage = () => {
  const { user } = useAuth();
  const isAdmin = normalizeRole(user?.role) === "Admin";

  const {
    data: tasks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tasks", isAdmin ? "admin-reports" : "user-reports"],
    queryFn: isAdmin ? fetchTasks : fetchMyTasks,
  });

  const priorityBreakdown = useMemo(() => {
    const counts = {
      low: 0,
      medium: 0,
      high: 0,
    };

    tasks.forEach((task) => {
      counts[task.priority] = (counts[task.priority] || 0) + 1;
    });

    return counts;
  }, [tasks]);

  const statusBreakdown = useMemo(() => {
    const counts = {
      open: 0,
      "in-progress": 0,
      review: 0,
      closed: 0,
    };

    tasks.forEach((task) => {
      counts[task.status] = (counts[task.status] || 0) + 1;
    });

    return counts;
  }, [tasks]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-rose-600">
          {error.response?.data?.message || "Unable to load report data."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Reports</h2>
        <p className="text-sm text-slate-500">
          {isAdmin
            ? "A quick performance snapshot across the full task workspace."
            : "A focused view of your personal task progress and priority mix."}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </>
        ) : (
          <>
            <OverviewStatCard
              icon={<ChartNoAxesColumn className="h-5 w-5" />}
              iconClassName="text-blue-600"
              label="To Do"
              value={statusBreakdown.open}
            />
            <OverviewStatCard
              icon={<Clock3 className="h-5 w-5" />}
              iconClassName="text-amber-500"
              label="In Progress"
              value={statusBreakdown["in-progress"]}
            />
            <OverviewStatCard
              icon={<SearchCheck className="h-5 w-5" />}
              iconClassName="text-violet-500"
              label="Review"
              value={statusBreakdown.review}
            />
            <OverviewStatCard
              icon={<CircleCheckBig className="h-5 w-5" />}
              iconClassName="text-emerald-500"
              label="Done"
              value={statusBreakdown.closed}
            />
          </>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
            <CardDescription>
              The current distribution of task progress states.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-700">
                  {getTaskStatusLabel(status)}
                </span>
                <span className="text-sm font-semibold text-slate-900">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
            <CardDescription>
              See how much work is concentrated at each urgency level.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(priorityBreakdown).map(([priority, count]) => (
              <div
                key={priority}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-slate-700">
                    {getTaskPriorityLabel(priority)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default ReportsPage;
