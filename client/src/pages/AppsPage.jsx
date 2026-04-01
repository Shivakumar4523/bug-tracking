import { AppWindow, Bot, GitBranchPlus, MessageSquareShare, PlugZap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const apps = [
  {
    name: "GitHub Sync",
    description:
      "Mirror issue state changes into pull request workflows and keep engineering progress tied to delivery status.",
    status: "Installed",
    icon: GitBranchPlus,
  },
  {
    name: "Slack Notifications",
    description:
      "Broadcast sprint moves, assignment changes, and import summaries into the team channel.",
    status: "Recommended",
    icon: MessageSquareShare,
  },
  {
    name: "Automation Bot",
    description:
      "Create rules for recurring triage, stale issue reminders, and sprint rollover housekeeping.",
    status: "Preview",
    icon: Bot,
  },
  {
    name: "Custom Plugin Hub",
    description:
      "Manage internal extensions and expose project-specific tooling to teams from one control panel.",
    status: "Available",
    icon: PlugZap,
  },
];

const AppsPage = () => (
  <div className="space-y-6">
    <section className="app-panel-strong border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(254,242,242,0.45)_38%,rgba(239,246,255,0.9))] p-6 sm:p-7">
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-rose-700">
          <AppWindow className="h-3.5 w-3.5" />
          Integrations and plugins
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Apps</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Surface the ecosystem around the board so projects can connect code, chat, automation,
            and internal tooling without leaving the workspace.
          </p>
        </div>
      </div>
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      {apps.map((app) => {
        const Icon = app.icon;

        return (
          <Card
            key={app.name}
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
                <Badge variant="secondary">{app.status}</Badge>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="sm:flex-1" type="button">
                  Connect
                </Button>
                <Button className="sm:flex-1" type="button" variant="secondary">
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  </div>
);

export default AppsPage;
