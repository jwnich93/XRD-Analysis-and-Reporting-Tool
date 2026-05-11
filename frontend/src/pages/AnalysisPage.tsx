import { useEffect, useRef, useState } from "react";
import type { ColDef } from "ag-grid-community";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DataGrid from "@/components/dashboard/DataGrid";
import {
  createAnalysis,
  createSample,
  fetchAnalyses,
  fetchMeasurements,
  uploadXrdFile,
} from "@/services/api";
import type { Analysis, Measurement, Sample } from "@/types";

const measurementCols: ColDef<Measurement>[] = [
  { field: "two_theta", headerName: "2θ (°)", valueFormatter: ({ value }) => value.toFixed(4) },
  { field: "intensity", headerName: "Intensity", valueFormatter: ({ value }) => value.toFixed(2) },
  { field: "d_spacing", headerName: "d-spacing (Å)", valueFormatter: ({ value }) => value?.toFixed(4) ?? "—" },
  { field: "peak_label", headerName: "Peak Label", valueFormatter: ({ value }) => value ?? "—" },
];

export default function AnalysisPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selected, setSelected] = useState<Analysis | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sampleName, setSampleName] = useState("");
  const [analysisName, setAnalysisName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAnalyses().then(setAnalyses).catch(() => {});
  }, []);

  async function handleCreate() {
    if (!sampleName || !analysisName) return;
    const sample: Sample = await createSample({ name: sampleName });
    const analysis = await createAnalysis({
      sample_id: sample.id,
      name: analysisName,
    });
    setAnalyses((prev) => [analysis, ...prev]);
    setSelected(analysis);
    setSampleName("");
    setAnalysisName("");
  }

  async function handleUpload() {
    if (!selected || !fileRef.current?.files?.[0]) return;
    setUploading(true);
    try {
      const result = await uploadXrdFile(selected.id, fileRef.current.files[0]);
      setMeasurements(result);
      setAnalyses((prev) =>
        prev.map((a) => (a.id === selected.id ? { ...a, status: "complete" } : a))
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSelect(analysis: Analysis) {
    setSelected(analysis);
    const m = await fetchMeasurements(analysis.id);
    setMeasurements(m);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-slate-900">XRD Analysis</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* New analysis form */}
        <Card title="New Analysis" className="lg:col-span-1">
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Sample Name</label>
              <input
                className="w-full rounded-md border border-cream-300 bg-cream-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="e.g. Iron Oxide"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Analysis Name</label>
              <input
                className="w-full rounded-md border border-cream-300 bg-cream-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="e.g. Run 01 — Cu Kα"
                value={analysisName}
                onChange={(e) => setAnalysisName(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate} disabled={!sampleName || !analysisName}>
              Create Analysis
            </Button>
          </div>
        </Card>

        {/* Upload */}
        <Card title="Upload XRD Data" className="lg:col-span-2">
          {selected ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-600">
                Selected: <span className="font-semibold text-navy">{selected.name}</span>
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt,.xy"
                className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white file:cursor-pointer"
              />
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Processing…" : "Upload & Process"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Select an analysis from the table below to upload a data file.
            </p>
          )}
        </Card>
      </div>

      {/* Analyses list */}
      <Card title="All Analyses">
        <DataGrid
          rowData={analyses}
          columnDefs={[
            { field: "name", headerName: "Name", flex: 2 },
            { field: "status", headerName: "Status" },
            {
              field: "created_at",
              headerName: "Created",
              valueFormatter: ({ value }) => new Date(value).toLocaleDateString(),
            },
            {
              headerName: "Actions",
              cellRenderer: ({ data }: { data: Analysis }) => (
                <Button size="sm" variant="outline" onClick={() => handleSelect(data)}>
                  View
                </Button>
              ),
              sortable: false,
              filter: false,
            },
          ]}
          height={300}
        />
      </Card>

      {/* Measurements */}
      {measurements.length > 0 && (
        <Card title={`Measurements — ${selected?.name}`}>
          <DataGrid rowData={measurements} columnDefs={measurementCols} height={400} />
        </Card>
      )}
    </div>
  );
}
