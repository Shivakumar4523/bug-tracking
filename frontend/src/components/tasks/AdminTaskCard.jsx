import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Trash2,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import TaskDetailsDialog from "@/components/tasks/TaskDetailsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getTaskPriorityLabel,
  getTaskPriorityVariant,
  getTaskStatusLabel,
  getTaskStatusVariant,
  getTaskTypeLabel,
  taskPriorityOptions,
  taskStatusOptions,
} from "@/lib/workspace";
import { formatDate, formatHours } from "@/lib/utils";

const AdminTaskCard = ({
  task,
  isDeleting,
  isUpdating,
  onDeleteTask,
  onTaskUpdate,
  tasks = [],
  users = [],
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <>
      <Card className="transition duration-200 hover:border-blue-200">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{getTaskTypeLabel(task.type)}</Badge>
                <Badge variant={getTaskStatusVariant(task.status)}>{getTaskStatusLabel(task.status)}</Badge>
                <Badge variant={getTaskPriorityVariant(task.priority)}>
                  {getTaskPriorityLabel(task.priority)}
                </Badge>
              </div>
              <p className="text-lg font-semibold text-slate-900">{task.title}</p>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                {task.description || "No additional description was provided for this task."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <UserRound className="h-4 w-4 text-blue-500" />
                Assignee
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {task.assignedTo?.name || "Unassigned"}
              </p>
              <p className="mt-1 text-xs text-slate-500">{task.assignedTo?.email || "No email available"}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <UserRoundPlus className="h-4 w-4 text-blue-500" />
                Reporter
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {task.createdBy?.name || "PIRNAV Admin"}
              </p>
              <p className="mt-1 text-xs text-slate-500">{task.createdBy?.email || "No email available"}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                Timeline
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {task.dueDate ? formatDate(task.dueDate) : "No due date"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Start {task.startDate ? formatDate(task.startDate) : "Not set"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Clock3 className="h-4 w-4 text-blue-500" />
                Tracking
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {formatHours(task.timeSpentHours)} spent
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatHours(task.remainingEstimateHours)} remaining
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock3 className="h-4 w-4 text-slate-400" />
              <span>
                {task.watchers?.length || 0} watcher{task.watchers?.length === 1 ? "" : "s"} ·{" "}
                {(task.labels || []).length} label{(task.labels || []).length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                className="field-select min-w-[190px]"
                value={task.assignedTo?._id || ""}
                disabled={isUpdating || isDeleting}
                onChange={(event) =>
                  onTaskUpdate(task._id, {
                    assignedTo: event.target.value || null,
                  })
                }
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>

              <select
                className="field-select min-w-[180px]"
                value={task.status}
                disabled={isUpdating || isDeleting}
                onChange={(event) =>
                  onTaskUpdate(task._id, {
                    status: event.target.value,
                  })
                }
              >
                {taskStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                className="field-select min-w-[170px]"
                value={task.priority}
                disabled={isUpdating || isDeleting}
                onChange={(event) =>
                  onTaskUpdate(task._id, {
                    priority: event.target.value,
                  })
                }
              >
                {taskPriorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <Button type="button" variant="secondary" size="sm" onClick={() => setIsDetailsOpen(true)}>
                <Eye className="h-4 w-4" />
                Details
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isUpdating || isDeleting || task.status === "closed"}
                onClick={() =>
                  onTaskUpdate(task._id, {
                    status: "closed",
                  })
                }
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark Done
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isUpdating || isDeleting}
                onClick={() => {
                  const shouldDelete = window.confirm(
                    `Delete "${task.title}"? This action cannot be undone.`
                  );

                  if (shouldDelete) {
                    onDeleteTask(task._id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete Task"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskDetailsDialog
        availableTasks={tasks}
        isAdmin
        onOpenChange={setIsDetailsOpen}
        open={isDetailsOpen}
        taskId={task._id}
        users={users}
      />
    </>
  );
};

export default AdminTaskCard;
