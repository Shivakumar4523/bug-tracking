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
import {
  CalendarDays,
  GripVertical,
  MessageSquareText,
  UserCircle2,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getIssuePriorityVariant,
  getIssueStatusLabel,
  issueColumns,
} from "@/lib/workspace";
import { cn, formatDate, getInitials } from "@/lib/utils";

const IssueCardBody = ({
  issue,
  onOpen,
  handleProps = {},
  isDragging = false,
  isSelected = false,
}) => (
  <button
    className={cn(
      "w-full rounded-[26px] border p-4 text-left transition duration-200",
      isDragging
        ? "border-teal-200 bg-teal-50 shadow-[0_20px_44px_rgba(20,184,166,0.16)]"
        : isSelected
          ? "border-slate-900 bg-slate-900 text-white shadow-[0_22px_44px_rgba(15,23,42,0.2)]"
          : "border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50"
    )}
    type="button"
    onClick={() => onOpen(issue)}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={getIssuePriorityVariant(issue.priority)}>{issue.priority}</Badge>
        <Badge variant={isSelected ? "outline" : "secondary"}>
          {issue.projectId?.key || issue.projectId?.name || "Project"}
        </Badge>
      </div>
      <div
        className={cn(
          "cursor-grab rounded-xl border p-2 transition",
          isSelected
            ? "border-white/15 bg-white/10 text-white"
            : "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
        )}
        {...handleProps}
        onClick={(event) => event.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>
    </div>

    <div className="mt-4">
      <p className="text-base font-semibold">{issue.title}</p>
      <p
        className={cn(
          "mt-2 line-clamp-3 text-sm leading-6",
          isSelected ? "text-slate-200" : "text-slate-500"
        )}
      >
        {issue.description || "No additional detail provided."}
      </p>
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Badge variant={isSelected ? "outline" : "secondary"}>{issue.type}</Badge>
      <Badge variant="outline">{getIssueStatusLabel(issue.status)}</Badge>
    </div>

    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <div
        className={cn(
          "flex items-center gap-2 text-xs",
          isSelected ? "text-slate-200" : "text-slate-500"
        )}
      >
        <MessageSquareText className="h-4 w-4" />
        <span>Open details</span>
      </div>

      {issue.dueDate ? (
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs",
            isSelected ? "text-slate-200" : "text-slate-500"
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{formatDate(issue.dueDate)}</span>
        </div>
      ) : null}

      {issue.assignee ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded-full border px-2.5 py-1.5",
            isSelected
              ? "border-white/15 bg-white/10"
              : "border-slate-200 bg-slate-50"
          )}
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback>{getInitials(issue.assignee?.name)}</AvatarFallback>
          </Avatar>
          <span className="text-xs">{issue.assignee?.name}</span>
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-2 text-xs",
            isSelected ? "text-slate-200" : "text-slate-500"
          )}
        >
          <UserCircle2 className="h-4 w-4" />
          <span>Unassigned</span>
        </div>
      )}
    </div>
  </button>
);

const IssueCard = ({ issue, onOpen, isSelected }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
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
        handleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        isSelected={isSelected}
        issue={issue}
        onOpen={onOpen}
      />
    </div>
  );
};

const Column = ({ column, issues, onOpen, isOver, selectedIssueId }) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "kanban-column border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] p-0 transition duration-200",
        isOver && "border-teal-200 bg-teal-50/60"
      )}
    >
      <CardContent className="flex h-full flex-col p-0">
        <div className="border-b border-slate-200 px-4 pb-4 pt-4">
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

        <div className="flex min-h-[320px] flex-1 flex-col gap-3 px-3 py-3">
          {issues.map((issue) => (
            <IssueCard
              key={issue._id}
              isSelected={selectedIssueId === issue._id}
              issue={issue}
              onOpen={onOpen}
            />
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

const IssueBoard = ({ issues, onStatusChange, onSelectIssue, selectedIssueId }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [boardIssues, setBoardIssues] = useState(issues);
  const [activeIssue, setActiveIssue] = useState(null);
  const [overColumnId, setOverColumnId] = useState("");

  useEffect(() => {
    setBoardIssues(issues);
  }, [issues]);

  const groupedIssues = useMemo(
    () =>
      issueColumns.reduce((accumulator, column) => {
        accumulator[column.id] = boardIssues.filter((issue) => issue.status === column.id);
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
      current.map((issue) => (issue._id === issueId ? { ...issue, status: nextStatus } : issue))
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
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {issueColumns.map((column) => (
          <Column
            key={column.id}
            column={column}
            isOver={overColumnId === column.id}
            issues={groupedIssues[column.id] || []}
            onOpen={onSelectIssue}
            selectedIssueId={selectedIssueId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeIssue ? (
          <div className="w-[320px]">
            <IssueCardBody issue={activeIssue} isDragging onOpen={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default IssueBoard;
