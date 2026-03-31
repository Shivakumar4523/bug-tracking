import { useEffect, useMemo, useState } from "react";
import { AlertCircle, FolderKanban, PlusCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const initialForm = {
  name: "",
  projectId: "",
  userIds: [],
};

const multiSelectClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25";

const CreateTeamDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  users = [],
  projects = [],
}) => {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");

  const sortedUsers = useMemo(
    () => [...users].sort((left, right) => left.name.localeCompare(right.name)),
    [users]
  );

  const sortedProjects = useMemo(
    () => [...projects].sort((left, right) => left.name.localeCompare(right.name)),
    [projects]
  );

  useEffect(() => {
    if (!open) {
      setFormData(initialForm);
      setError("");
    }
  }, [open]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleUsersChange = (event) => {
    const selectedUserIds = Array.from(event.target.selectedOptions, (option) => option.value);

    setFormData((current) => ({
      ...current,
      userIds: selectedUserIds,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.projectId || !formData.userIds.length) {
      setError("Team name, project, and at least one user are required.");
      return;
    }

    try {
      setError("");
      await onSubmit({
        name: formData.name.trim(),
        projectId: formData.projectId,
        userIds: formData.userIds,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Unable to create the team.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-blue-600">
            <PlusCircle className="h-3.5 w-3.5" />
            Create Team
          </div>
          <DialogTitle>Create a team workspace</DialogTitle>
          <DialogDescription>
            Group users under a named team and attach them to a specific project.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="team-name">
              Team Name
            </label>
            <div className="relative">
              <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
              <Input
                id="team-name"
                name="name"
                className="pl-11"
                placeholder="QA Task Force"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="team-project">
              Assign Project
            </label>
            <div className="relative">
              <FolderKanban className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
              <select
                id="team-project"
                name="projectId"
                className="field-select pl-11"
                value={formData.projectId}
                onChange={handleChange}
              >
                <option value="">Select a project</option>
                {sortedProjects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name} ({project.key})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="team-users">
              Select Users
            </label>
            <div className="relative">
              <Users className="pointer-events-none absolute left-4 top-5 h-4 w-4 text-blue-500" />
              <select
                id="team-users"
                multiple
                className={`${multiSelectClassName} min-h-[180px] pl-11`}
                value={formData.userIds}
                onChange={handleUsersChange}
              >
                {sortedUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500">
              Selected users will also be linked to the assigned project automatically.
            </p>
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating team..." : "Create Team"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTeamDialog;
