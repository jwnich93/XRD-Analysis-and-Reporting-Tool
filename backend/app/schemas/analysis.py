from datetime import datetime

from pydantic import BaseModel


# ── Sample ────────────────────────────────────────────────────────────────────

class SampleCreate(BaseModel):
    name: str
    material: str | None = None
    description: str | None = None


class SampleRead(SampleCreate):
    id: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Analysis ──────────────────────────────────────────────────────────────────

class AnalysisCreate(BaseModel):
    sample_id: str
    name: str
    wavelength_angstrom: float | None = None
    notes: str | None = None


class AnalysisRead(AnalysisCreate):
    id: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Measurement ───────────────────────────────────────────────────────────────

class MeasurementRead(BaseModel):
    id: str
    analysis_id: str
    two_theta: float
    intensity: float
    d_spacing: float | None = None
    peak_label: str | None = None

    model_config = {"from_attributes": True}


# ── Report ────────────────────────────────────────────────────────────────────

class ReportCreate(BaseModel):
    analysis_id: str
    title: str
    summary: str | None = None
    phase_identified: str | None = None
    crystallite_size_nm: float | None = None


class ReportRead(ReportCreate):
    id: str
    created_at: datetime

    model_config = {"from_attributes": True}
