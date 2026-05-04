from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.core.database import get_db
from app.dependencies import get_current_admin_id
from app.models.models import LoanApplication
from app.schemas.schemas import ApplicationListResponse, ApplicationDetail, SubmissionOut

router = APIRouter(prefix="/admin/applications", tags=["applications"])


@router.get("", response_model=ApplicationListResponse)
def list_applications(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_id),
):
    q = db.query(LoanApplication)

    if search:
        like = f"%{search}%"
        q = q.filter(
            or_(
                LoanApplication.application_no.ilike(like),
                LoanApplication.customer_name.ilike(like),
                LoanApplication.customer_phone.ilike(like),
            )
        )
    if status:
        q = q.filter(LoanApplication.status == status)

    total = q.count()
    items = q.order_by(LoanApplication.created_at.desc()).offset((page - 1) * size).limit(size).all()

    return ApplicationListResponse(items=items, total=total, page=page, size=size)


@router.get("/{application_id}", response_model=ApplicationDetail)
def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_id),
):
    app = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Build a synthetic submission entry if the app has bank info
    submissions = []
    if app.bank_name:
        submissions.append(SubmissionOut(
            submission_id=f"sub-{app.id[:8]}",
            bank_name=app.bank_name,
            status=app.submission_status or "UNDER_REVIEW",
            external_ref_id=app.external_ref_id,
            submitted_at=app.created_at,
            remarks=None,
        ))

    return ApplicationDetail(
        id=app.id,
        application_no=app.application_no,
        customer_name=app.customer_name,
        customer_phone=app.customer_phone,
        email=app.email,
        vehicle_model=app.vehicle_model,
        loan_amount=app.loan_amount,
        status=app.status,
        current_step=app.current_step,
        bank_name=app.bank_name,
        created_at=app.created_at,
        employment_type=app.employment_type,
        monthly_income=app.monthly_income,
        cibil_score=app.cibil_score,
        rate_of_interest=app.rate_of_interest,
        emi_amount=app.emi_amount,
        tenure_months=app.tenure_months,
        submission_status=app.submission_status,
        external_ref_id=app.external_ref_id,
        submissions=submissions,
    )
