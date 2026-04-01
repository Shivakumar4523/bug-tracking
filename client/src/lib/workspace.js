import {
  AppWindow,
  BarChart3,
  Filter,
  FolderKanban,
  KanbanSquare,
  ListTodo,
  Rocket,
  Users2,
} from "lucide-react";

export const workspaceNavItems = [
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    description: "View all projects",
  },
  {
    label: "Filters",
    href: "/filters",
    icon: Filter,
    description: "Search issues",
  },
  {
    label: "Dashboards",
    href: "/reports",
    icon: BarChart3,
    description: "Custom reports",
  },
  {
    label: "People/Teams",
    href: "/people",
    icon: Users2,
    description: "Manage users",
  },
  {
    label: "Apps",
    href: "/apps",
    icon: AppWindow,
    description: "Integrations and plugins",
  },
];

export const workspaceQuickLinks = [
  {
    label: "Backlog",
    href: "/dashboard?view=backlog",
    icon: ListTodo,
    description: "Plan queued work",
  },
  {
    label: "Active Sprint",
    href: "/dashboard?view=sprint",
    icon: Rocket,
    description: "Track active delivery",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    description: "Progress snapshots",
  },
  {
    label: "Issues",
    href: "/filters",
    icon: KanbanSquare,
    description: "Search all issues",
  },
];

export const issueColumns = [
  {
    id: "todo",
    label: "To Do",
    description: "Queued for triage or ready for pickup.",
  },
  {
    id: "inprogress",
    label: "In Progress",
    description: "Actively being worked on by the team.",
  },
  {
    id: "done",
    label: "Done",
    description: "Validated, resolved, or shipped.",
  },
];

export const issueStatusOptions = issueColumns.map((column) => ({
  value: column.id,
  label: column.label,
}));

export const issuePriorityOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

export const issueTypeOptions = [
  { value: "Bug", label: "Bug" },
  { value: "Task", label: "Task" },
  { value: "Story", label: "Story" },
];

export const rolesMatrix = [
  {
    role: "Admin",
    capabilities: [
      "Manage users and teams",
      "Create and edit projects",
      "Import issues from CSV",
      "Reassign work and delete issues",
    ],
  },
  {
    role: "User",
    capabilities: [
      "View assigned projects",
      "Create and update issues",
      "Move work across the board",
      "Comment and collaborate",
    ],
  },
];

export const getIssueStatusLabel = (status = "") =>
  issueStatusOptions.find((option) => option.value === status)?.label || "To Do";

export const getIssuePriorityVariant = (priority = "") => {
  if (priority === "High") {
    return "danger";
  }

  if (priority === "Medium") {
    return "warning";
  }

  return "secondary";
};
