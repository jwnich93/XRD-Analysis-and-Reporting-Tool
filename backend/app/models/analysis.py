import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Sample(Base):
    __tablename__ = "samples"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    material: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    analyses: Mapped[list["Analysis"]] = relationship(back_populates="sample")


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    sample_id: Mapped[str] = mapped_column(ForeignKey("samples.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    wavelength_angstrom: Mapped[float | None] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    sample: Mapped["Sample"] = relationship(back_populates="analyses")
    measurements: Mapped[list["Measurement"]] = relationship(back_populates="analysis")
    reports: Mapped[list["Report"]] = relationship(back_populates="analysis")


class Measurement(Base):
    __tablename__ = "measurements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    analysis_id: Mapped[str] = mapped_column(ForeignKey("analyses.id"), nullable=False)
    two_theta: Mapped[float] = mapped_column(Float, nullable=False)
    intensity: Mapped[float] = mapped_column(Float, nullable=False)
    d_spacing: Mapped[float | None] = mapped_column(Float)
    peak_label: Mapped[str | None] = mapped_column(String(100))

    analysis: Mapped["Analysis"] = relationship(back_populates="measurements")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    analysis_id: Mapped[str] = mapped_column(ForeignKey("analyses.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    phase_identified: Mapped[str | None] = mapped_column(String(255))
    crystallite_size_nm: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    analysis: Mapped["Analysis"] = relationship(back_populates="reports")
