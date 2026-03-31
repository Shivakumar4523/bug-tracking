import { useEffect, useState } from "react";
import { AlertCircle, LockKeyhole, Mail, PlusCircle, UserRound } from "lucide-react";
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
  email: "",
  password: "",
};

const CreateUserDialog = ({ open, onOpenChange, onSubmit, isPending }) => {
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

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError("Name, email, and password are required.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setError("");
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError.response?.data?.message || "Unable to create the user.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-blue-600">
            <PlusCircle className="h-3.5 w-3.5" />
            Add User
          </div>
          <DialogTitle>Create a new user account</DialogTitle>
          <DialogDescription>
            Add a user directly from the admin dashboard so they can receive task assignments right away.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="create-user-name">
              Full name
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
              <Input
                id="create-user-name"
                name="name"
                className="pl-11"
                placeholder="Avery Morgan"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="create-user-email">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
              <Input
                id="create-user-email"
                name="email"
                type="email"
                className="pl-11"
                placeholder="name@pirnav.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="create-user-password">
              Password
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
              <Input
                id="create-user-password"
                name="password"
                type="password"
                className="pl-11"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <p className="text-xs text-slate-500">
              This will be the user&apos;s initial login password.
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
              {isPending ? "Creating user..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
