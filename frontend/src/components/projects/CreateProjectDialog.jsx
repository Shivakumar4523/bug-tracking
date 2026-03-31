import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, FolderKanban, Hash, PlusCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialForm = {
  name: "",
  key: "",
  description: "",
  startDate: "",
  endDate: "",
  memberIds: [],
};

const multiSelectClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25";

const CreateProjectDialog = ({ open, onOpenChange, onSubmit, isPending, users = [] }) => {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");

  const sortedUsers = useMemo(
    () => [...users].sort((left, right) => left.name.localeCompare(right.name)),
    [users]
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

  const handleMemberChange = (event) => {
    const selectedMemberIds = Array.from(event.target.selectedOptions, (option) => option.value);

    setFormData((current) => ({
      ...current,
      memberIds: selectedMemberIds,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.key.trim()) {
      setError("Project name and key are required.");
      return;
    }

    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      setError("End date cannot be earlier than the start date.");
      return;
    }

    try {
      setError("");
      await onSubmit({
        name: formData.name.trim(),
        key: formData.key.trim().toUpperCase(),
        description: formData.description.trim(),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        memberIds: formData.memberIds,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Unable to create the project.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-blue-600">
            <FolderKanban className="h-3.5 w-3.5" />
            Add Project
          </div>
          <DialogTitle>Create a new project</DialogTitle>
          <DialogDescription>
            Define the project scope, timeline, and members before assigning delivery work.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="project-name">
                Project Name
              </label>
              <div className="relative">
                <FolderKanban className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                <Input
                  id="project-name"
                  name="name"
                  className="pl-11"
                  placeholder="PIRNAV Delivery Portal"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="project-key">
                Project Key
              </label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                <Input
                  id="project-key"
                  name="key"
                  className="pl-11 uppercase"
                  placeholder="PIRNAV"
                  value={formData.key}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="project-description">
              Description
            </label>
            <Textarea
              id="project-description"
              name="description"
              placeholder="Describe the project objective, product scope, and delivery goals."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="project-start-date">
                Start Date
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                <Input
                  id="project-start-date"
                  name="startDate"
                  type="date"
                  className="pl-11"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="project-end-date">
                End Date
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                <Input
                  id="project-end-date"
                  name="endDate"
                  type="date"
                  className="pl-11"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="project-members">
              Assign Users To Project
            </label>
            <div className="relative">
              <Users className="pointer-events-none absolute left-4 top-5 h-4 w-4 text-blue-500" />
              <select
                id="project-members"
                multiple
                className={`${multiSelectClassName} min-h-[180px] pl-11`}
                value={formData.memberIds}
                onChange={handleMemberChange}
              >
                {sortedUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500">
              Hold Ctrl or Cmd to select multiple users.
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
              {isPending ? "Creating project..." : "Add Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
