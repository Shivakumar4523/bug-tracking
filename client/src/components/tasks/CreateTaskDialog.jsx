import { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, PlusCircle, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialForm = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "medium",
  status: "open",
  dueDate: "",
};

const CreateTaskDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  users,
  defaultAssignedTo = "",
}) => {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setFormData(initialForm);
      setError("");
      return;
    }

    setFormData({
      ...initialForm,
      assignedTo:
        defaultAssignedTo && users.some((user) => user._id === defaultAssignedTo)
          ? defaultAssignedTo
          : "",
    });
  }, [defaultAssignedTo, open, users]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      setError("Task title is required.");
      return;
    }

    try {
      setError("");
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignedTo: formData.assignedTo || null,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate || null,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Unable to create the task.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-blue-600">
            <PlusCircle className="h-3.5 w-3.5" />
            Create Task
          </div>
          <DialogTitle>Assign a new task</DialogTitle>
          <DialogDescription>
            Create a task, assign ownership now or later, and set the team up for clear follow-through.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="task-title">
              Title
            </label>
            <Input
              id="task-title"
              name="title"
              placeholder="Prepare release notes for the April sprint"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="task-description">
              Description
            </label>
            <Textarea
              id="task-description"
              name="description"
              placeholder="Summarize completed work, known issues, and rollout expectations."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="task-assigned-to">
                Assignee
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                <select
                  id="task-assigned-to"
                  name="assignedTo"
                  className="field-select pl-11"
                  value={formData.assignedTo}
                  onChange={handleChange}
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="task-due-date">
                Due Date
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                <Input
                  id="task-due-date"
                  name="dueDate"
                  type="date"
                  className="pl-11"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="task-priority">
                Priority
              </label>
              <select
                id="task-priority"
                name="priority"
                className="field-select"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="task-status">
                Initial Status
              </label>
              <select
                id="task-status"
                name="status"
                className="field-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating task..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
