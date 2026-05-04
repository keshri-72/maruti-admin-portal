from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_admin_id
from app.models.models import LoanApplication
from app.schemas.schemas import FunnelResponse, FunnelStep, AgentsResponse, AgentMetric

router = APIRouter(prefix="/admin/analytics", tags=["analytics"])

STATUSES = [
    "DRAFT", "IN_PROGRESS", "OFFERS_GENERATED", "OFFER_ACCEPTED",
    "KYC_PENDING", "DOCUMENTS_PENDING", "SUBMITTED_TO_BANK",
    "BANK_PROCESSING", "APPROVED", "CONDITIONALLY_APPROVED",
    "REJECTED", "DISBURSED", "CANCELLED",
]

AGENT_NAMES = [
    "loan_advisor", "offer_optimisation", "document_processing",
    "customer_engagement", "credit_intelligence", "financier_integration",
]


@router.get("/funnel", response_model=FunnelResponse)
def get_funnel(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_id),
):
    total = db.query(LoanApplication).count()

    # Count by step
    funnel_steps = []
    for step in range(1, 13):
        count = db.query(LoanApplication).filter(LoanApplication.current_step >= step).count()
        funnel_steps.append(FunnelStep(
            step=step,
            count=count,
            pct_of_total=round((count / total * 100) if total else 0, 1),
        ))

    # Status distribution
    status_dist = {}
    for st in STATUSES:
        c = db.query(LoanApplication).filter(LoanApplication.status == st).count()
        if c > 0:
            status_dist[st] = c

    disbursed = status_dist.get("DISBURSED", 0)
    completion_rate = round((disbursed / total * 100) if total else 0, 1)

    return FunnelResponse(
        funnel=funnel_steps,
        total_applications=total,
        status_distribution=status_dist,
        completion_rate=completion_rate,
    )


@router.get("/agents", response_model=AgentsResponse)
def get_agents(_: str = Depends(get_current_admin_id)):
    # Static representative metrics — no live agent data in standalone mode
    agents = [
        AgentMetric(agent_name="loan_advisor",         total_invocations=1420, avg_latency_ms=850.0,  error_count=12, error_rate_pct=0.85),
        AgentMetric(agent_name="offer_optimisation",   total_invocations=890,  avg_latency_ms=1200.0, error_count=5,  error_rate_pct=0.56),
        AgentMetric(agent_name="document_processing",  total_invocations=670,  avg_latency_ms=940.0,  error_count=8,  error_rate_pct=1.19),
        AgentMetric(agent_name="customer_engagement",  total_invocations=1050, avg_latency_ms=420.0,  error_count=3,  error_rate_pct=0.29),
        AgentMetric(agent_name="credit_intelligence",  total_invocations=780,  avg_latency_ms=1580.0, error_count=15, error_rate_pct=1.92),
        AgentMetric(agent_name="financier_integration",total_invocations=540,  avg_latency_ms=2100.0, error_count=7,  error_rate_pct=1.30),
    ]
    return AgentsResponse(agents=agents)
