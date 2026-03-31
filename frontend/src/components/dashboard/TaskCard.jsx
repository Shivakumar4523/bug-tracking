import { CalendarDays, CircleCheckBig, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, titleCase } from "@/lib/utils";

const statusBadgeVariant = {
  open: "secondary",
  "in-progress": "default",
  closed: "success",
};

const priorityBadgeVariant = {
  low: "secondary",
  medium: "warning",
  high: "danger",
};

const statusLabel = {
  open: "Open",
  "in-progress": "In Progress",
  closed: "Closed",
};

const TaskCard = ({ task, isUpdating, onMarkInProgress, onCloseTask }) => {
  const dueDateLabel = task.dueDate ? formatDate(task.dueDate) : "No due date";

  return (
    <Card className="transition duration-200 hover:border-blue-200">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-slate-900">{task.title}</p>
              <p className="line-clamp-2 max-w-2xl text-sm leading-6 text-slate-500">
                {task.description || "No additional details were provided for this task."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusBadgeVariant[task.status] || "secondary"}>
                {statusLabel[task.status] || "Open"}
              </Badge>
              <Badge variant={priorityBadgeVariant[task.priority] || "secondary"}>
                {titleCase(task.priority)}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <span>Due: {dueDateLabel}</span>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Assigned by {task.createdBy?.name || "PIRNAV"}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isUpdating || task.status === "in-progress" || task.status === "closed"}
                onClick={() => onMarkInProgress(task._id)}
              >
                <PlayCircle className="h-4 w-4" />
                Mark In Progress
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isUpdating || task.status === "closed"}
                onClick={() => onCloseTask(task._id)}
              >
                <CircleCheckBig className="h-4 w-4" />
                Close Task
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
