import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const IssueFilters = ({ filters, projects, assignees, onChange, onReset, total }) => (
  <Card>
    <CardContent className="space-y-5 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Board filters</p>
          <p className="text-sm text-slate-500">
            Narrow the board by project, status, priority, or assignee.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">{total} visible issues</p>
          <Button variant="ghost" size="sm" type="button" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Project
          </span>
          <select
            className="field-select"
            value={filters.projectId}
            onChange={(event) => onChange("projectId", event.target.value)}
          >
            <option value="all">All projects</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Status
          </span>
          <select
            className="field-select"
            value={filters.status}
            onChange={(event) => onChange("status", event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Priority
          </span>
          <select
            className="field-select"
            value={filters.priority}
            onChange={(event) => onChange("priority", event.target.value)}
          >
            <option value="all">All priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Assignee
          </span>
          <select
            className="field-select"
            value={filters.assignee}
            onChange={(event) => onChange("assignee", event.target.value)}
          >
            <option value="all">All assignees</option>
            {assignees.map((assignee) => (
              <option key={assignee._id} value={assignee._id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </CardContent>
  </Card>
);

export default IssueFilters;
