import { useEffect, useState } from "react";
import { AlertCircle, Flag, PlusCircle } from "lucide-react";
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
  title: "",
  description: "",
  priority: "medium",
};

const CreateIssueDialog = ({ open, onOpenChange, onSubmit, isPending }) => {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      setError("A title is required before you can report an issue.");
      return;
    }

    try {
      setError("");
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError.response?.data?.message || "Unable to create the issue."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-blue-600">
            <PlusCircle className="h-3.5 w-3.5" />
            Create Issue
          </div>
          <DialogTitle>Report a new issue</DialogTitle>
          <DialogDescription>
            Capture a problem quickly and route it into your active workspace.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              Report an issue for yourself or your team. It will appear in the
              task system as a new open item.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="issue-title">
              Title
            </label>
            <Input
              id="issue-title"
              name="title"
              placeholder="Search results are failing for archived tickets"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="issue-description"
            >
              Description
            </label>
            <Textarea
              id="issue-description"
              name="description"
              placeholder="Add context, expected behavior, and anything the team should know."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="issue-priority">
              Priority
            </label>
            <div className="relative">
              <Flag className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
              <select
                id="issue-priority"
                name="priority"
                className="field-select pl-11"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
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
              {isPending ? "Creating issue..." : "Submit Issue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIssueDialog;
