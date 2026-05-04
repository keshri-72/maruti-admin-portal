from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


# ── Auth ───────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    admin_id: str
    email: str
    is_admin: bool = True


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str


# ── Banks ──────────────────────────────────────────────────────────────────────
class BankOut(BaseModel):
    id: str
    code: str
    name: str
    bank_type: str
    is_active: bool
    is_baas_eligible: bool
    priority_rank: int
    base_rate: float
    best_rate: float
    max_ltv_pct: float
    min_cibil_score: int
    max_foir_pct: float
    min_income: float
    processing_fee_pct: float
    ev_discount_pct: float
    women_discount_pct: float
    api_type: str
    logo_url: Optional[str]
    tagline: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class BankListResponse(BaseModel):
    banks: List[BankOut]
    total: int


class BankCreateRequest(BaseModel):
    code: str
    name: str
    bank_type: str = "PRIVATE"
    base_rate: float = 9.0
    best_rate: float = 8.0
    max_ltv_pct: float = 85.0
    min_cibil_score: int = 650
    max_foir_pct: float = 50.0
    min_income: float = 15000.0
    processing_fee_pct: float = 0.5
    ev_discount_pct: float = 0.0
    women_discount_pct: float = 0.0
    is_baas_eligible: bool = False
    priority_rank: int = 10
    api_type: str = "REST"
    logo_url: Optional[str] = None
    tagline: Optional[str] = None


class ToggleResponse(BaseModel):
    bank_id: str
    is_active: bool


class TestConnectionResponse(BaseModel):
    bank_code: str
    reachable: bool
    api_type: str


# ── Applications ───────────────────────────────────────────────────────────────
class ApplicationRow(BaseModel):
    id: str
    application_no: str
    customer_name: str
    customer_phone: str
    vehicle_model: str
    loan_amount: float
    status: str
    current_step: int
    bank_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SubmissionOut(BaseModel):
    submission_id: str = ""
    bank_name: Optional[str]
    status: str
    external_ref_id: Optional[str]
    submitted_at: Optional[datetime]
    remarks: Optional[str]


class ApplicationDetail(ApplicationRow):
    email: Optional[str]
    employment_type: Optional[str]
    monthly_income: Optional[float]
    cibil_score: Optional[int]
    rate_of_interest: Optional[float]
    emi_amount: Optional[float]
    tenure_months: Optional[int]
    submission_status: Optional[str]
    external_ref_id: Optional[str]
    submissions: List[SubmissionOut] = []


class ApplicationListResponse(BaseModel):
    items: List[ApplicationRow]
    total: int
    page: int
    size: int


# ── Analytics ──────────────────────────────────────────────────────────────────
class FunnelStep(BaseModel):
    step: int
    count: int
    pct_of_total: float


class FunnelResponse(BaseModel):
    funnel: List[FunnelStep]
    total_applications: int
    status_distribution: dict
    completion_rate: float


class AgentMetric(BaseModel):
    agent_name: str
    total_invocations: int
    avg_latency_ms: float
    error_count: int
    error_rate_pct: float


class AgentsResponse(BaseModel):
    agents: List[AgentMetric]


# ── Rate Grids ─────────────────────────────────────────────────────────────────
class RateGridOut(BaseModel):
    bank_code: str
    bank_name: str
    base_rates: dict
    factors: list
    processing_fee_pct: float
    max_ltv_pct: float
    notes: list
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RateGridSaveRequest(BaseModel):
    bank_name: str
    base_rates: dict
    factors: list
    processing_fee_pct: float
    max_ltv_pct: float
    notes: list


# ── Integration Mapper ──────────────────────────────────────────────────────────
class MapperRunRequest(BaseModel):
    bank_name: str
    stage: str
    maruti_schema: str
    bank_schema: str
    maruti_format: str = "JSON"
    bank_format: str = "JSON"


class MapperSaveRequest(BaseModel):
    bank_name: str
    stage: str
    maruti_format: str = "JSON"
    maruti_payload: str = ""
    bank_format: str = "JSON"
    bank_payload: str = ""
    mapping_result: Any


class MapperSaveResponse(BaseModel):
    status: str
    id: str
