from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.dependencies import get_current_admin_id
from app.models.models import BankRateGrid, BankPartner
from app.schemas.schemas import RateGridOut, RateGridSaveRequest

router = APIRouter(prefix="/admin/rate-grids", tags=["rate-grids"])


@router.get("", response_model=List[RateGridOut])
def list_grids(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_id),
):
    return db.query(BankRateGrid).all()


@router.get("/{bank_code}", response_model=RateGridOut)
def get_grid(
    bank_code: str,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_id),
):
    grid = db.query(BankRateGrid).filter(BankRateGrid.bank_code == bank_code.upper()).first()
    if not grid:
        raise HTTPException(status_code=404, detail=f"No rate grid for bank code '{bank_code}'")
    return grid


@router.put("/{bank_code}", response_model=RateGridOut)
def save_grid(
    bank_code: str,
    req: RateGridSaveRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_id),
):
    code = bank_code.upper()
    grid = db.query(BankRateGrid).filter(BankRateGrid.bank_code == code).first()

    if grid:
        grid.bank_name = req.bank_name
        grid.base_rates = req.base_rates
        grid.factors = req.factors
        grid.processing_fee_pct = req.processing_fee_pct
        grid.max_ltv_pct = req.max_ltv_pct
        grid.notes = req.notes
    else:
        grid = BankRateGrid(
            bank_code=code,
            bank_name=req.bank_name,
            base_rates=req.base_rates,
            factors=req.factors,
            processing_fee_pct=req.processing_fee_pct,
            max_ltv_pct=req.max_ltv_pct,
            notes=req.notes,
        )
        db.add(grid)

    # Keep bank_partners.base_rate and best_rate in sync with the grid
    # base_rate = grid['750-799'][60]  (standard scenario)
    # best_rate = grid['800+'][12]     (best case, no factors)
    try:
        bands = req.base_rates
        std_band = next((k for k in bands if "750" in k), None)
        best_band = next((k for k in bands if "800" in k), None)
        if std_band and "60" in bands[std_band]:
            std_rate = bands[std_band]["60"]
        elif std_band:
            std_rate = list(bands[std_band].values())[4]  # 5th tenure = 60m index
        else:
            std_rate = None

        if best_band and "12" in bands[best_band]:
            best_base = bands[best_band]["12"]
        elif best_band:
            best_base = min(bands[best_band].values())
        else:
            best_base = None

        partner = db.query(BankPartner).filter(BankPartner.code == code).first()
        if partner and std_rate is not None:
            partner.base_rate = round(float(std_rate), 2)
        if partner and best_base is not None:
            partner.best_rate = round(float(best_base), 2)
        if partner:
            partner.processing_fee_pct = req.processing_fee_pct
            partner.max_ltv_pct = req.max_ltv_pct
    except Exception:
        pass  # sync is best-effort

    db.commit()
    db.refresh(grid)
    return grid
