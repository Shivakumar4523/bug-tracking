import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  GitBranch,
  LoaderCircle,
  MessageSquareText,
  Paperclip,
  PlusCircle,
  Save,
  TimerReset,
  Trash2,
  Users,
} from "lucide-react";
import {
  createTaskComment,
  createTaskWorkLog,
  fetchTask,
  updateTask,
  uploadTaskAttachments,
} from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  getTaskLinkTypeLabel,
  getTaskPriorityLabel,
  getTaskPriorityVariant,
  getTaskStatusLabel,
  getTaskStatusVariant,
  getTaskTypeLabel,
  taskLinkTypeOptions,
  taskPriorityOptions,
  taskStatusOptions,
  taskTypeOptions,
} from "@/lib/workspace";
import { formatDateTime, formatFileSize, formatHours, getInitials } from "@/lib/utils";

const buildFormState = (task) => ({
  title: task?.title || "",
  description: task?.description || "",
  type: task?.type || "task",
  status: task?.status || "open",
  priority: task?.priority || "medium",
  assignedTo: task?.assignedTo?._id || "",
  watchers: (task?.watchers || []).map((watcher) => watcher._id),
  startDate: task?.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : "",
  dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
  originalEstimateHours: String(task?.originalEstimateHours ?? 0),
  timeSpentHours: String(task?.timeSpentHours ?? 0),
  remainingEstimateHours: String(task?.remainingEstimateHours ?? 0),
  labels: (task?.labels || []).join(", "),
  components: (task?.components || []).join(", "),
  fixVersions: (task?.fixVersions || []).join(", "),
  affectsVersions: (task?.affectsVersions || []).join(", "),
  environment: task?.environment || "",
  links: (task?.links || []).map((link) => ({
    relationType: link.relationType || "relates-to",
    taskId: link.taskId?._id || link.taskId || "",
  })),
});

const toList = (value = "") =>
  [...new Set(String(value).split(",").map((item) => item.trim()).filter(Boolean))];

const buildPayload = (formState) => ({
  title: formState.title.trim(),
  description: formState.description.trim(),
  type: formState.type,
  status: formState.status,
  priority: formState.priority,
  assignedTo: formState.assignedTo || null,
  watchers: formState.watchers,
  startDate: formState.startDate || null,
  dueDate: formState.dueDate || null,
  originalEstimateHours: Number(formState.originalEstimateHours || 0),
  timeSpentHours: Number(formState.timeSpentHours || 0),
  remainingEstimateHours: Number(formState.remainingEstimateHours || 0),
  labels: toList(formState.labels),
  components: toList(formState.components),
  fixVersions: toList(formState.fixVersions),
  affectsVersions: toList(formState.affectsVersions),
  environment: formState.environment.trim(),
  links: formState.links.filter((link) => link.taskId),
});

const readFilesAsAttachments = async (files) =>
  Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              originalName: file.name,
              mimeType: file.type || "application/octet-stream",
              size: file.size,
              dataUrl: reader.result,
            });
          reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
          reader.readAsDataURL(file);
        })
    )
  );

const TaskDetailsDialog = ({ availableTasks = [], isAdmin = false, onOpenChange, open, taskId, users = [] }) => {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState(buildFormState(null));
  const [commentText, setCommentText] = useState("");
  const [workLogDescription, setWorkLogDescription] = useState("");
  const [workLogHours, setWorkLogHours] = useState("1");
  const [error, setError] = useState("");

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask(taskId),
    enabled: Boolean(open && taskId),
  });

  useEffect(() => {
    setFormState(buildFormState(task));
    setCommentText("");
    setWorkLogDescription("");
    setWorkLogHours("1");
    setError("");
  }, [task]);

  const availableUsers = useMemo(() => users.filter((entry) => entry.role !== "Admin"), [users]);
  const relatedTaskOptions = useMemo(
    () => availableTasks.filter((entry) => entry._id !== taskId),
    [availableTasks, taskId]
  );
  const originalPayload = useMemo(() => (task ? buildPayload(buildFormState(task)) : null), [task]);
  const currentPayload = useMemo(() => buildPayload(formState), [formState]);
  const hasChanges = task
    ? JSON.stringify(isAdmin ? currentPayload : { status: currentPayload.status }) !==
      JSON.stringify(isAdmin ? originalPayload : { status: originalPayload.status })
    : false;
  const activityEntries = useMemo(
    () => [...(task?.activity || [])].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    [task]
  );

  const invalidateTask = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["task", taskId] });
  };

  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: invalidateTask,
  });
  const commentMutation = useMutation({
    mutationFn: createTaskComment,
    onSuccess: () => {
      invalidateTask();
      setCommentText("");
    },
  });
  const workLogMutation = useMutation({
    mutationFn: createTaskWorkLog,
    onSuccess: () => {
      invalidateTask();
      setWorkLogDescription("");
      setWorkLogHours("1");
    },
  });
  const attachmentMutation = useMutation({
    mutationFn: uploadTaskAttachments,
    onSuccess: invalidateTask,
  });

  const handleFieldChange = (field, value) =>
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));

  const handleSave = async () => {
    try {
      setError("");
      await updateTaskMutation.mutateAsync({
        id: taskId,
        payload: isAdmin ? currentPayload : { status: currentPayload.status },
      });
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Unable to save task changes.");
    }
  };

  const handleAttachmentUpload = async (event) => {
    if (!event.target.files?.length) {
      return;
    }

    try {
      setError("");
      const attachments = await readFilesAsAttachments(event.target.files);
      await attachmentMutation.mutateAsync({
        taskId,
        attachments,
      });
    } catch (submitError) {
      setError(submitError.response?.data?.message || submitError.message || "Unable to upload files.");
    } finally {
      event.target.value = "";
    }
  };

  const assigneeLabel = task?.assignedTo?.name || "Unassigned";
  const assigneeEmail = task?.assignedTo?.email || "No email available";
  const hasWatchers = Boolean(task?.watchers?.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            {task ? (
              <>
                <Badge variant={getTaskPriorityVariant(task.priority)}>{getTaskPriorityLabel(task.priority)}</Badge>
                <Badge variant="secondary">{getTaskTypeLabel(task.type)}</Badge>
                <Badge variant={getTaskStatusVariant(task.status)}>{getTaskStatusLabel(task.status)}</Badge>
              </>
            ) : null}
          </div>
          <DialogTitle>{task?.title || "Task details"}</DialogTitle>
          <DialogDescription>
            Manage task metadata, workflow, comments, work logs, attachments, and activity in one place.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(100vh-8rem)]">
          <div className="space-y-6 p-6">
            {isLoading || !task ? (
              <>
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
              </>
            ) : (
              <>
                <section className="grid gap-4 md:grid-cols-4">
                  {taskStatusOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`rounded-[22px] border p-4 ${
                        option.value === formState.status ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Workflow</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">{option.label}</p>
                    </div>
                  ))}
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="grid gap-4">
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.22em] text-slate-500">Summary</span>
                      <Input disabled={!isAdmin} value={formState.title} onChange={(event) => handleFieldChange("title", event.target.value)} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.22em] text-slate-500">Description</span>
                      <Textarea rows={4} disabled={!isAdmin} value={formState.description} onChange={(event) => handleFieldChange("description", event.target.value)} />
                    </label>
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.22em] text-slate-500">Issue Type</span>
                        <select className="field-select" disabled={!isAdmin} value={formState.type} onChange={(event) => handleFieldChange("type", event.target.value)}>
                          {taskTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.22em] text-slate-500">Priority</span>
                        <select className="field-select" disabled={!isAdmin} value={formState.priority} onChange={(event) => handleFieldChange("priority", event.target.value)}>
                          {taskPriorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs uppercase tracking-[0.22em] text-slate-500">Status</span>
                        <select className="field-select" value={formState.status} onChange={(event) => handleFieldChange("status", event.target.value)}>
                          {taskStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                    </div>
                  </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                  <div className="space-y-6">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <p className="font-semibold text-slate-900">Assignment Details</p>
                      </div>
                      <div className="grid gap-4">
                        {isAdmin ? (
                          <label className="space-y-2">
                            <span className="text-xs uppercase tracking-[0.22em] text-slate-500">Assignee</span>
                            <select className="field-select" value={formState.assignedTo} onChange={(event) => handleFieldChange("assignedTo", event.target.value)}>
                              <option value="">Unassigned</option>
                              {availableUsers.map((entry) => <option key={entry._id} value={entry._id}>{entry.name}</option>)}
                            </select>
                          </label>
                        ) : (
                          <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Assignee</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{assigneeLabel}</p>
                            <p className="mt-1 text-xs text-slate-500">{assigneeEmail}</p>
                          </div>
                        )}
                        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Reporter</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">{task.createdBy?.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{task.createdBy?.email}</p>
                        </div>
                        {isAdmin ? (
                          <label className="space-y-2">
                            <span className="text-xs uppercase tracking-[0.22em] text-slate-500">Watchers</span>
                            <select
                              multiple
                              className="field-select min-h-[150px]"
                              value={formState.watchers}
                              onChange={(event) =>
                                handleFieldChange(
                                  "watchers",
                                  Array.from(event.target.selectedOptions).map((option) => option.value)
                                )
                              }
                            >
                              {availableUsers.map((entry) => <option key={entry._id} value={entry._id}>{entry.name} ({entry.email})</option>)}
                            </select>
                          </label>
                        ) : (
                          <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Watchers</p>
                            {hasWatchers ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {task.watchers.map((watcher) => (
                                  <Badge key={watcher._id} variant="outline">
                                    {watcher.name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm text-slate-500">No watchers following this task yet.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <TimerReset className="h-4 w-4 text-blue-600" />
                        <p className="font-semibold text-slate-900">Time Tracking</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <label className="space-y-2"><span className="text-xs uppercase tracking-[0.22em] text-slate-500">Start Date</span><Input type="date" disabled={!isAdmin} value={formState.startDate} onChange={(event) => handleFieldChange("startDate", event.target.value)} /></label>
                        <label className="space-y-2"><span className="text-xs uppercase tracking-[0.22em] text-slate-500">Due Date</span><Input type="date" disabled={!isAdmin} value={formState.dueDate} onChange={(event) => handleFieldChange("dueDate", event.target.value)} /></label>
                        <label className="space-y-2"><span className="text-xs uppercase tracking-[0.22em] text-slate-500">Original Estimate</span><Input type="number" min="0" step="0.5" disabled={!isAdmin} value={formState.originalEstimateHours} onChange={(event) => handleFieldChange("originalEstimateHours", event.target.value)} /></label>
                        <label className="space-y-2"><span className="text-xs uppercase tracking-[0.22em] text-slate-500">Time Spent</span><Input type="number" min="0" step="0.5" disabled={!isAdmin} value={formState.timeSpentHours} onChange={(event) => handleFieldChange("timeSpentHours", event.target.value)} /></label>
                        <label className="space-y-2"><span className="text-xs uppercase tracking-[0.22em] text-slate-500">Remaining Estimate</span><Input type="number" min="0" step="0.5" disabled={!isAdmin} value={formState.remainingEstimateHours} onChange={(event) => handleFieldChange("remainingEstimateHours", event.target.value)} /></label>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-blue-600" />
                        <p className="font-semibold text-slate-900">Linked Tasks</p>
                      </div>
                      <div className="space-y-3">
                        {isAdmin ? (
                          <>
                            {formState.links.length ? (
                              formState.links.map((link, index) => (
                                <div key={`${link.taskId}-${index}`} className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)_auto]">
                                  <select className="field-select" value={link.relationType} onChange={(event) => setFormState((current) => ({ ...current, links: current.links.map((item, itemIndex) => itemIndex === index ? { ...item, relationType: event.target.value } : item) }))}>
                                    {taskLinkTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                  </select>
                                  <select className="field-select" value={link.taskId} onChange={(event) => setFormState((current) => ({ ...current, links: current.links.map((item, itemIndex) => itemIndex === index ? { ...item, taskId: event.target.value } : item) }))}>
                                    <option value="">Select linked task</option>
                                    {relatedTaskOptions.map((entry) => <option key={entry._id} value={entry._id}>{entry.title}</option>)}
                                  </select>
                                  <Button type="button" variant="secondary" onClick={() => setFormState((current) => ({ ...current, links: current.links.filter((_, itemIndex) => itemIndex !== index) }))}>
                                    <Trash2 className="h-4 w-4" />
                                    Remove
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                                No linked tasks yet.
                              </div>
                            )}
                            <Button type="button" variant="secondary" onClick={() => setFormState((current) => ({ ...current, links: [...current.links, { relationType: "relates-to", taskId: "" }] }))}>
                              <PlusCircle className="h-4 w-4" />
                              Add Link
                            </Button>
                          </>
                        ) : task.links?.length ? (
                          <div className="space-y-2">
                            {task.links.map((link) => (
                              <div key={link._id || `${link.relationType}-${link.taskId?._id}`} className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                <span className="font-semibold text-slate-900">{getTaskLinkTypeLabel(link.relationType)}</span> {link.taskId?.title || "Linked task"}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                            No linked tasks yet.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-blue-600" />
                        <p className="font-semibold text-slate-900">Additional Fields</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2"><span className="text-xs uppercase tracking-[0.22em] text-slate-500">Labels</span><Input disabled={!isAdmin} placeholder="frontend, auth, urgent" value={formState.labels} onChange={(event) => handleFieldChange("labels", event.target.value)} /></label>
                        <label className="space-y-2"><span className="text-xs uppercase tracking-[0.22em] text-slate-500">Components</span><Input disabled={!isAdmin} placeholder="Dashboard, Billing API" value={formState.components} onChange={(event) => handleFieldChange("components", event.target.value)} /></label>
                        <label className="space-y-2"><span className="text-xs uppercase tracking-[0.22em] text-slate-500">Fix Version</span><Input disabled={!isAdmin} placeholder="v2.4.0" value={formState.fixVersions} onChange={(event) => handleFieldChange("fixVersions", event.target.value)} /></label>
                        <label className="space-y-2"><span className="text-xs uppercase tracking-[0.22em] text-slate-500">Affects Version</span><Input disabled={!isAdmin} placeholder="v2.3.1" value={formState.affectsVersions} onChange={(event) => handleFieldChange("affectsVersions", event.target.value)} /></label>
                        <label className="space-y-2 md:col-span-2"><span className="text-xs uppercase tracking-[0.22em] text-slate-500">Environment</span><Textarea rows={3} disabled={!isAdmin} placeholder="Chrome on Windows 11, staging workspace" value={formState.environment} onChange={(event) => handleFieldChange("environment", event.target.value)} /></label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-blue-600" />
                        <p className="font-semibold text-slate-900">Attachments</p>
                      </div>
                      <label className="block rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        Upload files
                        <input className="mt-3 block w-full text-sm" multiple type="file" onChange={handleAttachmentUpload} />
                      </label>
                      <div className="mt-4 space-y-3">
                        {task.attachments?.length ? task.attachments.map((attachment) => (
                          <a key={attachment._id} className="block rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50" download={attachment.originalName} href={attachment.dataUrl}>
                            <p className="text-sm font-semibold text-slate-900">{attachment.originalName}</p>
                            <p className="mt-1 text-xs text-slate-500">{formatFileSize(attachment.size)} · {attachment.mimeType}</p>
                            <p className="mt-1 text-xs text-slate-500">Uploaded by {attachment.uploadedBy?.name || "Unknown"} on {formatDateTime(attachment.uploadedAt)}</p>
                          </a>
                        )) : (
                          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                            No attachments uploaded yet.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <MessageSquareText className="h-4 w-4 text-blue-600" />
                        <p className="font-semibold text-slate-900">Comments</p>
                      </div>
                      <form className="space-y-3" onSubmit={async (event) => {
                        event.preventDefault();
                        if (!commentText.trim()) return;
                        try {
                          setError("");
                          await commentMutation.mutateAsync({ taskId, text: commentText.trim() });
                        } catch (submitError) {
                          setError(submitError.response?.data?.message || "Unable to add the comment.");
                        }
                      }}>
                        <Textarea rows={3} placeholder="Add a comment and mention teammates with @name" value={commentText} onChange={(event) => setCommentText(event.target.value)} />
                        <Button className="w-full" disabled={commentMutation.isPending} type="submit">
                          {commentMutation.isPending ? "Posting..." : "Add Comment"}
                        </Button>
                      </form>
                      <Separator className="my-5" />
                      <div className="space-y-3">
                        {task.comments?.length ? task.comments.map((comment) => (
                          <div key={comment._id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>{getInitials(comment.userId?.name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-900">{comment.userId?.name}</p>
                                  <span className="text-xs text-slate-500">{formatDateTime(comment.createdAt)}</span>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{comment.text}</p>
                                {comment.mentions?.length ? <div className="mt-3 flex flex-wrap gap-2">{comment.mentions.map((mention) => <Badge key={mention} variant="outline">@{mention}</Badge>)}</div> : null}
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">No comments yet.</div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <TimerReset className="h-4 w-4 text-blue-600" />
                        <p className="font-semibold text-slate-900">Work Logs</p>
                      </div>
                      <form className="space-y-3" onSubmit={async (event) => {
                        event.preventDefault();
                        try {
                          setError("");
                          await workLogMutation.mutateAsync({
                            taskId,
                            description: workLogDescription.trim(),
                            timeSpentHours: Number(workLogHours || 0),
                          });
                        } catch (submitError) {
                          setError(submitError.response?.data?.message || "Unable to log work.");
                        }
                      }}>
                        <Textarea rows={2} placeholder="What work was completed?" value={workLogDescription} onChange={(event) => setWorkLogDescription(event.target.value)} />
                        <div className="flex gap-3">
                          <Input min="0.5" step="0.5" type="number" value={workLogHours} onChange={(event) => setWorkLogHours(event.target.value)} />
                          <Button disabled={workLogMutation.isPending} type="submit">
                            {workLogMutation.isPending ? "Logging..." : "Log Work"}
                          </Button>
                        </div>
                      </form>
                      <Separator className="my-5" />
                      <div className="space-y-3">
                        {task.workLogs?.length ? task.workLogs.map((entry) => (
                          <div key={entry._id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{entry.userId?.name}</p>
                                <p className="mt-1 text-xs text-slate-500">{formatDateTime(entry.createdAt)}</p>
                              </div>
                              <Badge variant="secondary">{formatHours(entry.timeSpentHours)}</Badge>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                              {entry.description || "Work log added without extra notes."}
                            </p>
                          </div>
                        )) : (
                          <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">No work logged yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">Activity</p>
                      <p className="mt-1 text-sm text-slate-500">
                        All updates, comments, work logs, and status changes for this task.
                      </p>
                    </div>
                    <Badge variant="secondary">{activityEntries.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {activityEntries.length ? activityEntries.map((entry) => (
                      <div key={entry._id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{entry.userId?.name || "Workspace"}</p>
                          <span className="text-xs text-slate-500">{formatDateTime(entry.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{entry.message}</p>
                      </div>
                    )) : (
                      <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">No activity recorded yet.</div>
                    )}
                  </div>
                </section>

                {error ? (
                  <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                  <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                  <Button disabled={!hasChanges || updateTaskMutation.isPending} type="button" onClick={handleSave}>
                    {updateTaskMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog;
