import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, Float, Integer, Text,
    DateTime, JSON, ForeignKey,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def _now():
    return datetime.now(timezone.utc)


def _uuid():
    return str(uuid.uuid4())


# ── Admin User ─────────────────────────────────────────────────────────────────
class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=_now)


# ── Bank Partner ───────────────────────────────────────────────────────────────
class BankPartner(Base):
    __tablename__ = "bank_partners"

    id = Column(String, primary_key=True, default=_uuid)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    bank_type = Column(String, nullable=False, default="PRIVATE")  # PSU, PRIVATE, NBFC, COOPERATIVE, SFB
    is_active = Column(Boolean, default=True)
    is_baas_eligible = Column(Boolean, default=False)
    priority_rank = Column(Integer, default=10)

    # Rates
    base_rate = Column(Float, default=9.0)
    best_rate = Column(Float, default=8.0)
    max_ltv_pct = Column(Float, default=85.0)
    min_cibil_score = Column(Integer, default=650)
    max_foir_pct = Column(Float, default=50.0)
    min_income = Column(Float, default=15000.0)
    processing_fee_pct = Column(Float, default=0.5)
    ev_discount_pct = Column(Float, default=0.0)
    women_discount_pct = Column(Float, default=0.0)

    # API config
    api_type = Column(String, default="REST")
    logo_url = Column(String, nullable=True)
    tagline = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


# ── Loan Application (mock / read-only from admin perspective) ─────────────────
class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(String, primary_key=True, default=_uuid)
    application_no = Column(String, unique=True, nullable=False, index=True)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    vehicle_model = Column(String, nullable=False)
    loan_amount = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="IN_PROGRESS")
    current_step = Column(Integer, default=1)
    bank_name = Column(String, nullable=True)

    # Detail fields
    employment_type = Column(String, nullable=True)
    monthly_income = Column(Float, nullable=True)
    cibil_score = Column(Integer, nullable=True)
    rate_of_interest = Column(Float, nullable=True)
    emi_amount = Column(Float, nullable=True)
    tenure_months = Column(Integer, nullable=True)
    external_ref_id = Column(String, nullable=True)
    submission_status = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), default=_now)


# ── Bank Rate Grid ─────────────────────────────────────────────────────────────
class BankRateGrid(Base):
    __tablename__ = "bank_rate_grids"

    bank_code = Column(String(20), primary_key=True)
    bank_name = Column(String, nullable=False)
    base_rates = Column(JSON, nullable=False)   # {cibil_band: {tenure: rate}}
    factors = Column(JSON, nullable=False)       # list of FactorDef objects
    processing_fee_pct = Column(Float, default=0.5)
    max_ltv_pct = Column(Float, default=85.0)
    notes = Column(JSON, default=list)

    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


# ── Integration Mapping ────────────────────────────────────────────────────────
class BankIntegrationMapping(Base):
    __tablename__ = "bank_integration_mappings"

    id = Column(String, primary_key=True, default=_uuid)
    bank_name = Column(String, nullable=False, index=True)
    stage = Column(String, nullable=False)
    maruti_format = Column(String, default="JSON")
    maruti_payload = Column(Text, nullable=True)
    bank_format = Column(String, default="JSON")
    bank_payload = Column(Text, nullable=True)
    mapping_result = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)
