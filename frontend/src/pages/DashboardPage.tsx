import { useEffect, useState } from "react";
import type { ColDef } from "ag-grid-community";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatCard from "@/components/dashboard/StatCard";
import DashboardCard from "@/components/dashboard/DashboardCard";
import DataGrid from "@/components/dashboard/DataGrid";
import Badge from "@/components/ui/Badge";
import { fetchAnalyses, fetchReports, fetchSamples } from "@/services/api";
import type { Analysis, Report, Sample } from "@/types";

const statusColor = (s: string) =>
  s === "complete" ? "green" : s === "error" ? "red" : "amber";

const analysisCols: ColDef<Analysis>[] = [
  { field: "name", headerName: "Analysis", flex: 2 },
  {
    field: "status",
    headerName: "Status",
    cellRenderer: ({ value }: { value: string }) => (
      <Badge color={statusColor(value)}>{value}</Badge>
    ),
  },
  {
    field: "wavelength_angstrom",
    headerName: "λ (Å)",
    valueFormatter: ({ value }) => (value ? value.toFixed(4) : "—"),
  },
  {
    field: "created_at",
    headerName: "Created",
    valueFormatter: ({ value }) => new Date(value).toLocaleDateString(),
  },
];

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);

  useEffect(() => {
    fetchAnalyses().then(setAnalyses).catch(() => {});
    fetchReports().then(setReports).catch(() => {});
    fetchSamples().then(setSamples).catch(() => {});
  }, []);

  const chartData = analyses.slice(0, 12).map((a, i) => ({
    name: `#${i + 1}`,
    analyses: i + 1,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Samples"
          value={samples.length}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
          }
        />
        <StatCard
          label="Analyses Run"
          value={analyses.length}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
            </svg>
          }
        />
        <StatCard
          label="Complete"
          value={analyses.filter((a) => a.status === "complete").length}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          }
        />
        <StatCard
          label="Reports"
          value={reports.length}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Activity trend */}
        <DashboardCard title="Analyses Over Time" className="xl:col-span-1">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DFD0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="analyses"
                stroke="#0D1B3E"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </DashboardCard>

        {/* Recent analyses grid */}
        <DashboardCard title="Recent Analyses" className="xl:col-span-2">
          <DataGrid rowData={analyses} columnDefs={analysisCols} height={260} />
        </DashboardCard>
      </div>
    </div>
  );
}
