import { useEffect, useMemo, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MessageSquareText, UserCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const columns = [
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

const priorityVariant = {
  Low: "secondary",
  Medium: "warning",
  High: "danger",
};

const IssueCardBody = ({ issue, onOpen, handleProps = {}, isDragging = false }) => (
  <button
    className={`w-full rounded-[26px] border p-4 text-left transition duration-200 ${
      isDragging
        ? "border-blue-200 bg-blue-50 shadow-[0_18px_40px_rgba(59,130,246,0.14)]"
        : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
    }`}
    type="button"
    onClick={() => onOpen(issue)}
  >
    <div className="flex items-start justify-between gap-3">
      <Badge variant={priorityVariant[issue.priority] || "secondary"}>
        {issue.priority}
      </Badge>
      <div
        className="cursor-grab rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
        {...handleProps}
        onClick={(event) => event.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>
    </div>

    <div className="mt-4">
      <p className="text-base font-semibold text-slate-900">{issue.title}</p>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
        {issue.description || "No additional detail provided."}
      </p>
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Badge variant="outline">{issue.type}</Badge>
      <Badge variant="secondary">{issue.projectId?.name || "Project"}</Badge>
    </div>

    <div className="mt-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <MessageSquareText className="h-4 w-4" />
        <span>Open details</span>
      </div>

      {issue.assignee ? (
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5">
          <Avatar className="h-7 w-7">
            <AvatarFallback>{getInitials(issue.assignee?.name)}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-slate-600">{issue.assignee?.name}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <UserCircle2 className="h-4 w-4" />
          <span>Unassigned</span>
        </div>
      )}
    </div>
  </button>
);

const IssueCard = ({ issue, onOpen }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: issue._id,
      data: {
        issueId: issue._id,
        status: issue.status,
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div ref={setNodeRef} style={style}>
      <IssueCardBody
        issue={issue}
        isDragging={isDragging}
        onOpen={onOpen}
        handleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

const Column = ({ column, issues, onOpen, isOver }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <Card
      ref={setNodeRef}
      className={`kanban-column transition duration-200 ${
        isOver ? "border-blue-200 bg-blue-50/70" : ""
      }`}
    >
      <CardContent className="flex h-full flex-col p-0">
        <div className="mb-4 border-b border-slate-200 px-4 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-900">{column.label}</p>
              <p className="mt-1 text-sm text-slate-500">{column.description}</p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
              {issues.length}
            </div>
          </div>
        </div>

        <div className="flex min-h-[380px] flex-1 flex-col gap-3 px-2">
          {issues.map((issue) => (
            <IssueCard key={issue._id} issue={issue} onOpen={onOpen} />
          ))}

          {!issues.length ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm leading-6 text-slate-500">
              Drop an issue here to move it into {column.label.toLowerCase()}.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

const IssueBoard = ({ issues, onStatusChange, onSelectIssue }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [boardIssues, setBoardIssues] = useState(issues);
  const [activeIssue, setActiveIssue] = useState(null);
  const [overColumnId, setOverColumnId] = useState("");

  useEffect(() => {
    setBoardIssues(issues);
  }, [issues]);

  const groupedIssues = useMemo(
    () =>
      columns.reduce((accumulator, column) => {
        accumulator[column.id] = boardIssues.filter(
          (issue) => issue.status === column.id
        );
        return accumulator;
      }, {}),
    [boardIssues]
  );

  const handleDragStart = (event) => {
    const issue = boardIssues.find((item) => item._id === event.active.id);
    setActiveIssue(issue || null);
  };

  const handleDragOver = (event) => {
    setOverColumnId(event.over?.id ? String(event.over.id) : "");
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setOverColumnId("");
    setActiveIssue(null);

    if (!over) {
      return;
    }

    const issueId = String(active.id);
    const nextStatus = String(over.id);
    const currentIssue = boardIssues.find((item) => item._id === issueId);

    if (!currentIssue || currentIssue.status === nextStatus) {
      return;
    }

    const previousIssues = boardIssues;

    setBoardIssues((current) =>
      current.map((issue) =>
        issue._id === issueId ? { ...issue, status: nextStatus } : issue
      )
    );

    try {
      await onStatusChange(issueId, nextStatus);
    } catch (error) {
      setBoardIssues(previousIssues);
    }
  };

  return (
    <DndContext
      collisionDetection={closestCorners}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            issues={groupedIssues[column.id] || []}
            onOpen={onSelectIssue}
            isOver={overColumnId === column.id}
          />
        ))}
      </div>

      <DragOverlay>
        {activeIssue ? (
          <div className="w-[320px]">
            <IssueCardBody issue={activeIssue} onOpen={() => {}} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default IssueBoard;
