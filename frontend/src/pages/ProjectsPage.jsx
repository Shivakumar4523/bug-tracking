import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, FolderKanban, PlusCircle, Trash2, Users2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createProject, deleteProject, fetchProjects, fetchUsers } from "@/lib/api";
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";
import EmptyState from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, normalizeRole } from "@/lib/utils";

const ProjectsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState("");
  const isAdmin = normalizeRole(user?.role) === "Admin";

  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects", "page"],
    queryFn: fetchProjects,
  });

  const {
    data: users = [],
    isLoading: isUsersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["users", "project-page"],
    queryFn: fetchUsers,
    enabled: isAdmin,
  });

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onSettled: () => {
      setDeletingProjectId("");
    },
  });

  const error = projectsError || usersError;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-rose-600">
          {error.response?.data?.message || "Unable to load projects."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="app-panel-strong border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92)_48%,rgba(236,253,245,0.86))] p-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-blue-700">
              <FolderKanban className="h-3.5 w-3.5" />
              Project catalog
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Projects</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Review all available project workspaces, check member coverage, and jump straight
                into the sprint board for any delivery stream.
              </p>
            </div>
          </div>

          {isAdmin ? (
            <Button className="w-full sm:w-auto" type="button" onClick={() => setIsCreateProjectOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              Create Project
            </Button>
          ) : null}
        </div>
      </section>

      {isProjectsLoading || (isAdmin && isUsersLoading) ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : projects.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {projects.map((project) => (
            <Card
              key={project._id}
              className="border border-slate-200/90 bg-white/92 transition duration-200 hover:-translate-y-1 hover:border-blue-200"
            >
              <CardContent className="space-y-5 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{project.key}</Badge>
                      <Badge variant="outline">{project.issueCount || 0} issues</Badge>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900">{project.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {project.description || "No project description has been added yet."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Created</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatDate(project.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm text-slate-500">Members</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {project.members?.length || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm text-slate-500">Owner</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {project.owner?.name || "Unknown"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Users2 className="h-4 w-4 text-blue-600" />
                      Team coverage
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {project.members?.length ? "Ready" : "Add teammates"}
                    </p>
                  </div>
                </div>

                {project.members?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {project.members.slice(0, 6).map((member) => (
                      <span
                        key={member._id}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                      >
                        {member.name}
                      </span>
                    ))}
                    {project.members.length > 6 ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                        +{project.members.length - 6} more
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="sm:flex-1" type="button">
                    <Link to={`/dashboard?project=${project._id}&view=sprint`}>Open Board</Link>
                  </Button>
                  <Button asChild className="sm:flex-1" type="button" variant="secondary">
                    <Link to={`/filters?project=${project._id}`}>
                      Search Issues
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  {isAdmin ? (
                    <Button
                      className="sm:flex-1"
                      disabled={
                        deleteProjectMutation.isPending && deletingProjectId === project._id
                      }
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        const confirmed = window.confirm(
                          "Delete this project? Linked issues and teams will also be removed."
                        );

                        if (!confirmed) {
                          return;
                        }

                        setDeletingProjectId(project._id);
                        deleteProjectMutation.mutate(project._id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleteProjectMutation.isPending && deletingProjectId === project._id
                        ? "Deleting..."
                        : "Delete Project"}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects yet"
          description="Create the first project to start grouping issues, teams, and sprint work into a dedicated delivery workspace."
          action={
            isAdmin ? (
              <Button type="button" onClick={() => setIsCreateProjectOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                Create Project
              </Button>
            ) : null
          }
          icon={<FolderKanban className="h-5 w-5" />}
        />
      )}

      <CreateProjectDialog
        isPending={createProjectMutation.isPending}
        onOpenChange={setIsCreateProjectOpen}
        onSubmit={(payload) => createProjectMutation.mutateAsync(payload)}
        open={isCreateProjectOpen}
        users={users.filter((entry) => entry.role !== "Admin")}
      />
    </div>
  );
};

export default ProjectsPage;
