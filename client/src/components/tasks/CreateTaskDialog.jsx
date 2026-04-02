import { useEffect, useMemo, useState } from "react";
import { AlertCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  taskLinkTypeOptions,
  taskPriorityOptions,
  taskStatusOptions,
  taskTypeOptions,
} from "@/lib/workspace";

const initialForm = {
  title: "",
  description: "",
  type: "task",
  priority: "medium",
  status: "open",
  assignedTo: "",
  watchers: [],
  startDate: "",
  dueDate: "",
  originalEstimateHours: "0",
  timeSpentHours: "0",
  remainingEstimateHours: "0",
  labels: "",
  components: "",
  fixVersions: "",
  affectsVersions: "",
  environment: "",
  links: [],
};

const toList = (value = "") =>
  [...new Set(String(value).split(",").map((item) => item.trim()).filter(Boolean))];

const CreateTaskDialog = ({
  defaultAssignedTo = "",
  isPending,
  onOpenChange,
  onSubmit,
  open,
  tasks = [],
  users,
}) => {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");

  const assignableUsers = useMemo(
    () => users.filter((user) => user.role !== "Admin"),
    [users]
  );

  useEffect(() => {
    if (!open) {
      setFormData(initialForm);
      setError("");
      return;
    }

    setFormData({
      ...initialForm,
      assignedTo:
        defaultAssignedTo && assignableUsers.some((user) => user._id === defaultAssignedTo)
          ? defaultAssignedTo
          : "",
    });
  }, [assignableUsers, defaultAssignedTo, open]);

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
      setError("Task summary is required.");
      return;
    }

    try {
      setError("");
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        assignedTo: formData.assignedTo || null,
        watchers: formData.watchers,
        startDate: formData.startDate || null,
        dueDate: formData.dueDate || null,
        originalEstimateHours: Number(formData.originalEstimateHours || 0),
        timeSpentHours: Number(formData.timeSpentHours || 0),
        remainingEstimateHours: Number(formData.remainingEstimateHours || 0),
        labels: toList(formData.labels),
        components: toList(formData.components),
        fixVersions: toList(formData.fixVersions),
        affectsVersions: toList(formData.affectsVersions),
        environment: formData.environment.trim(),
        links: formData.links.filter((link) => link.taskId),
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Unable to create the task.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl overflow-hidden">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-blue-600">
            <PlusCircle className="h-3.5 w-3.5" />
            Create Task
          </div>
          <DialogTitle>Assign a new task</DialogTitle>
          <DialogDescription>
            Capture Jira-style task details, ownership, tracking, linked work, and delivery context from the start.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100vh-14rem)] pr-4">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p>
                Summary, assignment, workflow, tracking, links, labels, components, versions, and environment can all be set here. Comments, work logs, activity, and attachments can be added from task details after creation.
              </p>
            </div>

            <div className="grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Summary</span>
                <Input name="title" placeholder="Prepare release notes for the April sprint" value={formData.title} onChange={handleChange} />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <Textarea name="description" placeholder="Add a detailed explanation of the work, expected output, and dependencies." value={formData.description} onChange={handleChange} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Issue Type</span>
                <select className="field-select" name="type" value={formData.type} onChange={handleChange}>
                  {taskTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Priority</span>
                <select className="field-select" name="priority" value={formData.priority} onChange={handleChange}>
                  {taskPriorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Initial Status</span>
                <select className="field-select" name="status" value={formData.status} onChange={handleChange}>
                  {taskStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Assignee</span>
                <select className="field-select" name="assignedTo" value={formData.assignedTo} onChange={handleChange}>
                  <option value="">Unassigned</option>
                  {assignableUsers.map((user) => <option key={user._id} value={user._id}>{user.name} ({user.email})</option>)}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Watchers</span>
                <select
                  multiple
                  className="field-select min-h-[150px]"
                  value={formData.watchers}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      watchers: Array.from(event.target.selectedOptions).map((option) => option.value),
                    }))
                  }
                >
                  {assignableUsers.map((user) => <option key={user._id} value={user._id}>{user.name} ({user.email})</option>)}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Start Date</span><Input name="startDate" type="date" value={formData.startDate} onChange={handleChange} /></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Due Date</span><Input name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} /></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Original Estimate</span><Input name="originalEstimateHours" type="number" min="0" step="0.5" value={formData.originalEstimateHours} onChange={handleChange} /></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Time Spent</span><Input name="timeSpentHours" type="number" min="0" step="0.5" value={formData.timeSpentHours} onChange={handleChange} /></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Remaining Estimate</span><Input name="remainingEstimateHours" type="number" min="0" step="0.5" value={formData.remainingEstimateHours} onChange={handleChange} /></label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">Linked Tasks</p>
                <Button type="button" variant="secondary" onClick={() => setFormData((current) => ({ ...current, links: [...current.links, { relationType: "relates-to", taskId: "" }] }))}>
                  <PlusCircle className="h-4 w-4" />
                  Add Link
                </Button>
              </div>
              {formData.links.length ? (
                <div className="space-y-3">
                  {formData.links.map((link, index) => (
                    <div key={`${link.taskId}-${index}`} className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_auto]">
                      <select
                        className="field-select"
                        value={link.relationType}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            links: current.links.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, relationType: event.target.value } : item
                            ),
                          }))
                        }
                      >
                        {taskLinkTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                      <select
                        className="field-select"
                        value={link.taskId}
                        onChange={(event) =>
                          setFormData((current) => ({
                            ...current,
                            links: current.links.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, taskId: event.target.value } : item
                            ),
                          }))
                        }
                      >
                        <option value="">Select linked task</option>
                        {tasks.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}
                      </select>
                      <Button type="button" variant="secondary" onClick={() => setFormData((current) => ({ ...current, links: current.links.filter((_, itemIndex) => itemIndex !== index) }))}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  No linked tasks added yet.
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Labels</span><Input name="labels" placeholder="frontend, auth, urgent" value={formData.labels} onChange={handleChange} /></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Components</span><Input name="components" placeholder="Dashboard, Billing API" value={formData.components} onChange={handleChange} /></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Fix Version</span><Input name="fixVersions" placeholder="v2.4.0" value={formData.fixVersions} onChange={handleChange} /></label>
              <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Affects Version</span><Input name="affectsVersions" placeholder="v2.3.1" value={formData.affectsVersions} onChange={handleChange} /></label>
              <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium text-slate-700">Environment</span><Textarea name="environment" placeholder="Chrome on Windows 11, staging workspace" value={formData.environment} onChange={handleChange} /></label>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
