import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, PlusCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { createIssue, deleteIssue, fetchIssues, fetchProjects, updateIssue } from "@/lib/api";
import IssueCreateDialog from "@/components/issues/IssueCreateDialog";
import IssueDetailsPanel from "@/components/issues/IssueDetailsPanel";
import IssueFilters from "@/components/issues/IssueFilters";
import EmptyState from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { getIssuePriorityVariant, getIssueStatusLabel } from "@/lib/workspace";

const defaultFilters = {
  search: "",
  projectId: "all",
  status: "all",
  priority: "all",
  assignee: "all",
};

const getAssigneeOptions = (projects, activeProjectId) => {
  const relevantProjects =
    activeProjectId !== "all"
      ? projects.filter((project) => project._id === activeProjectId)
      : projects;

  const assignees = new Map();
  relevantProjects.forEach((project) => {
    project.members?.forEach((member) => assignees.set(member._id, member));

    if (project.owner?._id) {
      assignees.set(project.owner._id, project.owner);
    }
  });

  return Array.from(assignees.values()).sort((left, right) => left.name.localeCompare(right.name));
};

const FiltersPage = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    ...defaultFilters,
    projectId: searchParams.get("project") || "all",
  }));
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);

  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects", "filters"],
    queryFn: fetchProjects,
  });

  const {
    data: issues = [],
    isLoading: isIssuesLoading,
    error: issuesError,
  } = useQuery({
    queryKey: ["issues", "filters", filters],
    queryFn: () => fetchIssues(filters),
  });

  useEffect(() => {
    const projectId = searchParams.get("project") || "all";

    setFilters((current) =>
      current.projectId === projectId
        ? current
        : {
            ...current,
            projectId,
          }
    );
  }, [searchParams]);

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

  const assigneeOptions = useMemo(
    () => getAssigneeOptions(projects, filters.projectId),
    [filters.projectId, projects]
  );

  const error = projectsError || issuesError;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-rose-600">
          {error.response?.data?.message || "Unable to load issue search data."}
        </CardContent>
      </Card>
    );
  }

  if (!isProjectsLoading && !projects.length) {
    return (
      <EmptyState
        title="No projects available yet"
        description="Projects define the issue scope. Once a project exists, this page becomes your issue search and audit surface."
        icon={<Filter className="h-5 w-5" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="app-panel-strong border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92)_50%,rgba(236,254,255,0.88))] p-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-sky-700">
              <Filter className="h-3.5 w-3.5" />
              Search issues
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Filters workspace
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Search across all accessible issues, narrow by status and ownership, then edit the
                selected item from the detail panel on the right.
              </p>
            </div>
          </div>

          <Button className="w-full sm:w-auto" type="button" onClick={() => setIsCreateIssueOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Create Issue
          </Button>
        </div>
      </section>

      <IssueFilters
        assignees={assigneeOptions}
        filters={filters}
        onChange={(field, value) =>
          setFilters((current) => ({
            ...current,
            [field]: value,
          }))
        }
        onReset={() => setFilters(defaultFilters)}
        projects={projects}
        total={issues.length}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          {isProjectsLoading || isIssuesLoading ? (
            <>
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-44 w-full" />
            </>
          ) : issues.length ? (
            issues.map((issue) => (
              <button
                key={issue._id}
                className={`w-full rounded-[28px] border p-5 text-left transition ${
                  selectedIssue?._id === issue._id
                    ? "border-slate-900 bg-slate-900 text-white shadow-[0_22px_44px_rgba(15,23,42,0.18)]"
                    : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"
                }`}
                type="button"
                onClick={() => setSelectedIssue(issue)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getIssuePriorityVariant(issue.priority)}>{issue.priority}</Badge>
                      <Badge variant="secondary">{issue.type}</Badge>
                      <Badge variant="outline">{getIssueStatusLabel(issue.status)}</Badge>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold">{issue.title}</h3>
                    <p
                      className={`mt-2 text-sm leading-6 ${
                        selectedIssue?._id === issue._id ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {issue.description || "No description provided yet."}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className={selectedIssue?._id === issue._id ? "text-slate-200" : ""}>
                      {issue.projectId?.name}
                    </p>
                    <p className={`mt-1 ${selectedIssue?._id === issue._id ? "text-slate-300" : ""}`}>
                      {formatDate(issue.createdAt)}
                    </p>
                  </div>
                </div>

                <div
                  className={`mt-4 flex flex-wrap items-center gap-3 text-xs ${
                    selectedIssue?._id === issue._id ? "text-slate-200" : "text-slate-500"
                  }`}
                >
                  <span>{issue.assignee?.name || "Unassigned"}</span>
                  <span>{issue.reporter?.name || "Unknown reporter"}</span>
                </div>
              </button>
            ))
          ) : (
            <EmptyState
              title="No issues matched these filters"
              description="Try resetting the filters, or create a fresh issue to seed the board."
              action={
                <Button type="button" onClick={() => setIsCreateIssueOpen(true)}>
                  <PlusCircle className="h-4 w-4" />
                  Create Issue
                </Button>
              }
              icon={<Filter className="h-5 w-5" />}
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
        defaultProjectId={filters.projectId !== "all" ? filters.projectId : projects[0]?._id}
        isPending={createIssueMutation.isPending}
        onOpenChange={setIsCreateIssueOpen}
        onSubmit={(payload) => createIssueMutation.mutateAsync(payload)}
        open={isCreateIssueOpen}
        projects={projects}
      />
    </div>
  );
};

export default FiltersPage;
