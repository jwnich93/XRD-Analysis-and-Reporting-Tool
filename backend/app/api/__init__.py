from fastapi import APIRouter

from app.api.routes import analyses, health, reports

router = APIRouter()
router.include_router(health.router)
router.include_router(analyses.router)
router.include_router(reports.router)
