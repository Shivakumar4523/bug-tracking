import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils";

const roleOptions = [
  {
    value: "Admin",
    label: "Admins",
    description: "Workspace admins can connect and manage the app.",
  },
  {
    value: "User",
    label: "Users",
    description: "Regular members can access the app from their workspace.",
  },
];

const AccessOptionList = ({
  description,
  emptyMessage,
  items,
  onToggle,
  readOnly,
  selectedIds,
  title,
}) => (
  <section className="space-y-3 rounded-[26px] border border-slate-200 bg-slate-50 p-5">
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>

    {items.length ? (
      <div className="grid gap-3">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-start gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-3"
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-blue-500"
              checked={selectedIds.includes(item.id)}
              disabled={readOnly}
              onChange={() => onToggle(item.id)}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
            </div>
          </label>
        ))}
      </div>
    ) : (
      <div className="rounded-[20px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
        {emptyMessage}
      </div>
    )}
  </section>
);

const AppAccessDialog = ({
  app,
  isContextLoading,
  isPending,
  onOpenChange,
  onSubmit,
  open,
  projects,
  readOnly,
  teams,
}) => {
  const [roles, setRoles] = useState([]);
  const [projectIds, setProjectIds] = useState([]);
  const [teamIds, setTeamIds] = useState([]);

  useEffect(() => {
    if (!app) {
      setRoles([]);
      setProjectIds([]);
      setTeamIds([]);
      return;
    }

    setRoles(app.access?.roles || []);
    setProjectIds((app.access?.projects || []).map((project) => project._id));
    setTeamIds((app.access?.teams || []).map((team) => team._id));
  }, [app]);

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        id: project._id,
        label: project.name,
        description: project.key ? `${project.key} workspace` : "Project workspace",
      })),
    [projects]
  );

  const teamOptions = useMemo(
    () =>
      teams.map((team) => ({
        id: team._id,
        label: team.name,
        description: team.projectId?.name
          ? `Linked to ${team.projectId.name}`
          : "Shared workspace team",
      })),
    [teams]
  );

  if (!app) {
    return null;
  }

  const toggleSelection = (value, setter) => {
    setter((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (readOnly) {
      onOpenChange(false);
      return;
    }

    await onSubmit({
      projectIds,
      roles,
      teamIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-3rem)] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={app.isInstalled ? "success" : "secondary"}>
              {app.isInstalled ? "Installed" : "Not installed"}
            </Badge>
            <Badge variant={app.isConnected ? "success" : "secondary"}>
              {app.isConnected ? "Connected" : "Not connected"}
            </Badge>
            <Badge variant={app.hasAccess ? "success" : "outline"}>
              {app.hasAccess ? "Access ready" : "Restricted"}
            </Badge>
          </div>
          <DialogTitle>{readOnly ? `Access for ${app.name}` : `Configure ${app.name}`}</DialogTitle>
          <DialogDescription>
            {readOnly
              ? "This app is visible in the workspace, but only admins can change who can use it."
              : "Choose which roles, projects, or teams can use this app once it is connected."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <section className="rounded-[26px] border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">Installation and connection</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {!app.isInstalled
                    ? "Install the app first. Once it is installed, connect it to activate access."
                    : app.isConnected
                      ? `Installed and connected ${app.connectedAt ? formatDateTime(app.connectedAt) : "recently"}.`
                      : "Installed, but still waiting for connection before access becomes active."}
                </p>
                {app.installedBy?.name ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                    Installed by {app.installedBy.name}
                  </p>
                ) : null}
                {app.connectedBy?.name ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                    Connected by {app.connectedBy.name}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <AccessOptionList
            description="Anyone who matches at least one selected audience will receive app access."
            emptyMessage="Role access is unavailable for this app."
            items={roleOptions.map((role) => ({
              id: role.value,
              label: role.label,
              description: role.description,
            }))}
            onToggle={(value) => toggleSelection(value, setRoles)}
            readOnly={readOnly}
            selectedIds={roles}
            title="Role access"
          />

          <AccessOptionList
            description="Project members can get access even if their role is not selected above."
            emptyMessage={
              isContextLoading
                ? "Loading projects..."
                : "Create a project first if you want project-specific access."
            }
            items={projectOptions}
            onToggle={(value) => toggleSelection(value, setProjectIds)}
            readOnly={readOnly}
            selectedIds={projectIds}
            title="Project access"
          />

          <AccessOptionList
            description="Use teams when an app should stay limited to one delivery group."
            emptyMessage={
              isContextLoading
                ? "Loading teams..."
                : "Create a team first if you want team-specific access."
            }
            items={teamOptions}
            onToggle={(value) => toggleSelection(value, setTeamIds)}
            readOnly={readOnly}
            selectedIds={teamIds}
            title="Team access"
          />

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {readOnly ? "Close" : "Cancel"}
            </Button>
            {readOnly ? null : (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save access"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppAccessDialog;
