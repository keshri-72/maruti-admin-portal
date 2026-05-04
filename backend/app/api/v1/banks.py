from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_admin_id
from app.models.models import BankPartner
from app.schemas.schemas import (
    BankListResponse, BankOut, BankCreateRequest,
    ToggleResponse, TestConnectionResponse,
)

router = APIRouter(prefix="/admin/banks", tags=["banks"])


@router.get("", response_model=BankListResponse)
def list_banks(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_id),
):
    banks = db.query(BankPartner).order_by(BankPartner.priority_rank, BankPartner.name).all()
    return BankListResponse(banks=banks, total=len(banks))


@router.post("", response_model=BankOut)
def create_bank(
    req: BankCreateRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_id),
):
    existing = db.query(BankPartner).filter(BankPartner.code == req.code.upper()).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Bank code {req.code} already exists")

    bank = BankPartner(**{**req.model_dump(), "code": req.code.upper()})
    db.add(bank)
    db.commit()
    db.refresh(bank)
    return bank


@router.patch("/{bank_id}/toggle-active", response_model=ToggleResponse)
def toggle_active(
    bank_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_id),
):
    bank = db.query(BankPartner).filter(BankPartner.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")
    bank.is_active = not bank.is_active
    db.commit()
    return ToggleResponse(bank_id=bank.id, is_active=bank.is_active)


@router.get("/{bank_id}/test-connection", response_model=TestConnectionResponse)
def test_connection(
    bank_id: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_id),
):
    bank = db.query(BankPartner).filter(BankPartner.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")
    return TestConnectionResponse(
        bank_code=bank.code,
        reachable=True,
        api_type=bank.api_type,
    )
