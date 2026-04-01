import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  AlertCircle,
  ArrowRightLeft,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FIELD_OPTIONS = [
  { value: "title", label: "Issue Title", required: true },
  { value: "description", label: "Description" },
  { value: "type", label: "Type" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "assigneeEmail", label: "Assignee Email" },
  { value: "dueDate", label: "Due Date" },
];

const guessHeader = (headers, aliases) =>
  headers.find((header) => aliases.includes(header.trim().toLowerCase())) || "";

const buildInitialMapping = (headers) => ({
  title: guessHeader(headers, ["title", "summary", "issue title", "name"]),
  description: guessHeader(headers, ["description", "details", "body"]),
  type: guessHeader(headers, ["type", "issue type"]),
  status: guessHeader(headers, ["status", "state", "column"]),
  priority: guessHeader(headers, ["priority", "severity"]),
  assigneeEmail: guessHeader(headers, ["assignee", "assignee email", "owner email", "owner"]),
  dueDate: guessHeader(headers, ["due date", "duedate", "target date", "deadline"]),
});

const buildMappedRows = (rows, mapping) =>
  rows.map((row, index) => ({
    rowNumber: Number(row?.rowNumber) || index + 2,
    title: mapping.title ? String(row[mapping.title] || "").trim() : "",
    description: mapping.description ? String(row[mapping.description] || "").trim() : "",
    type: mapping.type ? String(row[mapping.type] || "").trim() : "",
    status: mapping.status ? String(row[mapping.status] || "").trim() : "",
    priority: mapping.priority ? String(row[mapping.priority] || "").trim() : "",
    assigneeEmail: mapping.assigneeEmail
      ? String(row[mapping.assigneeEmail] || "").trim()
      : "",
    dueDate: mapping.dueDate ? String(row[mapping.dueDate] || "").trim() : "",
  }));

const IssueImportDialog = ({
  isPending,
  onOpenChange,
  onSubmit,
  open,
  projects = [],
}) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [parseError, setParseError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  useEffect(() => {
    if (!open) {
      setFileName("");
      setHeaders([]);
      setRows([]);
      setMapping({});
      setSelectedProjectId("");
      setParseError("");
      setIsDragging(false);
      setImportSummary(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    if (!selectedProjectId && projects[0]?._id) {
      setSelectedProjectId(projects[0]._id);
    }
  }, [open, projects, selectedProjectId]);

  const mappedRows = useMemo(() => buildMappedRows(rows, mapping), [mapping, rows]);
  const previewRows = mappedRows.slice(0, 6);

  const parseFile = (file) => {
    setFileName(file.name);
    setParseError("");
    setImportSummary(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: ({ data, errors, meta }) => {
        const nextHeaders = meta.fields || [];

        if (!nextHeaders.length) {
          setHeaders([]);
          setRows([]);
          setMapping({});
          setParseError("The uploaded CSV must include a header row.");
          return;
        }

        setHeaders(nextHeaders);
        setRows(data);
        setMapping(buildInitialMapping(nextHeaders));

        if (errors.length) {
          setParseError(errors[0]?.message || "Some rows could not be parsed cleanly.");
        }
      },
      error: (error) => {
        setHeaders([]);
        setRows([]);
        setMapping({});
        setParseError(error.message || "Unable to parse this CSV file.");
      },
    });
  };

  const handleImport = async () => {
    if (!selectedProjectId) {
      setParseError("Choose the project that should receive these issues.");
      return;
    }

    if (!rows.length) {
      setParseError("Upload a CSV before importing issues.");
      return;
    }

    if (!mapping.title) {
      setParseError("Map at least one CSV column to Issue Title.");
      return;
    }

    try {
      setParseError("");
      const summary = await onSubmit({
        projectId: selectedProjectId,
        rows: mappedRows,
      });
      setImportSummary(summary);
    } catch (submitError) {
      setImportSummary(null);
      setParseError(submitError.response?.data?.message || "Unable to import these issues.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-teal-700">
            <UploadCloud className="h-3.5 w-3.5" />
            CSV Import
          </div>
          <DialogTitle>Import issues into a project</DialogTitle>
          <DialogDescription>
            Upload a CSV, map its fields into the issue schema, and import the rows into the
            selected project backlog.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div
              className={`rounded-[28px] border border-dashed p-6 transition ${
                isDragging ? "border-teal-400 bg-teal-50" : "border-slate-300 bg-slate-50"
              }`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const file = event.dataTransfer.files?.[0];

                if (file) {
                  parseFile(file);
                }
              }}
            >
              <input
                ref={fileInputRef}
                accept=".csv,text/csv"
                className="hidden"
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    parseFile(file);
                  }
                }}
              />

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {fileName || "Drop your issue CSV here"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Map common columns like Title, Description, Status, Priority, Assignee Email,
                      and Due Date.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    <UploadCloud className="h-4 w-4" />
                    Choose CSV
                  </Button>
                  <Button asChild type="button" variant="outline">
                    <a href="/samples/issue-import-sample.csv" download>
                      <Download className="h-4 w-4" />
                      Download Sample
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Import destination</p>
              <p className="mt-1 text-sm text-slate-500">
                Choose which project backlog should receive the imported issues.
              </p>
              <select
                className="field-select mt-4"
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name} ({project.key})
                  </option>
                ))}
              </select>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm text-slate-500">CSV rows</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{rows.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm text-slate-500">Preview rows</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{previewRows.length}</p>
                </div>
              </div>
            </div>
          </div>

          {parseError ? (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{parseError}</span>
            </div>
          ) : null}

          {headers.length ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-teal-700" />
                <p className="font-semibold text-slate-900">Field mapping</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {FIELD_OPTIONS.map((field) => (
                  <label key={field.value} className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                      {field.label}
                      {field.required ? " *" : ""}
                    </span>
                    <select
                      className="field-select"
                      value={mapping[field.value] || ""}
                      onChange={(event) =>
                        setMapping((current) => ({
                          ...current,
                          [field.value]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Not mapped</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {previewRows.length ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <p className="mb-3 text-sm font-semibold text-slate-900">Preview mapped rows</p>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="max-h-[280px] overflow-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Row</th>
                        <th className="px-4 py-3 font-medium">Title</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Priority</th>
                        <th className="px-4 py-3 font-medium">Assignee Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row) => (
                        <tr key={`${row.rowNumber}-${row.title}`} className="border-t border-slate-100">
                          <td className="px-4 py-3 text-slate-500">{row.rowNumber}</td>
                          <td className="px-4 py-3 text-slate-900">{row.title || "-"}</td>
                          <td className="px-4 py-3 text-slate-600">{row.status || "-"}</td>
                          <td className="px-4 py-3 text-slate-600">{row.priority || "-"}</td>
                          <td className="px-4 py-3 text-slate-600">{row.assigneeEmail || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {importSummary ? (
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4">
              <p className="text-sm font-semibold text-emerald-700">{importSummary.message}</p>
              <p className="mt-2 text-sm text-slate-600">
                Imported <span className="font-semibold text-slate-900">{importSummary.importedCount}</span>{" "}
                issues and skipped{" "}
                <span className="font-semibold text-slate-900">{importSummary.skippedCount}</span>{" "}
                rows.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button disabled={!rows.length || isPending} type="button" onClick={handleImport}>
              {isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Import Issues
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IssueImportDialog;
