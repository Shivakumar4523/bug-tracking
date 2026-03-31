import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FolderKanban,
  ListChecks,
  PlusCircle,
  RefreshCw,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import {
  bulkImportUsers,
  createProject,
  createTask,
  createTeam,
  createUser,
  deleteProject,
  deleteUser,
  deleteTask,
  fetchProjects,
  fetchTasks,
  fetchTeams,
  fetchUsers,
  updateTask,
} from "@/lib/api";
import OverviewStatCard from "@/components/dashboard/OverviewStatCard";
import EmptyState from "@/components/shared/EmptyState";
import AdminTaskCard from "@/components/tasks/AdminTaskCard";
import CreateTaskDialog from "@/components/tasks/CreateTaskDialog";
import BulkUserImportDialog from "@/components/users/BulkUserImportDialog";
import CreateUserDialog from "@/components/users/CreateUserDialog";
import CreateProjectDialog from "@/components/projects/CreateProjectDialog";
import CreateTeamDialog from "@/components/teams/CreateTeamDialog";
import TaskFiltersBar from "@/components/tasks/TaskFiltersBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { filterTasks, formatDate } from "@/lib/utils";

const AdminDashboardPage = () => {
  const queryClient = useQueryClient();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState("");
  const [deletingUserId, setDeletingUserId] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState("");
  const [defaultAssignedTo, setDefaultAssignedTo] = useState("");
  const [taskFilters, setTaskFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
    assignedTo: "all",
  });
  const deferredSearch = useDeferredValue(taskFilters.search);

  const {
    data: users = [],
    isLoading: isUsersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    error: tasksError,
  } = useQuery({
    queryKey: ["tasks", "admin-dashboard"],
    queryFn: fetchTasks,
  });

  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const {
    data: teams = [],
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
    onSettled: () => {
      setDeletingUserId("");
    },
  });

  const bulkImportUsersMutation = useMutation({
    mutationFn: bulkImportUsers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
    onSettled: () => {
      setDeletingProjectId("");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onSettled: () => {
      setUpdatingTaskId("");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onSettled: () => {
      setDeletingTaskId("");
    },
  });

  const stats = useMemo(() => {
    const activeTasks = tasks.filter((task) => task.status !== "closed").length;
    const closedTasks = tasks.filter((task) => task.status === "closed").length;
    const unassignedTasks = tasks.filter((task) => !task.assignedTo?._id).length;

    return {
      totalUsers: users.length,
      totalProjects: projects.length,
      totalTeams: teams.length,
      activeTasks,
      closedTasks,
      unassignedTasks,
    };
  }, [projects, tasks, teams, users]);

  const assignableUsers = useMemo(
    () => users.filter((user) => user.role !== "Admin"),
    [users]
  );

  const tasksByUser = useMemo(() => {
    const counts = new Map();

    tasks.forEach((task) => {
      const userId = task.assignedTo?._id;

      if (!userId) {
        return;
      }

      counts.set(userId, (counts.get(userId) || 0) + 1);
    });

    return counts;
  }, [tasks]);

  const filteredTasks = useMemo(
    () =>
      filterTasks(tasks, {
        ...taskFilters,
        search: deferredSearch,
      }),
    [deferredSearch, taskFilters, tasks]
  );

  const handleTaskUpdate = async (taskId, payload) => {
    setUpdatingTaskId(taskId);

    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        payload,
      });
    } catch (submitError) {
      return submitError;
    }
  };

  const handleTaskDelete = async (taskId) => {
    setDeletingTaskId(taskId);

    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch (submitError) {
      return submitError;
    }
  };

  const handleUserDelete = async (userId) => {
    setDeletingUserId(userId);

    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch (submitError) {
      return submitError;
    }
  };

  const handleProjectDelete = async (projectId) => {
    setDeletingProjectId(projectId);

    try {
      await deleteProjectMutation.mutateAsync(projectId);
    } catch (submitError) {
      return submitError;
    }
  };

  const handleFilterChange = (field, value) => {
    setTaskFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetTaskFilters = () => {
    setTaskFilters({
      search: "",
      status: "all",
      priority: "all",
      assignedTo: "all",
    });
  };

  const shouldShowStatsLoading =
    isUsersLoading || isTasksLoading || isProjectsLoading || isTeamsLoading;
  const error = usersError || tasksError || projectsError || teamsError;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-rose-600">
          {error.response?.data?.message || "Unable to load the admin dashboard."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <section className="app-panel-strong overflow-hidden p-6 sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-blue-600">
              <Users className="h-3.5 w-3.5" />
              Admin Workspace
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Task operations overview
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Manage users, import them in bulk, organize projects and teams, and keep delivery
                moving across the PIRNAV workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{stats.activeTasks}</span> active
                tasks
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{stats.totalProjects}</span>{" "}
                projects
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{stats.totalTeams}</span> teams
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 xl:items-end">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 shadow-sm">
              Delivery snapshot updates automatically as workspaces, teams, and tasks evolve.
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                className="w-full sm:w-auto"
                type="button"
                variant="secondary"
                onClick={() => setIsCreateUserOpen(true)}
              >
                <Users className="h-4 w-4" />
                Add User
              </Button>
              <Button
                className="w-full sm:w-auto"
                type="button"
                variant="outline"
                onClick={() => setIsBulkImportOpen(true)}
              >
                <UploadCloud className="h-4 w-4" />
                Import CSV
              </Button>
              <Button
                className="w-full sm:w-auto"
                type="button"
                variant="outline"
                onClick={() => setIsCreateProjectOpen(true)}
              >
                <FolderKanban className="h-4 w-4" />
                Add Project
              </Button>
              <Button
                className="w-full sm:w-auto"
                type="button"
                variant="outline"
                onClick={() => setIsCreateTeamOpen(true)}
              >
                <Users className="h-4 w-4" />
                Create Team
              </Button>
              <Button
                className="w-full sm:w-auto"
                type="button"
                onClick={() => {
                  setDefaultAssignedTo("");
                  setIsCreateTaskOpen(true);
                }}
              >
                <PlusCircle className="h-4 w-4" />
                Create Task
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {shouldShowStatsLoading ? (
          <>
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </>
        ) : (
          <>
            <OverviewStatCard
              icon={<Users className="h-5 w-5" />}
              iconClassName="text-blue-600"
              label="Total Users"
              value={stats.totalUsers}
            />
            <OverviewStatCard
              icon={<FolderKanban className="h-5 w-5" />}
              iconClassName="text-blue-600"
              label="Total Projects"
              value={stats.totalProjects}
            />
            <OverviewStatCard
              icon={<Users className="h-5 w-5" />}
              iconClassName="text-emerald-500"
              label="Total Teams"
              value={stats.totalTeams}
            />
            <OverviewStatCard
              icon={<RefreshCw className="h-5 w-5" />}
              iconClassName="text-amber-500"
              label="Active Tasks"
              value={stats.activeTasks}
            />
          </>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Add users individually or in bulk, then assign work from the same workspace.
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsCreateUserOpen(true)}
                >
                  <Users className="h-4 w-4" />
                  Add User
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBulkImportOpen(true)}
                >
                  <UploadCloud className="h-4 w-4" />
                  Import CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isUsersLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : users.length ? (
              <ScrollArea className="h-[760px]" type="always">
                <div className="space-y-3 pr-2">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="mx-auto w-full max-w-[720px] rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div>
                        <p className="text-base font-semibold text-slate-900">{user.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                      </div>
                      <div className="mt-4 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
                        {user.role !== "Admin" ? (
                          <>
                            <Button
                              className="shrink-0 whitespace-nowrap"
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setDefaultAssignedTo(user._id);
                                setIsCreateTaskOpen(true);
                              }}
                            >
                              <PlusCircle className="h-4 w-4" />
                              Assign Task
                            </Button>
                            <Button
                              className="shrink-0 whitespace-nowrap"
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={deleteUserMutation.isPending && deletingUserId === user._id}
                              onClick={() => {
                                const confirmed = window.confirm(
                                  "Remove this user? Their assigned tasks will be unassigned, and they will be removed from teams and projects."
                                );

                                if (!confirmed) {
                                  return;
                                }

                                handleUserDelete(user._id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              {deleteUserMutation.isPending && deletingUserId === user._id
                                ? "Removing..."
                                : "Remove User"}
                            </Button>
                          </>
                        ) : null}
                        <Badge
                          className="shrink-0 whitespace-nowrap"
                          variant={user.role === "Admin" ? "default" : "secondary"}
                        >
                          {user.role}
                        </Badge>
                        <span className="shrink-0 whitespace-nowrap text-xs text-slate-500">
                          {tasksByUser.get(user._id) || 0} assigned tasks
                        </span>
                      </div>
                      {user.role !== "Admin" ? (
                        <p className="mt-3 text-xs text-slate-500">
                          Removing this user also clears their task assignments and membership links.
                        </p>
                      ) : null}
                      <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-500">
                        Joined {formatDate(user.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState
                title="No users found"
                description="Create or import users to begin assigning work."
                action={
                  <Button type="button" onClick={() => setIsCreateUserOpen(true)}>
                    <Users className="h-4 w-4" />
                    Add User
                  </Button>
                }
                icon={<Users className="h-5 w-5" />}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Visibility</CardTitle>
            <CardDescription>
              A Jira-style snapshot of current ownership, completions, and remaining backlog.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Open workload</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {stats.activeTasks} active tasks are still in motion across projects and teams.
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Closed delivery</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {stats.closedTasks} tasks have already been completed and closed.
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Assignment coverage</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {assignableUsers.length} users are currently available for project and task
                assignment.
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Unassigned backlog</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {stats.unassignedTasks} tasks are waiting for an assignee.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Projects</CardTitle>
                <CardDescription>
                  Define project workspaces, timelines, and user membership from the dashboard.
                </CardDescription>
              </div>

              <Button type="button" variant="secondary" onClick={() => setIsCreateProjectOpen(true)}>
                <FolderKanban className="h-4 w-4" />
                Add Project
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isProjectsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : projects.length ? (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-900">{project.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {project.description || "No project description provided yet."}
                        </p>
                      </div>
                      <Badge variant="secondary">{project.key}</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                        {project.members?.length || 0} members
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                        Start {project.startDate ? formatDate(project.startDate) : "Not set"}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                        End {project.endDate ? formatDate(project.endDate) : "Not set"}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        Deleting a project also removes linked teams and issues.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={
                          deleteProjectMutation.isPending && deletingProjectId === project._id
                        }
                        onClick={() => {
                          const confirmed = window.confirm(
                            "Delete this project? Linked teams and issues for this project will also be removed."
                          );

                          if (!confirmed) {
                            return;
                          }

                          handleProjectDelete(project._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleteProjectMutation.isPending && deletingProjectId === project._id
                          ? "Deleting..."
                          : "Delete Project"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No projects yet"
                description="Create the first project to start grouping users, teams, and delivery work."
                action={
                  <Button type="button" onClick={() => setIsCreateProjectOpen(true)}>
                    <FolderKanban className="h-4 w-4" />
                    Add Project
                  </Button>
                }
                icon={<FolderKanban className="h-5 w-5" />}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Teams</CardTitle>
                <CardDescription>
                  Group users into project-based teams for cleaner delivery ownership.
                </CardDescription>
              </div>

              <Button type="button" variant="secondary" onClick={() => setIsCreateTeamOpen(true)}>
                <Users className="h-4 w-4" />
                Create Team
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isTeamsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : teams.length ? (
              <div className="space-y-3">
                {teams.map((team) => (
                  <div
                    key={team._id}
                    className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-900">{team.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Project: {team.projectId?.name || "No project linked"}
                        </p>
                      </div>
                      {team.projectId?.key ? (
                        <Badge variant="secondary">{team.projectId.key}</Badge>
                      ) : null}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                        {team.users?.length || 0} members
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                        Created {formatDate(team.createdAt)}
                      </span>
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
            ) : (
              <EmptyState
                title="No teams yet"
                description="Create a team and attach it to a project to organize ownership."
                action={
                  <Button type="button" onClick={() => setIsCreateTeamOpen(true)}>
                    <Users className="h-4 w-4" />
                    Create Team
                  </Button>
                }
                icon={<Users className="h-5 w-5" />}
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">All Tasks</h3>
          <p className="text-sm text-slate-500">
            Review every task, reassign ownership, and manage status like a focused delivery queue.
          </p>
        </div>

        <TaskFiltersBar
          assignees={assignableUsers}
          filteredCount={filteredTasks.length}
          filters={taskFilters}
          onChange={handleFilterChange}
          onReset={resetTaskFilters}
          showAssignee
          totalCount={tasks.length}
        />

        {isTasksLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : filteredTasks.length ? (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <AdminTaskCard
                key={task._id}
                task={task}
                isDeleting={deleteTaskMutation.isPending && deletingTaskId === task._id}
                isUpdating={updateTaskMutation.isPending && updatingTaskId === task._id}
                onDeleteTask={handleTaskDelete}
                onTaskUpdate={handleTaskUpdate}
                users={assignableUsers}
              />
            ))}
          </div>
        ) : tasks.length ? (
          <EmptyState
            title="No tasks match these filters"
            description="Try resetting the search or filters to reveal more items in the assignment queue."
            action={
              <Button type="button" variant="secondary" onClick={resetTaskFilters}>
                Reset Filters
              </Button>
            }
            icon={<ListChecks className="h-5 w-5" />}
          />
        ) : (
          <EmptyState
            title="No tasks created yet"
            description="Create the first task to start assigning work to your team."
            action={
              <Button type="button" onClick={() => setIsCreateTaskOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                Create Task
              </Button>
            }
            icon={<ListChecks className="h-5 w-5" />}
          />
        )}
      </section>

      <CreateTaskDialog
        isPending={createTaskMutation.isPending}
        defaultAssignedTo={defaultAssignedTo}
        onOpenChange={(nextOpen) => {
          setIsCreateTaskOpen(nextOpen);

          if (!nextOpen) {
            setDefaultAssignedTo("");
          }
        }}
        onSubmit={(payload) => createTaskMutation.mutateAsync(payload)}
        open={isCreateTaskOpen}
        users={assignableUsers}
      />

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

      <CreateProjectDialog
        isPending={createProjectMutation.isPending}
        onOpenChange={setIsCreateProjectOpen}
        onSubmit={(payload) => createProjectMutation.mutateAsync(payload)}
        open={isCreateProjectOpen}
        users={assignableUsers}
      />

      <CreateTeamDialog
        isPending={createTeamMutation.isPending}
        onOpenChange={setIsCreateTeamOpen}
        onSubmit={(payload) => createTeamMutation.mutateAsync(payload)}
        open={isCreateTeamOpen}
        projects={projects}
        users={assignableUsers}
      />
    </div>
  );
};

export default AdminDashboardPage;
