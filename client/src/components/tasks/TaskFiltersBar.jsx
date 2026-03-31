import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TaskFiltersBar = ({
  filters,
  onChange,
  onReset,
  totalCount,
  filteredCount,
  assignees = [],
  showAssignee = false,
}) => (
  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-500">
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-500" />
            Task Filters
          </div>
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{filteredCount}</span> of{" "}
            <span className="font-semibold text-slate-900">{totalCount}</span> tasks
          </p>
        </div>

        <Button type="button" variant="secondary" size="sm" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,0.8fr))]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-11"
            placeholder="Search by title, description, assignee, or reporter"
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
          />
        </div>

        <select
          className="field-select"
          value={filters.status}
          onChange={(event) => onChange("status", event.target.value)}
        >
          <option value="all">All status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>

        <select
          className="field-select"
          value={filters.priority}
          onChange={(event) => onChange("priority", event.target.value)}
        >
          <option value="all">All priority</option>
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>

        {showAssignee ? (
          <select
            className="field-select"
            value={filters.assignedTo}
            onChange={(event) => onChange("assignedTo", event.target.value)}
          >
            <option value="all">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {assignees.map((assignee) => (
              <option key={assignee._id} value={assignee._id}>
                {assignee.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="hidden xl:block" />
        )}
      </div>
    </div>
  </div>
);

export default TaskFiltersBar;
