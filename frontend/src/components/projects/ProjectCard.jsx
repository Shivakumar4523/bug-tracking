import { FolderKanban, Users2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate, getInitials } from "@/lib/utils";

const ProjectCard = ({ project, currentUserId }) => {
  const isOwner = String(project.owner?._id) === String(currentUserId);

  return (
    <Card className="transition duration-200 hover:-translate-y-1 hover:border-blue-200">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant={isOwner ? "default" : "secondary"}>
            {isOwner ? "Project Owner" : "Project Member"}
          </Badge>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Created {formatDate(project.createdAt)}
          </p>
        </div>
        <CardTitle>{project.name}</CardTitle>
        <CardDescription>
          {project.description || "No project description provided yet."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <FolderKanban className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Issues</span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {project.issueCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500">
              <Users2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Members</span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {project.members?.length || 0}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Team
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {project.members?.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
