import { useEffect, useState } from "react";
import type { ColDef } from "ag-grid-community";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DataGrid from "@/components/dashboard/DataGrid";
import Badge from "@/components/ui/Badge";
import { createReport, exportReportCsv, fetchAnalyses, fetchReports } from "@/services/api";
import type { Analysis, Report } from "@/types";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [form, setForm] = useState({ analysis_id: "", title: "", phase_identified: "", summary: "" });

  useEffect(() => {
    fetchReports().then(setReports).catch(() => {});
    fetchAnalyses().then(setAnalyses).catch(() => {});
  }, []);

  async function handleCreate() {
    if (!form.analysis_id || !form.title) return;
    const report = await createReport({
      analysis_id: form.analysis_id,
      title: form.title,
      phase_identified: form.phase_identified || undefined,
      summary: form.summary || undefined,
    });
    setReports((prev) => [report, ...prev]);
    setForm({ analysis_id: "", title: "", phase_identified: "", summary: "" });
  }

  async function handleExport(reportId: string) {
    const blob = await exportReportCsv(reportId);
    downloadBlob(blob, `report_${reportId}.csv`);
  }

  const reportCols: ColDef<Report>[] = [
    { field: "title", headerName: "Title", flex: 2 },
    { field: "phase_identified", headerName: "Phase", valueFormatter: ({ value }) => value ?? "—" },
    {
      field: "crystallite_size_nm",
      headerName: "Crystallite (nm)",
      valueFormatter: ({ value }) => (value ? value.toFixed(2) : "—"),
    },
    {
      field: "created_at",
      headerName: "Created",
      valueFormatter: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      headerName: "Export",
      cellRenderer: ({ data }: { data: Report }) => (
        <Button size="sm" variant="outline" onClick={() => handleExport(data.id)}>
          CSV
        </Button>
      ),
      sortable: false,
      filter: false,
      width: 100,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-slate-900">Reports</h1>

      <Card title="New Report">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Analysis</label>
            <select
              className="w-full rounded-md border border-cream-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/50"
              value={form.analysis_id}
              onChange={(e) => setForm((f) => ({ ...f, analysis_id: e.target.value }))}
            >
              <option value="">Select analysis…</option>
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Report Title</label>
            <input
              className="w-full rounded-md border border-cream-300 bg-cream-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="e.g. Phase Analysis — Run 01"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Phase Identified</label>
            <input
              className="w-full rounded-md border border-cream-300 bg-cream-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="e.g. α-Fe₂O₃"
              value={form.phase_identified}
              onChange={(e) => setForm((f) => ({ ...f, phase_identified: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!form.analysis_id || !form.title}
            >
              Save Report
            </Button>
          </div>
        </div>
      </Card>

      <Card title="All Reports">
        <DataGrid rowData={reports} columnDefs={reportCols} height={450} />
      </Card>
    </div>
  );
}
