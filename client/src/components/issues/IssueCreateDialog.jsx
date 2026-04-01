import { Dialog, DialogContent } from "@/components/ui/dialog";
import IssueComposer from "@/components/issues/IssueComposer";

const IssueCreateDialog = ({
  defaultProjectId,
  isPending,
  onOpenChange,
  onSubmit,
  open,
  projects,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
      {open ? (
        <IssueComposer
          defaultProjectId={defaultProjectId}
          isPending={isPending}
          onSubmit={async (payload) => {
            await onSubmit(payload);
            onOpenChange(false);
          }}
          projects={projects}
        />
      ) : null}
    </DialogContent>
  </Dialog>
);

export default IssueCreateDialog;
