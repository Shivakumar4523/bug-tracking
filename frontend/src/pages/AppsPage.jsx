import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AppWindow,
  Bot,
  GitBranchPlus,
  LoaderCircle,
  MessageSquareShare,
  PlugZap,
  ShieldCheck,
} from "lucide-react";
import AppAccessDialog from "@/components/apps/AppAccessDialog";
import EmptyState from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchApps,
  fetchProjects,
  fetchTeams,
  updateAppAccess,
  updateAppConnection,
  updateAppInstallation,
} from "@/lib/api";
import { formatDateTime, normalizeRole } from "@/lib/utils";

const iconMap = {
  GitBranchPlus,
  MessageSquareShare,
  Bot,
  PlugZap,
  AppWindow,
};

const formatAudienceSummary = (app) => {
  const segments = [];

  if (app.access?.roles?.length) {
    segments.push(app.access.roles.join(" and "));
  }

  if (app.access?.projects?.length) {
    segments.push(
      `${app.access.projects.length} project${app.access.projects.length === 1 ? "" : "s"}`
    );
  }

  if (app.access?.teams?.length) {
    segments.push(`${app.access.teams.length} team${app.access.teams.length === 1 ? "" : "s"}`);
  }

  return segments.length ? segments.join(" + ") : "Workspace-wide access";
};

const getCatalogStatusVariant = (status = "") => {
  if (status === "Installed") {
    return "success";
  }

  if (status === "Recommended") {
    return "default";
  }

  if (status === "Preview") {
    return "warning";
  }

  return "secondary";
};

const shouldShowCatalogStatus = (status = "") => status !== "Installed";

const getAvailabilityCopy = (app) => {
  if (app.hasAccess) {
    return "Installed, connected, and ready for use.";
  }

  if (app.isInstalled && app.isConnected) {
    return "Installed and connected. Configure access if you want to narrow who can use it.";
  }

  if (app.isInstalled) {
    return "Installed. Connect it to activate workspace access.";
  }

  return "Install the app first, then connect it to unlock access.";
};

const AppsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = normalizeRole(user?.role) === "Admin";
  const [activeAppSlug, setActiveAppSlug] = useState("");
  const [connectionSlug, setConnectionSlug] = useState("");
  const [installationSlug, setInstallationSlug] = useState("");

  const {
    data: apps = [],
    isLoading: isAppsLoading,
    error: appsError,
  } = useQuery({
    queryKey: ["apps"],
    queryFn: fetchApps,
  });

  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects", "apps-page"],
    queryFn: fetchProjects,
    enabled: isAdmin,
  });

  const {
    data: teams = [],
    isLoading: isTeamsLoading,
    error: teamsError,
  } = useQuery({
    queryKey: ["teams", "apps-page"],
    queryFn: fetchTeams,
    enabled: isAdmin,
  });

  const installationMutation = useMutation({
    mutationFn: updateAppInstallation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });

  const connectionMutation = useMutation({
    mutationFn: updateAppConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });

  const accessMutation = useMutation({
    mutationFn: updateAppAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });

  const activeApp = useMemo(
    () => apps.find((app) => app.slug === activeAppSlug) || null,
    [activeAppSlug, apps]
  );

  const stats = useMemo(
    () => ({
      installed: apps.filter((app) => app.isInstalled).length,
      connected: apps.filter((app) => app.isConnected).length,
      accessible: apps.filter((app) => app.hasAccess).length,
    }),
    [apps]
  );

  const error = appsError || projectsError || teamsError;

  const handlePrimaryAction = async (app) => {
    if (!isAdmin) {
      setActiveAppSlug(app.slug);
      return;
    }

    if (!app.isInstalled) {
      setInstallationSlug(app.slug);

      try {
        await installationMutation.mutateAsync({
          slug: app.slug,
          installed: true,
        });
      } finally {
        setInstallationSlug("");
      }

      return;
    }

    setConnectionSlug(app.slug);

    try {
      await connectionMutation.mutateAsync({
        slug: app.slug,
        connected: !app.isConnected,
      });
    } finally {
      setConnectionSlug("");
    }
  };

  const handleInstallationToggle = async (app) => {
    setInstallationSlug(app.slug);

    try {
      await installationMutation.mutateAsync({
        slug: app.slug,
        installed: !app.isInstalled,
      });
    } finally {
      setInstallationSlug("");
    }
  };

  const handleAccessSave = async (payload) => {
    if (!activeApp) {
      return;
    }

    await accessMutation.mutateAsync({
      slug: activeApp.slug,
      payload,
    });
    setActiveAppSlug("");
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-rose-600">
          {error.response?.data?.message || "Unable to load app access right now."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="app-panel-strong border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(254,242,242,0.45)_38%,rgba(239,246,255,0.9))] p-6 sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-rose-700">
              <AppWindow className="h-3.5 w-3.5" />
              Integrations and plugins
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Apps</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Install apps, connect them to external services, and control who can use them
                across the workspace.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-white/85 px-5 py-4">
              <p className="text-sm text-slate-500">Installed</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.installed}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/85 px-5 py-4">
              <p className="text-sm text-slate-500">Connected</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.connected}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/85 px-5 py-4">
              <p className="text-sm text-slate-500">Accessible</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.accessible}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-slate-200 bg-white/82 px-5 py-4 text-sm text-slate-500">
          {isAdmin ? (
            <span>
              Install an app first, connect it next, then use{" "}
              <span className="font-semibold text-slate-900">Configure</span> only if you want to
              limit access by role, project, or team.
            </span>
          ) : (
            <span>
              Installed and connected apps become available here. Admins can still narrow access
              for specific teams when needed.
            </span>
          )}
        </div>
      </section>

      {isAppsLoading ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-[320px] w-full" />
          <Skeleton className="h-[320px] w-full" />
          <Skeleton className="h-[320px] w-full" />
          <Skeleton className="h-[320px] w-full" />
        </section>
      ) : apps.length ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {apps.map((app) => {
            const Icon = iconMap[app.icon] || AppWindow;
            const isUpdatingConnection =
              connectionMutation.isPending && connectionSlug === app.slug;
            const isUpdatingInstallation =
              installationMutation.isPending && installationSlug === app.slug;

            return (
              <Card
                key={app.slug}
                className="border border-slate-200/90 bg-white/92 transition duration-200 hover:-translate-y-1 hover:border-rose-200"
              >
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">{app.name}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{app.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      {shouldShowCatalogStatus(app.marketplaceStatus) ? (
                        <Badge variant={getCatalogStatusVariant(app.marketplaceStatus)}>
                          {app.marketplaceStatus}
                        </Badge>
                      ) : null}
                      <Badge variant={app.isInstalled ? "success" : "secondary"}>
                        {app.isInstalled ? "Installed" : "Not installed"}
                      </Badge>
                      <Badge variant={app.isConnected ? "success" : "secondary"}>
                        {app.isConnected ? "Connected" : "Not connected"}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {app.hasAccess ? "Access ready for this workspace" : "Access pending"}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {getAvailabilityCopy(app)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Audience: {formatAudienceSummary(app)}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                          {app.installedBy?.name
                            ? `Installed by ${app.installedBy.name} ${
                                app.installedAt ? `on ${formatDateTime(app.installedAt)}` : ""
                              }`
                            : "No installation has been completed yet"}
                        </p>
                        {app.connectedBy?.name ? (
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                            Connected by {app.connectedBy.name}{" "}
                            {app.connectedAt ? `on ${formatDateTime(app.connectedAt)}` : ""}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <Button
                      className="w-full"
                      type="button"
                      disabled={isUpdatingInstallation || isUpdatingConnection}
                      onClick={() => handlePrimaryAction(app)}
                    >
                      {isUpdatingInstallation || isUpdatingConnection ? (
                        <>
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : !isAdmin ? (
                        app.hasAccess ? (
                          "Access Ready"
                        ) : (
                          "View Access"
                        )
                      ) : !app.isInstalled ? (
                        "Install"
                      ) : app.isConnected ? (
                        "Disconnect"
                      ) : (
                        "Connect"
                      )}
                    </Button>

                    <Button
                      className="w-full"
                      type="button"
                      variant="secondary"
                      disabled={!isAdmin || isUpdatingInstallation || isUpdatingConnection}
                      onClick={() => handleInstallationToggle(app)}
                    >
                      {!isAdmin
                        ? app.isInstalled
                          ? "Installed"
                          : "Not Installed"
                        : app.isInstalled
                          ? "Uninstall"
                          : "Install"}
                    </Button>

                    <Button
                      className="w-full"
                      type="button"
                      variant="secondary"
                      onClick={() => setActiveAppSlug(app.slug)}
                    >
                      {isAdmin ? "Configure" : "Details"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ) : (
        <EmptyState
          title="No apps available"
          description="App integrations will appear here once the workspace catalog is ready."
          icon={<AppWindow className="h-5 w-5" />}
        />
      )}

      <AppAccessDialog
        app={activeApp}
        isContextLoading={isAdmin && (isProjectsLoading || isTeamsLoading)}
        isPending={accessMutation.isPending}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setActiveAppSlug("");
          }
        }}
        onSubmit={handleAccessSave}
        open={Boolean(activeApp)}
        projects={projects}
        readOnly={!isAdmin}
        teams={teams}
      />
    </div>
  );
};

export default AppsPage;
