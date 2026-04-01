import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FolderKanban,
  ListTodo,
  PlusCircle,
  Search,
  Target,
  Users2,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { createIssue, deleteIssue, fetchIssues, fetchProjects, updateIssue } from "@/lib/api";
import IssueBoard from "@/components/issues/IssueBoard";
import IssueCreateDialog from "@/components/issues/IssueCreateDialog";
import IssueDetailsPanel from "@/components/issues/IssueDetailsPanel";
import EmptyState from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, normalizeRole } from "@/lib/utils";
import { getIssuePriorityVariant } from "@/lib/workspace";

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

const DashboardPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [boardFilters, setBoardFilters] = useState({
    search: "",
    priority: "all",
    assignee: "all",
  });
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const deferredSearch = useDeferredValue(boardFilters.search);

  const currentView = searchParams.get("view") === "backlog" ? "backlog" : "sprint";
  const currentProjectId = searchParams.get("project") || "";
  const isAdmin = normalizeRole(user?.role) === "Admin";

  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects", "dashboard"],
    queryFn: fetchProjects,
  });

  useEffect(() => {
    if (!projects.length || currentProjectId) {
      return;
    }

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("project", projects[0]._id);

        if (!next.get("view")) {
          next.set("view", "sprint");
        }

        return next;
      },
      { replace: true }
    );
  }, [currentProjectId, projects, setSearchParams]);

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === currentProjectId) || projects[0] || null,
    [currentProjectId, projects]
  );

  const projectMembers = useMemo(() => getProjectMembers(selectedProject), [selectedProject]);

  const {
    data: issues = [],
    isLoading: isIssuesLoading,
    error: issuesError,
  } = useQuery({
    queryKey: [
      "issues",
      "dashboard",
      selectedProject?._id,
      deferredSearch,
      boardFilters.priority,
      boardFilters.assignee,
    ],
    queryFn: () =>
      fetchIssues({
        projectId: selectedProject?._id,
        search: deferredSearch,
        priority: boardFilters.priority,
        assignee: boardFilters.assignee,
      }),
    enabled: Boolean(selectedProject?._id),
  });

  useEffect(() => {
    if (!selectedIssue) {
      return;
    }

    const nextIssue = issues.find((issue) => issue._id === selectedIssue._id);
    setSelectedIssue(nextIssue || null);
  }, [issues, selectedIssue]);

  const createIssueMutation = useMutation({
    mutationFn: createIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const updateIssueMutation = useMutation({
    mutationFn: updateIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  const deleteIssueMutation = useMutation({
    mutationFn: deleteIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const stats = useMemo(() => {
    const todo = issues.filter((issue) => issue.status === "todo").length;
    const inProgress = issues.filter((issue) => issue.status === "inprogress").length;
    const done = issues.filter((issue) => issue.status === "done").length;

    return {
      todo,
      inProgress,
      done,
      team: projectMembers.length,
    };
  }, [issues, projectMembers.length]);

  const backlogIssues = useMemo(
    () =>
      [...issues]
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
        .filter((issue) => issue.status === "todo"),
    [issues]
  );

  const error = projectsError || issuesError;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-rose-600">
          {error.response?.data?.message || "Unable to load the workspace board."}
        </CardContent>
      </Card>
    );
  }

  if (!isProjectsLoading && !projects.length) {
    return (
      <EmptyState
        title="Create a project to start planning work"
        description="Projects power the sidebar, team membership, and the Jira-style board. Create one first, then come back here to run the sprint."
        action={
          isAdmin ? (
            <Button asChild type="button">
              <a href="/projects">Open Projects</a>
            </Button>
          ) : null
        }
        icon={<FolderKanban className="h-5 w-5" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="app-panel-strong overflow-hidden border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,253,250,0.92)_58%,rgba(236,253,245,0.88))] p-6 sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-teal-700">
              <Target className="h-3.5 w-3.5" />
              Jira-style delivery board
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {selectedProject?.name || "Sprint Workspace"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Move issues across the board, inspect details in the side panel, and keep the
                current sprint visible for everyone on the team.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{selectedProject?.key}</Badge>
              <Badge variant="outline">
                {currentView === "backlog" ? "Backlog view" : "Active sprint"}
              </Badge>
              <Badge variant="outline">{projectMembers.length} collaborators</Badge>
              {selectedProject?.endDate ? (
                <Badge variant="outline">Target {formatDate(selectedProject.endDate)}</Badge>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1 sm:min-w-[260px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-11"
                  placeholder="Search current project issues"
                  value={boardFilters.search}
                  onChange={(event) =>
                    setBoardFilters((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                />
              </div>

              <select
                className="field-select sm:w-[180px]"
                value={boardFilters.priority}
                onChange={(event) =>
                  setBoardFilters((current) => ({
                    ...current,
                    priority: event.target.value,
                  }))
                }
              >
                <option value="all">All priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>

              <select
                className="field-select sm:w-[220px]"
                value={boardFilters.assignee}
                onChange={(event) =>
                  setBoardFilters((current) => ({
                    ...current,
                    assignee: event.target.value,
                  }))
                }
              >
                <option value="all">All assignees</option>
                {projectMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <Button className="w-full sm:w-auto" type="button" onClick={() => setIsCreateIssueOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              Create Issue
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {isProjectsLoading || isIssuesLoading ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : (
          <>
            <Card className="border border-slate-200/90 bg-white/90">
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">To Do</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.todo}</p>
              </CardContent>
            </Card>
            <Card className="border border-slate-200/90 bg-white/90">
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">In Progress</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.inProgress}</p>
              </CardContent>
            </Card>
            <Card className="border border-slate-200/90 bg-white/90">
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Done</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.done}</p>
              </CardContent>
            </Card>
            <Card className="border border-slate-200/90 bg-white/90">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users2 className="h-4 w-4 text-teal-600" />
                  Team members
                </div>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.team}</p>
              </CardContent>
            </Card>
          </>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          {isIssuesLoading ? (
            <>
              <Skeleton className="h-[620px] w-full" />
              <Skeleton className="h-[620px] w-full xl:hidden" />
            </>
          ) : currentView === "backlog" ? (
            backlogIssues.length ? (
              <div className="space-y-4">
                {backlogIssues.map((issue) => (
                  <button
                    key={issue._id}
                    className={`w-full rounded-[28px] border p-5 text-left transition ${
                      selectedIssue?._id === issue._id
                        ? "border-slate-900 bg-slate-900 text-white shadow-[0_22px_44px_rgba(15,23,42,0.18)]"
                        : "border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50"
                    }`}
                    type="button"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">{issue.title}</h3>
                        <p
                          className={`mt-2 text-sm leading-6 ${
                            selectedIssue?._id === issue._id ? "text-slate-200" : "text-slate-500"
                          }`}
                        >
                          {issue.description || "No description provided yet."}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getIssuePriorityVariant(issue.priority)}>{issue.priority}</Badge>
                        <Badge variant="secondary">{issue.type}</Badge>
                      </div>
                    </div>
                    <div
                      className={`mt-4 flex flex-wrap items-center gap-3 text-xs ${
                        selectedIssue?._id === issue._id ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      <span>{issue.assignee?.name || "Unassigned"}</span>
                      <span>Created {formatDate(issue.createdAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Backlog is clear"
                description="Create a new issue or loosen the active filters to bring more work into the backlog queue."
                action={
                  <Button type="button" onClick={() => setIsCreateIssueOpen(true)}>
                    <PlusCircle className="h-4 w-4" />
                    Create Issue
                  </Button>
                }
                icon={<ListTodo className="h-5 w-5" />}
              />
            )
          ) : issues.length ? (
            <IssueBoard
              issues={issues}
              onSelectIssue={setSelectedIssue}
              onStatusChange={(id, status) => updateIssueMutation.mutateAsync({ id, payload: { status } })}
              selectedIssueId={selectedIssue?._id}
            />
          ) : (
            <EmptyState
              title="No issues match the current board filters"
              description="Try another project, reset the search, or create a fresh issue to begin the sprint."
              action={
                <Button type="button" onClick={() => setIsCreateIssueOpen(true)}>
                  <PlusCircle className="h-4 w-4" />
                  Create Issue
                </Button>
              }
              icon={<FolderKanban className="h-5 w-5" />}
            />
          )}
        </div>

        <IssueDetailsPanel
          deletingId={deleteIssueMutation.isPending ? selectedIssue?._id : ""}
          isProjectLoading={isProjectsLoading}
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onDeleteIssue={(id) => deleteIssueMutation.mutateAsync(id)}
          onUpdateIssue={(id, payload) => updateIssueMutation.mutateAsync({ id, payload })}
          projects={projects}
          updatingId={updateIssueMutation.isPending ? selectedIssue?._id : ""}
        />
      </section>

      <IssueCreateDialog
        defaultProjectId={selectedProject?._id}
        isPending={createIssueMutation.isPending}
        onOpenChange={setIsCreateIssueOpen}
        onSubmit={(payload) => createIssueMutation.mutateAsync(payload)}
        open={isCreateIssueOpen}
        projects={projects}
      />
    </div>
  );
};

export default DashboardPage;
