import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import pirnavLogo from "@/assets/pirnav-logo.png";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { loginRequest, registerRequest } from "@/lib/api";

const highlights = [
  {
    icon: Workflow,
    title: "Task-first workflow",
    description:
      "Manage assignments, monitor progress, and keep delivery visible in one clean workspace.",
  },
  {
    icon: ShieldCheck,
    title: "JWT-secured access",
    description:
      "Protected routes and persistent sessions keep the PIRNAV task portal secure.",
  },
  {
    icon: Sparkles,
    title: "Modern SaaS design",
    description:
      "A bright, responsive interface inspired by Linear, Notion, and Stripe.",
  },
];

const initialForm = {
  name: "",
  email: "",
  password: "",
};

const DEFAULT_ADMIN = {
  email: "admin@example.com",
  password: "admin123",
};

const DEFAULT_USER = {
  email: "user@example.com",
  password: "user123",
};

const getAuthErrorMessage = (error) => {
  const message = error?.response?.data?.message;

  if (error?.response?.status === 401 || message === "Invalid credentials") {
    return "Invalid email or password";
  }

  if (!error?.response) {
    return "Unable to reach the server. Make sure the backend is running on port 5000.";
  }

  return message || "Authentication failed.";
};

const AuthPage = () => {
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState(initialForm);

  const authMutation = useMutation({
    mutationFn: ({ currentMode, payload }) =>
      currentMode === "login" ? loginRequest(payload) : registerRequest(payload),
    onSuccess: (data) => {
      setAuthSession(data);
      navigate("/dashboard", { replace: true });
    },
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    authMutation.reset();
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleModeChange = (nextMode) => {
    authMutation.reset();
    setMode(nextMode);
  };

  const fillCredentials = (account) => {
    authMutation.reset();
    setMode("login");
    setFormData((current) => ({
      ...current,
      email: account.email,
      password: account.password,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload =
      mode === "login"
        ? {
            email: formData.email.trim(),
            password: formData.password,
          }
        : {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
          };

    await authMutation.mutateAsync({
      currentMode: mode,
      payload,
    });
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="grid w-full max-w-7xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="app-panel-strong overflow-hidden p-8 lg:p-10">
          <div className="flex items-center gap-4">
            <img
              src={pirnavLogo}
              alt="PIRNAV logo"
              className="h-auto max-h-[56px] w-auto object-contain"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-blue-600">
                PIRNAV Task Suite
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Task management for PIRNAV Software Solutions Pvt. Ltd.
              </h1>
            </div>
          </div>

          <div className="mt-10 max-w-2xl space-y-5">
            <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-[11px] uppercase tracking-[0.28em] text-blue-600">
              Full-Stack Task Platform
            </div>
            <h2 className="text-4xl font-semibold leading-tight text-slate-900 lg:text-5xl">
              Assign work, track progress, and resolve issues in one clean PIRNAV workspace.
            </h2>
            <p className="text-base leading-7 text-slate-600">
              Role-aware dashboards for admins and users, JWT-based access,
              MongoDB-backed task records, and a polished responsive UI built for everyday delivery.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-5">
            <div className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === "login"
                    ? "bg-blue-500 text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                type="button"
                onClick={() => handleModeChange("login")}
              >
                Login
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === "register"
                    ? "bg-blue-500 text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                type="button"
                onClick={() => handleModeChange("register")}
              >
                Register
              </button>
            </div>
            <div>
              <CardTitle>
                {mode === "login" ? "Welcome back" : "Create your user account"}
              </CardTitle>
              <CardDescription>
                {mode === "login"
                  ? "Sign in with your PIRNAV task-management credentials."
                  : "Register a standard user account to access your task dashboard."}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {mode === "login" ? (
                <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                        <KeyRound className="h-4 w-4" />
                        Default Demo Accounts
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Use either seeded account to explore the admin and user flows immediately.
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200"
                        onClick={() => fillCredentials(DEFAULT_ADMIN)}
                      >
                        <p className="text-sm font-semibold text-slate-900">Admin</p>
                        <p className="mt-1 text-xs text-slate-500">{DEFAULT_ADMIN.email}</p>
                        <p className="mt-2 text-xs text-slate-500">Password: {DEFAULT_ADMIN.password}</p>
                      </button>

                      <button
                        type="button"
                        className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200"
                        onClick={() => fillCredentials(DEFAULT_USER)}
                      >
                        <p className="text-sm font-semibold text-slate-900">User</p>
                        <p className="mt-1 text-xs text-slate-500">{DEFAULT_USER.email}</p>
                        <p className="mt-2 text-xs text-slate-500">Password: {DEFAULT_USER.password}</p>
                      </button>
                    </div>

                    <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                      Imported users and admin-reset accounts can sign in with the temporary
                      password <span className="font-semibold text-slate-700">Pirnav@123</span>.
                    </p>
                  </div>
                </div>
              ) : null}

              {mode === "register" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="name">
                    Full name
                  </label>
                  <Input
                    disabled={authMutation.isPending}
                    id="name"
                    name="name"
                    placeholder="Avery Morgan"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  Email
                </label>
                <Input
                  disabled={authMutation.isPending}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@pirnav.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <Input
                  disabled={authMutation.isPending}
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {authMutation.error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {getAuthErrorMessage(authMutation.error)}
                </div>
              ) : null}

              <Button className="w-full" disabled={authMutation.isPending} type="submit">
                {authMutation.isPending
                  ? mode === "login"
                    ? "Signing in..."
                    : "Creating account..."
                  : mode === "login"
                    ? "Access Dashboard"
                    : "Create Account"}
                {authMutation.isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default AuthPage;
