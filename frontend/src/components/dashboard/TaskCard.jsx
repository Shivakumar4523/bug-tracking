import { useState } from "react";
import { CalendarDays, CircleCheckBig, Eye, PlayCircle, SearchCheck } from "lucide-react";
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
} from "@/lib/workspace";
import { formatDate, formatHours } from "@/lib/utils";

const TaskCard = ({ task, isUpdating, onStatusChange }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const dueDateLabel = task.dueDate ? formatDate(task.dueDate) : "No due date";
  const nextAction =
    task.status === "open"
      ? {
          label: "Start Task",
          icon: PlayCircle,
          status: "in-progress",
        }
      : task.status === "in-progress"
        ? {
            label: "Send to Review",
            icon: SearchCheck,
            status: "review",
          }
        : task.status === "review"
          ? {
              label: "Mark Done",
              icon: CircleCheckBig,
              status: "closed",
            }
          : null;

  return (
    <>
      <Card className="transition duration-200 hover:border-blue-200">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{getTaskTypeLabel(task.type)}</Badge>
                  <Badge variant={getTaskStatusVariant(task.status)}>
                    {getTaskStatusLabel(task.status)}
                  </Badge>
                  <Badge variant={getTaskPriorityVariant(task.priority)}>
                    {getTaskPriorityLabel(task.priority)}
                  </Badge>
                </div>
                <p className="text-lg font-semibold text-slate-900">{task.title}</p>
                <p className="line-clamp-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {task.description || "No additional details were provided for this task."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <span>Due: {dueDateLabel}</span>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {formatHours(task.timeSpentHours)} spent - {formatHours(task.remainingEstimateHours)} left
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  Reported by {task.createdBy?.name || "PIRNAV"}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsDetailsOpen(true)}
                >
                  <Eye className="h-4 w-4" />
                  Details
                </Button>

                {nextAction ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => onStatusChange(task._id, nextAction.status)}
                  >
                    <nextAction.icon className="h-4 w-4" />
                    {nextAction.label}
                  </Button>
                ) : (
                  <Button type="button" size="sm" disabled>
                    <CircleCheckBig className="h-4 w-4" />
                    Done
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskDetailsDialog onOpenChange={setIsDetailsOpen} open={isDetailsOpen} taskId={task._id} />
    </>
  );
};

export default TaskCard;
