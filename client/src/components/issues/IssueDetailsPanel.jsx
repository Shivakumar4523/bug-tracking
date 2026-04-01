import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  LoaderCircle,
  MessageSquareText,
  Save,
  Trash2,
  UserCircle2,
  X,
} from "lucide-react";
import { createComment, fetchComments } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  getIssuePriorityVariant,
  getIssueStatusLabel,
  issuePriorityOptions,
  issueStatusOptions,
  issueTypeOptions,
} from "@/lib/workspace";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";

const buildFormState = (issue) => ({
  title: issue?.title || "",
  description: issue?.description || "",
  type: issue?.type || "Task",
  status: issue?.status || "todo",
  priority: issue?.priority || "Medium",
  assignee: issue?.assignee?._id || "",
  dueDate: issue?.dueDate ? new Date(issue.dueDate).toISOString().slice(0, 10) : "",
});

const buildPayload = (formState) => ({
  title: formState.title.trim(),
  description: formState.description.trim(),
  type: formState.type,
  status: formState.status,
  priority: formState.priority,
  assignee: formState.assignee || null,
  dueDate: formState.dueDate || null,
});

const getProjectMembers = (project) => {
  if (!project) {
    return [];
  }

  const members = new Map();
  project.members?.forEach((member) => members.set(member._id, member));

  if (project.owner?._id) {
    members.set(project.owner._id, project.owner);
  }

  return Array.from(members.values());
};

const IssueDetailsPanel = ({
  deletingId,
  isProjectLoading = false,
  issue,
  onClose,
  onDeleteIssue,
  onUpdateIssue,
  projects,
  updatingId,
}) => {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState(buildFormState(issue));
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    setFormState(buildFormState(issue));
    setCommentText("");
  }, [issue]);

  const projectId = issue?.projectId?._id || issue?.projectId || "";
  const project = useMemo(
    () => projects.find((item) => item._id === projectId),
    [projects, projectId]
  );
  const members = useMemo(() => getProjectMembers(project), [project]);
  const hasChanges = issue
    ? JSON.stringify(buildPayload(formState)) !== JSON.stringify(buildPayload(buildFormState(issue)))
    : false;

  const { data: comments = [], isLoading: isCommentsLoading } = useQuery({
    queryKey: ["comments", issue?._id],
    queryFn: () => fetchComments(issue._id),
    enabled: Boolean(issue?._id),
  });

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["comments", issue?._id] });
    },
  });

  if (!issue) {
    return (
      <Card className="h-full border-dashed border-slate-300 bg-slate-50/80 shadow-none">
        <CardContent className="flex min-h-[520px] flex-col items-center justify-center px-6 py-10 text-center">
          <div className="mb-4 rounded-full border border-slate-200 bg-white p-3 text-slate-500">
            <MessageSquareText className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">Issue panel</h3>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
            Click any task card on the board or in the issue finder to inspect, edit, and comment
            on it here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden border border-slate-200/90 bg-white/95">
      <CardContent className="flex h-full flex-col p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={getIssuePriorityVariant(issue.priority)}>{issue.priority}</Badge>
                <Badge variant="secondary">{issue.type}</Badge>
                <Badge variant="outline">{getIssueStatusLabel(issue.status)}</Badge>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Detail Panel
                </p>
                <h2 className="text-xl font-semibold text-slate-900">{issue.title}</h2>
              </div>
            </div>

            <Button size="icon" type="button" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-6 p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Project</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {project?.name || issue.projectId?.name || "Unknown project"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {project?.key || issue.projectId?.key || "No key"}
                </p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Created
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {formatDate(issue.createdAt)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(issue.createdAt)}</p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Reporter</p>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(issue.reporter?.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{issue.reporter?.name}</p>
                    <p className="text-xs text-slate-500">{issue.reporter?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.22em] text-slate-500">Title</span>
                  <Input
                    value={formState.title}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, title: event.target.value }))
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    Description
                  </span>
                  <Textarea
                    rows={5}
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      Assignee
                    </span>
                    <select
                      className="field-select"
                      disabled={isProjectLoading}
                      value={formState.assignee}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          assignee: event.target.value,
                        }))
                      }
                    >
                      <option value="">Unassigned</option>
                      {members.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      Status
                    </span>
                    <select
                      className="field-select"
                      value={formState.status}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                    >
                      {issueStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      Priority
                    </span>
                    <select
                      className="field-select"
                      value={formState.priority}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          priority: event.target.value,
                        }))
                      }
                    >
                      {issuePriorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.22em] text-slate-500">Type</span>
                    <select
                      className="field-select"
                      value={formState.type}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          type: event.target.value,
                        }))
                      }
                    >
                      {issueTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      Due Date
                    </span>
                    <Input
                      type="date"
                      value={formState.dueDate}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, dueDate: event.target.value }))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button
                  disabled={!hasChanges || updatingId === issue._id}
                  type="button"
                  onClick={() => onUpdateIssue(issue._id, buildPayload(formState))}
                >
                  {updatingId === issue._id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save changes
                </Button>

                <Button
                  disabled={deletingId === issue._id}
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    await onDeleteIssue(issue._id);
                    onClose();
                  }}
                >
                  {deletingId === issue._id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete issue
                </Button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-teal-600" />
                <p className="font-semibold text-slate-900">Comments</p>
              </div>

              <form
                className="space-y-3"
                onSubmit={async (event) => {
                  event.preventDefault();

                  if (!commentText.trim()) {
                    return;
                  }

                  await createCommentMutation.mutateAsync({
                    issueId: issue._id,
                    text: commentText.trim(),
                  });
                }}
              >
                <Textarea
                  placeholder="Add context, implementation notes, or a handoff update"
                  rows={3}
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                />
                <Button className="w-full" disabled={createCommentMutation.isPending} type="submit">
                  {createCommentMutation.isPending ? "Posting..." : "Add comment"}
                </Button>
              </form>

              <Separator className="my-5" />

              <div className="space-y-4">
                {isCommentsLoading ? (
                  <>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </>
                ) : comments.length ? (
                  comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="rounded-[24px] border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getInitials(comment.userId?.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">
                              {comment.userId?.name}
                            </p>
                            <span className="text-xs text-slate-500">
                              {formatDateTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{comment.text}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm leading-6 text-slate-500">
                    No comments yet. Add the first delivery note for this issue.
                  </div>
                )}
              </div>
            </div>

            {!project && !isProjectLoading ? (
              <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <UserCircle2 className="mt-0.5 h-4 w-4" />
                <span>
                  The latest project member list could not be loaded, so assignee options may be
                  limited.
                </span>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default IssueDetailsPanel;
