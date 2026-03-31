import { useEffect, useMemo, useState } from "react";
import { Bug, ClipboardList, Flag, Sparkle, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const IssueComposer = ({ projects, defaultProjectId, onSubmit, isPending }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Bug",
    status: "todo",
    priority: "Medium",
    projectId: defaultProjectId || projects[0]?._id || "",
    assignee: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultProjectId && defaultProjectId !== "all") {
      setFormData((current) => ({
        ...current,
        projectId: defaultProjectId,
      }));
      return;
    }

    if (!formData.projectId && projects[0]?._id) {
      setFormData((current) => ({
        ...current,
        projectId: projects[0]._id,
      }));
    }
  }, [defaultProjectId, projects, formData.projectId]);

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === formData.projectId),
    [projects, formData.projectId]
  );

  const availableMembers = selectedProject?.members || [];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim() || !formData.projectId) {
      setError("Issue title and project are required.");
      return;
    }

    try {
      setError("");
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        projectId: formData.projectId,
        assignee: formData.assignee || null,
      });
      setFormData((current) => ({
        ...current,
        title: "",
        description: "",
        type: "Bug",
        status: "todo",
        priority: "Medium",
        assignee: "",
      }));
    } catch (submitError) {
      setError(
        submitError.response?.data?.message || "Unable to create the issue."
      );
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-blue-600">
          <Sparkle className="h-3.5 w-3.5" />
          New Issue
        </div>
        <CardTitle>Add work to the board</CardTitle>
        <CardDescription>
          Create a bug, task, or story and push it straight into the delivery
          flow.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="title">
              Title
            </label>
            <Input
              id="title"
              name="title"
              placeholder="Checkout request returns 500 for saved cards"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="description"
            >
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Include observed behavior, expected result, and reproduction steps."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <ClipboardList className="h-4 w-4 text-blue-500" />
                Project
              </span>
              <select
                className="field-select"
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
              >
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <UserCircle2 className="h-4 w-4 text-blue-500" />
                Assignee
              </span>
              <select
                className="field-select"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
              >
                <option value="">Unassigned</option>
                {availableMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Bug className="h-4 w-4 text-blue-500" />
                Type
              </span>
              <select
                className="field-select"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="Bug">Bug</option>
                <option value="Task">Task</option>
                <option value="Story">Story</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Flag className="h-4 w-4 text-blue-500" />
                Priority
              </span>
              <select
                className="field-select"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Initial status</span>
              <select
                className="field-select"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          ) : null}

          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Creating issue..." : "Create Issue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default IssueComposer;
