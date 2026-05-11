import io
import math

import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.analysis import Analysis, Measurement, Sample
from app.schemas.analysis import AnalysisCreate, AnalysisRead, MeasurementRead, SampleCreate, SampleRead

router = APIRouter(prefix="/analyses", tags=["analyses"])

COPPER_K_ALPHA = 1.5406  # Å


# ── Samples ───────────────────────────────────────────────────────────────────

@router.post("/samples", response_model=SampleRead, status_code=201)
async def create_sample(body: SampleCreate, db: AsyncSession = Depends(get_db)):
    sample = Sample(**body.model_dump())
    db.add(sample)
    await db.commit()
    await db.refresh(sample)
    return sample


@router.get("/samples", response_model=list[SampleRead])
async def list_samples(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Sample).order_by(Sample.created_at.desc()))
    return result.scalars().all()


# ── Analyses ──────────────────────────────────────────────────────────────────

@router.post("", response_model=AnalysisRead, status_code=201)
async def create_analysis(body: AnalysisCreate, db: AsyncSession = Depends(get_db)):
    analysis = Analysis(**body.model_dump(), status="pending")
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return analysis


@router.get("", response_model=list[AnalysisRead])
async def list_analyses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Analysis).order_by(Analysis.created_at.desc()))
    return result.scalars().all()


@router.get("/{analysis_id}", response_model=AnalysisRead)
async def get_analysis(analysis_id: str, db: AsyncSession = Depends(get_db)):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    return analysis


@router.get("/{analysis_id}/measurements", response_model=list[MeasurementRead])
async def get_measurements(analysis_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Measurement).where(Measurement.analysis_id == analysis_id)
    )
    return result.scalars().all()


# ── File upload + processing ──────────────────────────────────────────────────

@router.post("/{analysis_id}/upload", response_model=list[MeasurementRead])
async def upload_xrd_data(
    analysis_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Accept a two-column CSV/TXT (2θ, intensity) or .xy file.
    Calculates d-spacing via Bragg's law and stores measurements.
    """
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(404, "Analysis not found")

    content = await file.read()
    try:
        df = pd.read_csv(
            io.BytesIO(content),
            sep=r"[\s,;]+",
            engine="python",
            header=None,
            comment="#",
            names=["two_theta", "intensity"],
        )
        df = df.dropna().astype(float)
    except Exception as exc:
        raise HTTPException(422, f"Could not parse file: {exc}") from exc

    wavelength = analysis.wavelength_angstrom or COPPER_K_ALPHA

    def bragg_d(theta_2: float) -> float | None:
        try:
            sin_val = math.sin(math.radians(theta_2 / 2))
            return wavelength / (2 * sin_val) if sin_val > 0 else None
        except Exception:
            return None

    # Delete existing measurements before re-upload
    existing = await db.execute(
        select(Measurement).where(Measurement.analysis_id == analysis_id)
    )
    for m in existing.scalars().all():
        await db.delete(m)

    measurements = []
    for _, row in df.iterrows():
        d = bragg_d(row.two_theta)
        m = Measurement(
            analysis_id=analysis_id,
            two_theta=float(row.two_theta),
            intensity=float(row.intensity),
            d_spacing=d,
        )
        db.add(m)
        measurements.append(m)

    analysis.status = "complete"
    await db.commit()
    for m in measurements:
        await db.refresh(m)

    return measurements
