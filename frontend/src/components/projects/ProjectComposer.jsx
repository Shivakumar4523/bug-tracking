import { useMemo, useState } from "react";
import { CheckCircle2, PlusCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

const ProjectComposer = ({ users, currentUser, onSubmit, isPending }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    memberIds: [],
  });
  const [error, setError] = useState("");

  const sortedUsers = useMemo(
    () => [...users].sort((left, right) => left.name.localeCompare(right.name)),
    [users]
  );

  const handleToggleMember = (userId) => {
    setFormData((current) => ({
      ...current,
      memberIds: current.memberIds.includes(userId)
        ? current.memberIds.filter((id) => id !== userId)
        : [...current.memberIds, userId],
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("A project name is required.");
      return;
    }

    try {
      setError("");
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim(),
        memberIds: formData.memberIds,
      });
      setFormData({
        name: "",
        description: "",
        memberIds: [],
      });
    } catch (submitError) {
      setError(
        submitError.response?.data?.message || "Unable to create the project."
      );
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-blue-600">
          <PlusCircle className="h-3.5 w-3.5" />
          New Project
        </div>
        <CardTitle>Create a project workspace</CardTitle>
        <CardDescription>
          Capture a scope, attach teammates, and prepare a dedicated board for
          delivery.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="name">
              Project name
            </label>
            <Input
              id="name"
              name="name"
              placeholder="Revenue Platform"
              value={formData.name}
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
              placeholder="Describe the product surface, objective, and delivery context."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Team members
              </label>
              <Badge variant="secondary">
                {currentUser?.name} is added automatically
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {sortedUsers.map((user) => {
                const checked = formData.memberIds.includes(user._id);

                return (
                  <button
                    key={user._id}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      checked
                        ? "border-blue-200 bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                    type="button"
                    onClick={() => handleToggleMember(user._id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                      </div>
                      {checked ? (
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-500">
                      {user.role}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          ) : null}

          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Creating project..." : "Create Project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectComposer;
