import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, FolderKanban, Hash, Save, Users } from "lucide-react";
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

const multiSelectClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25";

const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const ProjectSettingsDialog = ({
  isPending,
  onOpenChange,
  onSubmit,
  open,
  project,
  users = [],
}) => {
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    description: "",
    startDate: "",
    endDate: "",
    memberIds: [],
  });
  const [error, setError] = useState("");

  const sortedUsers = useMemo(
    () => [...users].sort((left, right) => left.name.localeCompare(right.name)),
    [users]
  );

  useEffect(() => {
    if (!open || !project) {
      setError("");
      return;
    }

    setFormData({
      name: project.name || "",
      key: project.key || "",
      description: project.description || "",
      startDate: toInputDate(project.startDate),
      endDate: toInputDate(project.endDate),
      memberIds: project.members?.map((member) => member._id) || [],
    });
    setError("");
  }, [open, project]);

  if (!project) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleMembersChange = (event) => {
    const memberIds = Array.from(event.target.selectedOptions, (option) => option.value);
    setFormData((current) => ({
      ...current,
      memberIds,
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
      setError(submitError.response?.data?.message || "Unable to update the project.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-teal-700">
            <Save className="h-3.5 w-3.5" />
            Project Settings
          </div>
          <DialogTitle>Update project details</DialogTitle>
          <DialogDescription>
            Adjust the project key, membership, and delivery timeline from one admin panel.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="project-settings-name">
                Project name
              </label>
              <div className="relative">
                <FolderKanban className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600" />
                <Input
                  id="project-settings-name"
                  name="name"
                  className="pl-11"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="project-settings-key">
                Project key
              </label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600" />
                <Input
                  id="project-settings-key"
                  name="key"
                  className="pl-11 uppercase"
                  value={formData.key}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="project-settings-description">
              Description
            </label>
            <Textarea
              id="project-settings-description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Start date</span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600" />
                <Input
                  name="startDate"
                  type="date"
                  className="pl-11"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">End date</span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600" />
                <Input
                  name="endDate"
                  type="date"
                  className="pl-11"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="project-settings-members">
              Project members
            </label>
            <div className="relative">
              <Users className="pointer-events-none absolute left-4 top-5 h-4 w-4 text-teal-600" />
              <select
                id="project-settings-members"
                multiple
                className={`${multiSelectClassName} min-h-[180px] pl-11`}
                value={formData.memberIds}
                onChange={handleMembersChange}
              >
                {sortedUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500">
              The project owner remains included automatically even if not selected here.
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
            <Button disabled={isPending} type="submit">
              {isPending ? "Saving..." : "Save Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectSettingsDialog;
