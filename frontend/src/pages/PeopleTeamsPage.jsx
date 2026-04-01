import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FolderKanban,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserPlus2,
  Users,
} from "lucide-react";
import {
  bulkImportUsers,
  createProject,
  createTeam,
  createUser,
  deleteProject,
  deleteUser,
  fetchProjects,
  fetchTeams,
  fetchUsers,
  importIssues,
  updateProject,
} from "@/lib/api";
import IssueImportDialog from "@/components/issues/IssueImportDialog";
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";
import ProjectSettingsDialog from "@/components/projects/ProjectSettingsDialog";
import EmptyState from "@/components/shared/EmptyState";
import CreateTeamDialog from "@/components/teams/CreateTeamDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import BulkUserImportDialog from "@/components/users/BulkUserImportDialog";
import CreateUserDialog from "@/components/users/CreateUserDialog";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, normalizeRole } from "@/lib/utils";
import { rolesMatrix } from "@/lib/workspace";

const PeopleTeamsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = normalizeRole(user?.role) === "Admin";
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isIssueImportOpen, setIsIssueImportOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState("");
  const [deletingProjectId, setDeletingProjectId] = useState("");

  const {
    data: users = [],
    isLoading: isUsersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["users", "people-page"],
    queryFn: fetchUsers,
    enabled: isAdmin,
  });

  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects", "people-page"],
    queryFn: fetchProjects,
    enabled: isAdmin,
  });

  const {
    data: teams = [],
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useQuery({
    queryKey: ["teams", "people-page"],
    queryFn: fetchTeams,
    enabled: isAdmin,
  });

  const assignableUsers = useMemo(
    () => users.filter((entry) => entry.role !== "Admin"),
    [users]
  );

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const bulkImportUsersMutation = useMutation({
    mutationFn: bulkImportUsers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: updateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditingProject(null);
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

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
    onSettled: () => {
      setDeletingUserId("");
    },
  });

  const importIssuesMutation = useMutation({
    mutationFn: importIssues,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const error = usersError || projectsError || teamsError;

  if (!isAdmin) {
    return (
      <EmptyState
        title="Admin settings"
        description="Only admins can manage users, roles, projects, and CSV imports from this control panel."
        icon={<ShieldCheck className="h-5 w-5" />}
      />
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-rose-600">
          {error.response?.data?.message || "Unable to load admin settings."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="app-panel-strong border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(254,249,195,0.3)_38%,rgba(236,253,245,0.86))] p-6 sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin settings
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                People, teams, permissions, and import controls
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Manage user access, shape project membership, define the delivery org chart, and
                bulk-import issues into a selected project with field mapping.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsCreateUserOpen(true)}>
              <UserPlus2 className="h-4 w-4" />
              Add User
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsBulkImportOpen(true)}>
              <UploadCloud className="h-4 w-4" />
              Import Users
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsIssueImportOpen(true)}>
              <UploadCloud className="h-4 w-4" />
              Import Issues
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsCreateTeamOpen(true)}>
              <Users className="h-4 w-4" />
              Create Team
            </Button>
            <Button type="button" onClick={() => setIsCreateProjectOpen(true)}>
              <FolderKanban className="h-4 w-4" />
              Create Project
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border border-slate-200/90 bg-white/92">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">User management</h2>
                <p className="text-sm text-slate-500">
                  Create users, bulk import them, and remove access cleanly.
                </p>
              </div>
              <Badge variant="secondary">{users.length} users</Badge>
            </div>

            {isUsersLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : users.length ? (
              <ScrollArea className="h-[420px]">
                <div className="space-y-3 pr-3">
                  {users.map((entry) => (
                    <div
                      key={entry._id}
                      className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{entry.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{entry.email}</p>
                        </div>
                        <Badge variant={entry.role === "Admin" ? "default" : "secondary"}>
                          {entry.role}
                        </Badge>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                          Joined {formatDate(entry.createdAt)}
                        </p>
                        {entry.role !== "Admin" ? (
                          <Button
                            disabled={deleteUserMutation.isPending && deletingUserId === entry._id}
                            size="sm"
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              const confirmed = window.confirm(
                                "Remove this user? Their project links, teams, and issue ownership will be cleaned up."
                              );

                              if (!confirmed) {
                                return;
                              }

                              setDeletingUserId(entry._id);
                              deleteUserMutation.mutate(entry._id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState
                title="No users yet"
                description="Add or import users to start building out project teams."
                icon={<Users className="h-5 w-5" />}
              />
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/90 bg-white/92">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Teams</h2>
                <p className="text-sm text-slate-500">
                  Group people by project so the board has clean ownership lanes.
                </p>
              </div>
              <Badge variant="secondary">{teams.length} teams</Badge>
            </div>

            {isTeamsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : teams.length ? (
              <ScrollArea className="h-[420px]">
                <div className="space-y-3 pr-3">
                  {teams.map((team) => (
                    <div
                      key={team._id}
                      className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{team.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {team.projectId?.name || "No project"} · {team.users?.length || 0} members
                          </p>
                        </div>
                        {team.projectId?.key ? (
                          <Badge variant="secondary">{team.projectId.key}</Badge>
                        ) : null}
                      </div>

                      {team.users?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {team.users.map((member) => (
                            <span
                              key={member._id}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                            >
                              {member.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState
                title="No teams yet"
                description="Create a team to attach people directly to a project workspace."
                icon={<Users className="h-5 w-5" />}
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="border border-slate-200/90 bg-white/92">
          <CardContent className="space-y-4 p-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Roles & permissions</h2>
              <p className="text-sm text-slate-500">
                The current permission model exposed in the workspace.
              </p>
            </div>

            {rolesMatrix.map((entry) => (
              <div
                key={entry.role}
                className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{entry.role}</p>
                  <Badge variant={entry.role === "Admin" ? "default" : "secondary"}>
                    {entry.capabilities.length} permissions
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              Developer and tester legacy roles are normalized into the standard user experience in
              the current app shell.
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/90 bg-white/92">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Project settings</h2>
                <p className="text-sm text-slate-500">
                  Edit project metadata, membership, and cleanup from one place.
                </p>
              </div>
              <Badge variant="secondary">{projects.length} projects</Badge>
            </div>

            {isProjectsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : projects.length ? (
              <ScrollArea className="h-[420px]">
                <div className="space-y-3 pr-3">
                  {projects.map((project) => (
                    <div
                      key={project._id}
                      className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{project.key}</Badge>
                            <Badge variant="outline">{project.issueCount || 0} issues</Badge>
                          </div>
                          <p className="mt-3 text-sm font-semibold text-slate-900">{project.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {project.description || "No description added yet."}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            size="sm"
                            type="button"
                            variant="secondary"
                            onClick={() => setEditingProject(project)}
                          >
                            Edit
                          </Button>
                          <Button
                            disabled={
                              deleteProjectMutation.isPending && deletingProjectId === project._id
                            }
                            size="sm"
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
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState
                title="No projects yet"
                description="Create a project before editing settings or importing issues."
                icon={<FolderKanban className="h-5 w-5" />}
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border border-slate-200/90 bg-white/92">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">CSV issue import</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Upload a CSV, map its headers to issue fields, and import the rows directly into a
                selected project backlog.
              </p>
            </div>
            <Button className="w-full sm:w-auto" type="button" onClick={() => setIsIssueImportOpen(true)}>
              <UploadCloud className="h-4 w-4" />
              Open Importer
            </Button>
          </CardContent>
        </Card>
      </section>

      <CreateUserDialog
        isPending={createUserMutation.isPending}
        onOpenChange={setIsCreateUserOpen}
        onSubmit={(payload) => createUserMutation.mutateAsync(payload)}
        open={isCreateUserOpen}
      />

      <BulkUserImportDialog
        isPending={bulkImportUsersMutation.isPending}
        onOpenChange={setIsBulkImportOpen}
        onSubmit={(rows) => bulkImportUsersMutation.mutateAsync(rows)}
        open={isBulkImportOpen}
      />

      <CreateTeamDialog
        isPending={createTeamMutation.isPending}
        onOpenChange={setIsCreateTeamOpen}
        onSubmit={(payload) => createTeamMutation.mutateAsync(payload)}
        open={isCreateTeamOpen}
        projects={projects}
        users={assignableUsers}
      />

      <CreateProjectDialog
        isPending={createProjectMutation.isPending}
        onOpenChange={setIsCreateProjectOpen}
        onSubmit={(payload) => createProjectMutation.mutateAsync(payload)}
        open={isCreateProjectOpen}
        users={assignableUsers}
      />

      <ProjectSettingsDialog
        isPending={updateProjectMutation.isPending}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingProject(null);
          }
        }}
        onSubmit={(payload) =>
          updateProjectMutation.mutateAsync({
            id: editingProject._id,
            payload,
          })
        }
        open={Boolean(editingProject)}
        project={editingProject}
        users={assignableUsers}
      />

      <IssueImportDialog
        isPending={importIssuesMutation.isPending}
        onOpenChange={setIsIssueImportOpen}
        onSubmit={(payload) => importIssuesMutation.mutateAsync(payload)}
        open={isIssueImportOpen}
        projects={projects}
      />
    </div>
  );
};

export default PeopleTeamsPage;
