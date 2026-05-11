import axios from "axios";
import type { Analysis, AnalysisGridRow, Measurement, Report, Sample } from "@/types";

const http = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// ── Health ──────────────────────────────────────────────────────────────────
export const fetchHealth = () =>
  http.get<{ status: string; db: string }>("/health").then((r) => r.data);

// ── Samples ─────────────────────────────────────────────────────────────────
export const fetchSamples = () =>
  http.get<Sample[]>("/analyses/samples").then((r) => r.data);

export const createSample = (payload: Pick<Sample, "name" | "material" | "description">) =>
  http.post<Sample>("/analyses/samples", payload).then((r) => r.data);

// ── Analyses ─────────────────────────────────────────────────────────────────
export const fetchAnalyses = () =>
  http.get<Analysis[]>("/analyses").then((r) => r.data);

export const createAnalysis = (payload: Omit<Analysis, "id" | "status" | "created_at">) =>
  http.post<Analysis>("/analyses", payload).then((r) => r.data);

export const fetchMeasurements = (analysisId: string) =>
  http.get<Measurement[]>(`/analyses/${analysisId}/measurements`).then((r) => r.data);

export const uploadXrdFile = (analysisId: string, file: File) => {
  const form = new FormData();
  form.append("file", file);
  return http
    .post<Measurement[]>(`/analyses/${analysisId}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

// ── Reports ──────────────────────────────────────────────────────────────────
export const fetchReports = () =>
  http.get<Report[]>("/reports").then((r) => r.data);

export const createReport = (payload: Omit<Report, "id" | "created_at">) =>
  http.post<Report>("/reports", payload).then((r) => r.data);

export const exportReportCsv = (reportId: string) =>
  http
    .get(`/reports/${reportId}/export`, { responseType: "blob" })
    .then((r) => r.data as Blob);
