import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban } from "lucide-react";
import { fetchProjects, fetchUsers, createProject } from "@/lib/api";
import ProjectComposer from "@/components/projects/ProjectComposer";
import ProjectCard from "@/components/projects/ProjectCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/use-auth";

const ProjectsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });
  const {
    data: users = [],
    isLoading: isUsersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
    <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
      <ProjectComposer
        users={users}
        currentUser={user}
        onSubmit={(payload) => createProjectMutation.mutateAsync(payload)}
        isPending={createProjectMutation.isPending}
      />

      <section className="space-y-4">
        {isProjectsLoading || isUsersLoading ? (
          <>
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-60 w-full" />
          </>
        ) : projects.length ? (
          projects.map((project) => (
            <ProjectCard
              key={project._id}
              currentUserId={user?._id}
              project={project}
            />
          ))
        ) : (
          <EmptyState
            title="No projects yet"
            description="Create a project from the panel on the left to start organizing work into boards and backlogs."
            icon={<FolderKanban className="h-5 w-5" />}
          />
        )}
      </section>
    </div>
  );
};

export default ProjectsPage;
