import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  LoaderCircle,
  MessageSquareText,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { createComment, fetchComments } from "@/lib/api";
import { formatDate, getInitials } from "@/lib/utils";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const priorityVariant = {
  Low: "secondary",
  Medium: "warning",
  High: "danger",
};

const IssueDetailsDialog = ({
  issue,
  open,
  onOpenChange,
  projects,
  onUpdateIssue,
  onDeleteIssue,
  updatingId,
  deletingId,
}) => {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const projectId = issue?.projectId?._id || issue?.projectId;
  const project = useMemo(
    () => projects.find((item) => item._id === projectId),
    [projects, projectId]
  );
  const members = project?.members || [];

  const { data: comments = [], isLoading: isCommentsLoading } = useQuery({
    queryKey: ["comments", issue?._id],
    queryFn: () => fetchComments(issue._id),
    enabled: open && Boolean(issue?._id),
  });

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({
        queryKey: ["comments", issue?._id],
      });
    },
  });

  const handleSubmitComment = async (event) => {
    event.preventDefault();

    if (!commentText.trim()) {
      return;
    }

    await createCommentMutation.mutateAsync({
      issueId: issue._id,
      text: commentText.trim(),
    });
  };

  if (!issue) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={priorityVariant[issue.priority] || "secondary"}>
              {issue.priority}
            </Badge>
            <Badge variant="secondary">{issue.type}</Badge>
            <Badge variant="outline">
              {issue.status === "todo"
                ? "To Do"
                : issue.status === "inprogress"
                  ? "In Progress"
                  : "Done"}
            </Badge>
          </div>
          <DialogTitle className="pr-10">{issue.title}</DialogTitle>
          <DialogDescription>
            {issue.description || "No detailed description has been added yet."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Project
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {issue.projectId?.name || "Unknown project"}
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
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Status
                </span>
                <select
                  className="field-select"
                  value={issue.status}
                  onChange={(event) =>
                    onUpdateIssue(issue._id, { status: event.target.value })
                  }
                  disabled={updatingId === issue._id}
                >
                  <option value="todo">To Do</option>
                  <option value="inprogress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Priority
                </span>
                <select
                  className="field-select"
                  value={issue.priority}
                  onChange={(event) =>
                    onUpdateIssue(issue._id, { priority: event.target.value })
                  }
                  disabled={updatingId === issue._id}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Assignee
                </span>
                <select
                  className="field-select"
                  value={issue.assignee?._id || ""}
                  onChange={(event) =>
                    onUpdateIssue(issue._id, {
                      assignee: event.target.value || null,
                    })
                  }
                  disabled={updatingId === issue._id}
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Reporter
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(issue.reporter?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {issue.reporter?.name}
                    </p>
                    <p className="text-xs text-slate-500">{issue.reporter?.role}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  Current owner
                </p>
                {issue.assignee ? (
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(issue.assignee?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {issue.assignee?.name}
                      </p>
                      <p className="text-xs text-slate-500">{issue.assignee?.role}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                    <UserCircle2 className="h-4 w-4" />
                    <span>No one is assigned yet.</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              className="w-full sm:w-auto"
              variant="destructive"
              type="button"
              disabled={deletingId === issue._id}
              onClick={async () => {
                await onDeleteIssue(issue._id);
                onOpenChange(false);
              }}
            >
              {deletingId === issue._id ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Issue
            </Button>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-blue-500" />
              <p className="font-semibold text-slate-900">Discussion</p>
            </div>

            <form className="space-y-3" onSubmit={handleSubmitComment}>
              <Input
                placeholder="Add a status update or implementation note"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
              />
              <Button
                className="w-full"
                disabled={createCommentMutation.isPending}
                type="submit"
              >
                {createCommentMutation.isPending ? "Posting..." : "Add Comment"}
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
                        <AvatarFallback>
                          {getInitials(comment.userId?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {comment.userId?.name}
                          </p>
                          <span className="text-xs text-slate-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {comment.text}
                        </p>
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
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IssueDetailsDialog;
