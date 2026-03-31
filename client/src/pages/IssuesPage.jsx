import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KanbanSquare } from "lucide-react";
import {
  createIssue,
  deleteIssue,
  fetchIssues,
  fetchProjects,
  updateIssue,
} from "@/lib/api";
import IssueBoard from "@/components/issues/IssueBoard";
import IssueComposer from "@/components/issues/IssueComposer";
import IssueDetailsDialog from "@/components/issues/IssueDetailsDialog";
import IssueFilters from "@/components/issues/IssueFilters";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const defaultFilters = {
  projectId: "all",
  status: "all",
  priority: "all",
  assignee: "all",
};

const IssuesPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const {
    data: issues = [],
    isLoading: isIssuesLoading,
    error: issuesError,
  } = useQuery({
    queryKey: ["issues", filters],
    queryFn: () => fetchIssues(filters),
  });

  useEffect(() => {
    if (!selectedIssue) {
      return;
    }

    const nextIssue = issues.find((issue) => issue._id === selectedIssue._id);

    if (nextIssue) {
      setSelectedIssue(nextIssue);
    }
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

  const assigneeOptions = useMemo(() => {
    const relevantProjects =
      filters.projectId !== "all"
        ? projects.filter((project) => project._id === filters.projectId)
        : projects;

    const uniqueMembers = new Map();

    relevantProjects.forEach((project) => {
      project.members?.forEach((member) => {
        uniqueMembers.set(member._id, member);
      });
    });

    return Array.from(uniqueMembers.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }, [projects, filters.projectId]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const error = projectsError || issuesError;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-rose-600">
          {error.response?.data?.message || "Unable to load issue data."}
        </CardContent>
      </Card>
    );
  }

  if (!isProjectsLoading && !projects.length) {
    return (
      <EmptyState
        title="Create a project before managing issues"
        description="Projects define the assignees and scope for the Kanban board. Add one from the Projects tab first."
        icon={<KanbanSquare className="h-5 w-5" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <IssueFilters
        assignees={assigneeOptions}
        filters={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters(defaultFilters)}
        projects={projects}
        total={issues.length}
      />

      <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        {isProjectsLoading ? (
          <Skeleton className="h-[720px] w-full" />
        ) : (
          <IssueComposer
            defaultProjectId={filters.projectId}
            isPending={createIssueMutation.isPending}
            onSubmit={(payload) => createIssueMutation.mutateAsync(payload)}
            projects={projects}
          />
        )}

        {isIssuesLoading ? (
          <div className="grid gap-4 xl:grid-cols-3">
            <Skeleton className="h-[680px] w-full" />
            <Skeleton className="h-[680px] w-full" />
            <Skeleton className="h-[680px] w-full" />
          </div>
        ) : (
          <IssueBoard
            issues={issues}
            onSelectIssue={setSelectedIssue}
            onStatusChange={(id, status) =>
              updateIssueMutation.mutateAsync({
                id,
                payload: { status },
              })
            }
          />
        )}
      </div>

      <IssueDetailsDialog
        deletingId={deleteIssueMutation.isPending ? selectedIssue?._id : ""}
        issue={selectedIssue}
        onDeleteIssue={(id) => deleteIssueMutation.mutateAsync(id)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedIssue(null);
          }
        }}
        onUpdateIssue={(id, payload) =>
          updateIssueMutation.mutateAsync({ id, payload })
        }
        open={Boolean(selectedIssue)}
        projects={projects}
        updatingId={updateIssueMutation.isPending ? selectedIssue?._id : ""}
      />
    </div>
  );
};

export default IssuesPage;
