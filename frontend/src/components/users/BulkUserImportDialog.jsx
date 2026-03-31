import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import {
  AlertCircle,
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

const REQUIRED_HEADERS = ["Email Address", "Full Name"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const initialSummary = null;

const buildRowKey = (row) =>
  [row.rowNumber, row.email || "blank-email", row.name || "blank-name", row.reason || "ok"].join(
    "-"
  );

const PreviewTable = ({ rows, title, description, tone = "neutral" }) => {
  const toneClasses =
    tone === "error"
      ? "border-rose-200 bg-rose-50/60"
      : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-[24px] border p-4 ${toneClasses}`}>
      <div className="mb-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="max-h-[240px] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Row</th>
                <th className="px-4 py-3 font-medium">Email Address</th>
                <th className="px-4 py-3 font-medium">Full Name</th>
                {tone === "error" ? (
                  <th className="px-4 py-3 font-medium">Reason</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={buildRowKey(row)} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-500">{row.rowNumber}</td>
                  <td className="px-4 py-3 text-slate-900">{row.email || "-"}</td>
                  <td className="px-4 py-3 text-slate-900">{row.name || "-"}</td>
                  {tone === "error" ? (
                    <td className="px-4 py-3 text-rose-600">{row.reason}</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const BulkUserImportDialog = ({ open, onOpenChange, onSubmit, isPending }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [validRows, setValidRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [importSummary, setImportSummary] = useState(initialSummary);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) {
      setFileName("");
      setParseError("");
      setValidRows([]);
      setInvalidRows([]);
      setImportSummary(initialSummary);
      setIsDragging(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const parseCsvFile = (file) => {
    setFileName(file.name);
    setParseError("");
    setImportSummary(initialSummary);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete: ({ data, errors, meta }) => {
        const fields = meta.fields || [];
        const missingHeaders = REQUIRED_HEADERS.filter((header) => !fields.includes(header));

        if (missingHeaders.length) {
          setValidRows([]);
          setInvalidRows([]);
          setParseError(`CSV must include these headers: ${REQUIRED_HEADERS.join(", ")}`);
          return;
        }

        const seenEmails = new Set();
        const nextValidRows = [];
        const nextInvalidRows = [];

        data.forEach((rawRow, index) => {
          const rowNumber = index + 2;
          const email = String(rawRow["Email Address"] || "")
            .trim()
            .toLowerCase();
          const name = String(rawRow["Full Name"] || "").trim();

          if (!email || !name) {
            nextInvalidRows.push({
              rowNumber,
              email,
              name,
              reason: "Full name and email are required",
            });
            return;
          }

          if (!EMAIL_PATTERN.test(email)) {
            nextInvalidRows.push({
              rowNumber,
              email,
              name,
              reason: "Invalid email format",
            });
            return;
          }

          if (seenEmails.has(email)) {
            nextInvalidRows.push({
              rowNumber,
              email,
              name,
              reason: "Duplicate email in CSV",
            });
            return;
          }

          seenEmails.add(email);
          nextValidRows.push({
            rowNumber,
            email,
            name,
          });
        });

        errors.forEach((error) => {
          nextInvalidRows.push({
            rowNumber: typeof error.row === "number" ? error.row + 2 : "-",
            email: "",
            name: "",
            reason: error.message,
          });
        });

        setValidRows(nextValidRows);
        setInvalidRows(nextInvalidRows);
      },
      error: (error) => {
        setValidRows([]);
        setInvalidRows([]);
        setParseError(error.message || "Unable to parse this CSV file.");
      },
    });
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    parseCsvFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    parseCsvFile(file);
  };

  const handleImport = async () => {
    if (!validRows.length) {
      setParseError("Upload a valid CSV with at least one valid user row.");
      return;
    }

    try {
      setParseError("");
      const summary = await onSubmit(validRows);
      setImportSummary(summary);
    } catch (submitError) {
      setImportSummary(initialSummary);
      setParseError(
        submitError.response?.data?.message || "Unable to import users from this CSV."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-blue-600">
            <UploadCloud className="h-3.5 w-3.5" />
            Bulk User Import
          </div>
          <DialogTitle>Import users from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with <span className="font-semibold text-slate-700">Email Address</span>{" "}
            and <span className="font-semibold text-slate-700">Full Name</span>, preview the rows,
            and confirm before importing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div
            className={`rounded-[28px] border border-dashed p-6 transition ${
              isDragging
                ? "border-blue-400 bg-blue-50"
                : "border-slate-300 bg-slate-50"
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
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              accept=".csv,text/csv"
              className="hidden"
              type="file"
              onChange={handleFileSelect}
            />

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {fileName || "Drop your CSV file here"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Drag and drop a CSV or browse manually. The file must include
                    {" "}
                    <span className="font-medium text-slate-700">Email Address, Full Name</span>.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Imported users will be created with the system temporary password returned by
                    the server after import.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={handleBrowseClick}>
                  <UploadCloud className="h-4 w-4" />
                  Choose CSV
                </Button>
                <Button type="button" variant="outline" asChild>
                  <a href="/samples/bulk-user-import-sample.csv" download>
                    <Download className="h-4 w-4" />
                    Download Sample
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Valid rows</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{validRows.length}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Invalid rows</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{invalidRows.length}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Ready to import</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {validRows.length ? `${validRows.length} users` : "0 users"}
              </p>
            </div>
          </div>

          {parseError ? (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{parseError}</span>
            </div>
          ) : null}

          {importSummary ? (
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4">
              <p className="text-sm font-semibold text-emerald-700">{importSummary.message}</p>
              <p className="mt-2 text-sm text-slate-600">
                Imported <span className="font-semibold text-slate-900">{importSummary.importedCount}</span>{" "}
                users and skipped{" "}
                <span className="font-semibold text-slate-900">{importSummary.skippedCount}</span>{" "}
                rows.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Temporary password:{" "}
                <span className="font-semibold text-slate-900">
                  {importSummary.temporaryPassword}
                </span>
              </p>
            </div>
          ) : null}

          {validRows.length ? (
            <PreviewTable
              rows={validRows}
              title="Preview valid users"
              description="These rows are ready to send to the backend."
            />
          ) : null}

          {invalidRows.length ? (
            <PreviewTable
              rows={invalidRows}
              title="CSV rows that need attention"
              description="These rows will not be submitted until the file is corrected."
              tone="error"
            />
          ) : null}

          {importSummary?.invalidRows?.length ? (
            <PreviewTable
              rows={importSummary.invalidRows}
              title="Rows skipped by the server"
              description="Usually duplicate emails that already exist in the database."
              tone="error"
            />
          ) : null}

          {!validRows.length && !invalidRows.length ? (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              Upload a CSV to preview users before importing.
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!validRows.length || isPending} onClick={handleImport}>
              {isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  {validRows.length
                    ? `Import ${validRows.length} ${validRows.length === 1 ? "User" : "Users"}`
                    : "Import Users"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUserImportDialog;
