export interface Sample {
  id: string;
  name: string;
  material?: string;
  description?: string;
  created_at: string;
}

export interface Analysis {
  id: string;
  sample_id: string;
  name: string;
  status: "pending" | "complete" | "error";
  wavelength_angstrom?: number;
  notes?: string;
  created_at: string;
}

export interface Measurement {
  id: string;
  analysis_id: string;
  two_theta: number;
  intensity: number;
  d_spacing?: number;
  peak_label?: string;
}

export interface Report {
  id: string;
  analysis_id: string;
  title: string;
  summary?: string;
  phase_identified?: string;
  crystallite_size_nm?: number;
  created_at: string;
}

export type AnalysisGridRow = Analysis & { sample_name?: string };
export type ReportGridRow = Report & { analysis_name?: string };
