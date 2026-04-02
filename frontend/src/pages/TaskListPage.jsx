import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListTodo } from "lucide-react";
import { deleteTask, fetchMyTasks, fetchTasks, fetchUsers, updateTask } from "@/lib/api";
import AdminTaskCard from "@/components/tasks/AdminTaskCard";
import TaskFiltersBar from "@/components/tasks/TaskFiltersBar";
import TaskCard from "@/components/dashboard/TaskCard";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { filterTasks, normalizeRole } from "@/lib/utils";

const TaskListPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = normalizeRole(user?.role) === "Admin";
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    type: "all",
    priority: "all",
    assignedTo: "all",
  });
  const deferredSearch = useDeferredValue(filters.search);

  const {
    data: tasks = [],
    isLoading,
    error: tasksError,
  } = useQuery({
    queryKey: ["tasks", isAdmin ? "all-list" : "my-list"],
    queryFn: isAdmin ? fetchTasks : fetchMyTasks,
  });

  const {
    data: users = [],
    error: usersError,
    isLoading: isUsersLoading,
  } = useQuery({
    queryKey: ["users", "task-list"],
    queryFn: fetchUsers,
    enabled: isAdmin,
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

  const assignableUsers = useMemo(
    () => users.filter((entry) => entry.role !== "Admin"),
    [users]
  );

  const filteredTasks = useMemo(
    () =>
      filterTasks(tasks, {
        ...filters,
        assignedTo: isAdmin ? filters.assignedTo : "all",
        search: deferredSearch,
      }).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    [deferredSearch, filters, isAdmin, tasks]
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

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      type: "all",
      priority: "all",
      assignedTo: "all",
    });
  };

  const error = tasksError || usersError;
  const shouldShowLoading = isLoading || (isAdmin && isUsersLoading);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-rose-600">
          {error.response?.data?.message || "Unable to load the task list."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          {isAdmin ? "All Tasks" : "My Tasks"}
        </h2>
        <p className="text-sm text-slate-500">
          {isAdmin
            ? "A full list of every task currently in the PIRNAV workspace."
            : "A focused list of only the tasks assigned to your account."}
        </p>
      </div>

      <TaskFiltersBar
        assignees={assignableUsers}
        filteredCount={filteredTasks.length}
        filters={filters}
        onChange={handleFilterChange}
        onReset={resetFilters}
        showAssignee={isAdmin}
        totalCount={tasks.length}
      />

      {shouldShowLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : filteredTasks.length ? (
        <div className="space-y-4">
          {filteredTasks.map((task) =>
            isAdmin ? (
              <AdminTaskCard
                key={task._id}
                task={task}
                isDeleting={deleteTaskMutation.isPending && deletingTaskId === task._id}
                isUpdating={updateTaskMutation.isPending && updatingTaskId === task._id}
                onDeleteTask={handleTaskDelete}
                onTaskUpdate={handleTaskUpdate}
                tasks={tasks}
                users={assignableUsers}
              />
            ) : (
              <TaskCard
                key={task._id}
                task={task}
                isUpdating={updateTaskMutation.isPending && updatingTaskId === task._id}
                onStatusChange={(taskId, status) => handleTaskUpdate(taskId, { status })}
              />
            )
          )}
        </div>
      ) : tasks.length ? (
        <EmptyState
          title="No tasks match these filters"
          description="Reset the current filters to bring more tasks back into view."
          action={
            <Button type="button" variant="secondary" onClick={resetFilters}>
              Reset Filters
            </Button>
          }
          icon={<ListTodo className="h-5 w-5" />}
        />
      ) : (
        <EmptyState
          title={isAdmin ? "No tasks available" : "No assigned tasks"}
          description={
            isAdmin
              ? "Tasks created by admins will appear here for review and updates."
              : "Tasks assigned to you will appear here once work has been created."
          }
          icon={<ListTodo className="h-5 w-5" />}
        />
      )}
    </div>
  );
};

export default TaskListPage;
