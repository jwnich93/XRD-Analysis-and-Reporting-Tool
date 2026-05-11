import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.analysis import Measurement, Report
from app.schemas.analysis import ReportCreate, ReportRead

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=ReportRead, status_code=201)
async def create_report(body: ReportCreate, db: AsyncSession = Depends(get_db)):
    report = Report(**body.model_dump())
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


@router.get("", response_model=list[ReportRead])
async def list_reports(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Report).order_by(Report.created_at.desc()))
    return result.scalars().all()


@router.get("/{report_id}", response_model=ReportRead)
async def get_report(report_id: str, db: AsyncSession = Depends(get_db)):
    report = await db.get(Report, report_id)
    if not report:
        raise HTTPException(404, "Report not found")
    return report


@router.get("/{report_id}/export")
async def export_report_csv(report_id: str, db: AsyncSession = Depends(get_db)):
    report = await db.get(Report, report_id)
    if not report:
        raise HTTPException(404, "Report not found")

    result = await db.execute(
        select(Measurement).where(Measurement.analysis_id == report.analysis_id)
    )
    measurements = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["two_theta", "intensity", "d_spacing", "peak_label"])
    for m in measurements:
        writer.writerow([m.two_theta, m.intensity, m.d_spacing, m.peak_label or ""])

    output.seek(0)
    filename = f"report_{report_id}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
