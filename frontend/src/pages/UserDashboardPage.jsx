import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  CircleCheckBig,
  ListTodo,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { createIssueReport, fetchMyTasks, updateTask } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import CreateIssueDialog from "@/components/dashboard/CreateIssueDialog";
import OverviewStatCard from "@/components/dashboard/OverviewStatCard";
import TaskCard from "@/components/dashboard/TaskCard";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const UserDashboardPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState("");

  const {
    data: tasks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tasks", "my-dashboard"],
    queryFn: fetchMyTasks,
  });

  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onSettled: () => {
      setUpdatingTaskId("");
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: createIssueReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const stats = useMemo(() => {
    const inProgress = tasks.filter((task) => task.status === "in-progress").length;
    const closed = tasks.filter((task) => task.status === "closed").length;

    return {
      total: tasks.length,
      inProgress,
      closed,
    };
  }, [tasks]);

  const handleStatusUpdate = async (taskId, status) => {
    setUpdatingTaskId(taskId);

    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        payload: { status },
      });
    } catch (submitError) {
      return submitError;
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-rose-600">
          {error.response?.data?.message || "Unable to load your assigned tasks."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <section className="app-panel-strong overflow-hidden p-6 sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-blue-600">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Personal Workspace
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                My assigned tasks
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Stay focused on work assigned to you, update task progress, and
                report fresh issues without admin clutter.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{stats.total}</span> assigned
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{stats.inProgress}</span> in
                progress
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{stats.closed}</span> completed
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 xl:items-end">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 shadow-sm">
              Logged in as <span className="font-semibold text-slate-900">{user?.name}</span>
            </div>

            <Button className="w-full sm:w-auto" type="button" onClick={() => setIsCreateIssueOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              Create Issue
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </>
        ) : (
          <>
            <OverviewStatCard
              icon={<ListTodo className="h-5 w-5" />}
              iconClassName="text-blue-600"
              label="Assigned Tasks"
              value={stats.total}
            />
            <OverviewStatCard
              icon={<RefreshCw className="h-5 w-5" />}
              iconClassName="text-amber-500"
              label="In Progress"
              value={stats.inProgress}
            />
            <OverviewStatCard
              icon={<CircleCheckBig className="h-5 w-5" />}
              iconClassName="text-emerald-500"
              label="Closed"
              value={stats.closed}
            />
          </>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">My Tasks</h3>
          <p className="text-sm text-slate-500">
            Only tasks assigned to your account are shown here.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : tasks.length ? (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                isUpdating={updateTaskMutation.isPending && updatingTaskId === task._id}
                onMarkInProgress={(taskId) => handleStatusUpdate(taskId, "in-progress")}
                onCloseTask={(taskId) => handleStatusUpdate(taskId, "closed")}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No assigned tasks yet"
            description="Tasks assigned to you will appear here with quick actions for moving them forward or closing them out."
            action={
              <Button type="button" onClick={() => setIsCreateIssueOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                Create Issue
              </Button>
            }
            icon={<ListTodo className="h-5 w-5" />}
          />
        )}
      </section>

      <CreateIssueDialog
        isPending={createIssueMutation.isPending}
        onOpenChange={setIsCreateIssueOpen}
        onSubmit={(payload) => createIssueMutation.mutateAsync(payload)}
        open={isCreateIssueOpen}
      />
    </div>
  );
};

export default UserDashboardPage;
