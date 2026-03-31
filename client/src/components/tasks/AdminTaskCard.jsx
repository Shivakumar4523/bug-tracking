import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Trash2,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, titleCase } from "@/lib/utils";

const statusVariant = {
  open: "secondary",
  "in-progress": "default",
  closed: "success",
};

const priorityVariant = {
  low: "secondary",
  medium: "warning",
  high: "danger",
};

const AdminTaskCard = ({
  task,
  isUpdating,
  isDeleting,
  onDeleteTask,
  onTaskUpdate,
  users = [],
}) => (
  <Card className="transition duration-200 hover:border-blue-200">
    <CardContent className="space-y-5 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-lg font-semibold text-slate-900">{task.title}</p>
          <p className="max-w-3xl text-sm leading-6 text-slate-500">
            {task.description || "No additional description was provided for this task."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant[task.status] || "secondary"}>
            {titleCase(task.status)}
          </Badge>
          <Badge variant={priorityVariant[task.priority] || "secondary"}>
            {titleCase(task.priority)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <UserRound className="h-4 w-4 text-blue-500" />
            Assigned To
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {task.assignedTo?.name || "Unassigned"}
          </p>
          <p className="mt-1 text-xs text-slate-500">{task.assignedTo?.email || "No email available"}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <UserRoundPlus className="h-4 w-4 text-blue-500" />
            Created By
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {task.createdBy?.name || "PIRNAV Admin"}
          </p>
          <p className="mt-1 text-xs text-slate-500">{task.createdBy?.email || "No email available"}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <CalendarDays className="h-4 w-4 text-blue-500" />
            Due Date
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {task.dueDate ? formatDate(task.dueDate) : "No due date"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Created {formatDate(task.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock3 className="h-4 w-4 text-slate-400" />
          <span>Update ownership, priority, and progress directly from the dashboard.</span>
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
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="closed">Closed</option>
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
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

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
            Close Task
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
);

export default AdminTaskCard;
