import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, Mail, ShieldCheck } from "lucide-react";
import { fetchMyTasks, fetchTasks } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeRole } from "@/lib/utils";

const ProfilePage = () => {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const isAdmin = role === "Admin";

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", isAdmin ? "profile-admin" : "profile-user"],
    queryFn: isAdmin ? fetchTasks : fetchMyTasks,
  });

  const stats = useMemo(
    () => ({
      total: tasks.length,
      active: tasks.filter((task) => task.status !== "closed").length,
      closed: tasks.filter((task) => task.status === "closed").length,
    }),
    [tasks]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your account information inside the PIRNAV task workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <BriefcaseBusiness className="h-4 w-4 text-blue-500" />
              Name
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-900">{user?.name}</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Mail className="h-4 w-4 text-blue-500" />
              Email
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-900">{user?.email}</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              Role
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-900">{role}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Summary</CardTitle>
          <CardDescription>
            A quick snapshot of your current workload and completed tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Total Tasks</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Active</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.active}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Closed</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.closed}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
