"""Seed the database with admin user, banks, sample applications, and rate grids."""
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.security import hash_password
from app.models.models import AdminUser, BankPartner, LoanApplication, BankRateGrid
from app.config import settings


def _factors(age, income, car, down, govt, mnc, foir, maruti):
    return [
        {"id": "age_young",   "label": "Young Applicant (21–30 yrs)",    "description": "Rate benefit for primary applicant aged 21–30 years",              "defaultValue": age,    "maxValue": 0.25, "step": 0.05},
        {"id": "high_income", "label": "High Income (>₹1.5L/mo)",        "description": "Discount for monthly salary above ₹1.5 lakh (₹18L+ p.a.)",        "defaultValue": income, "maxValue": 0.75, "step": 0.05},
        {"id": "premium_car", "label": "Premium Car (>₹30L)",            "description": "Rate concession for on-road car price above ₹30 lakh",             "defaultValue": car,    "maxValue": 0.50, "step": 0.05},
        {"id": "high_down",   "label": "High Down Payment (≥25%)",       "description": "Discount for down payment of 25% or more of car value",            "defaultValue": down,   "maxValue": 0.50, "step": 0.05},
        {"id": "govt_emp",    "label": "Govt / PSU Employee",            "description": "Concessional rate for government and PSU employees",               "defaultValue": govt,   "maxValue": 0.75, "step": 0.05},
        {"id": "mnc_emp",     "label": "MNC / Listed Co. (Salaried)",    "description": "Discount for salaried employees of MNC or listed company",         "defaultValue": mnc,    "maxValue": 0.50, "step": 0.05},
        {"id": "low_foir",    "label": "Low FOIR (<30%)",                "description": "Benefit for fixed obligation to income ratio below 30%",           "defaultValue": foir,   "maxValue": 0.25, "step": 0.05},
        {"id": "maruti",      "label": "Maruti Loyalty (Repeat Buyer)",  "description": "Repeat Maruti Suzuki customer loyalty discount",                   "defaultValue": maruti, "maxValue": 0.25, "step": 0.05},
    ]


RATE_GRIDS = [
    {
        "bank_code": "HDFC", "bank_name": "HDFC Bank",
        "processing_fee_pct": 0.50, "max_ltv_pct": 90,
        "notes": ["Rate valid for Maruti Suzuki new vehicles only", "Processing fee capped at ₹7,500", "Young applicant (21–30 yrs) benefit: −0.10%", "High down payment (≥25%) benefit: −0.25%"],
        "factors": _factors(0.10, 0.50, 0.25, 0.25, 0.50, 0.25, 0.10, 0.15),
        "base_rates": {
            "800+":    {"12": 8.75, "24": 8.85, "36": 9.00, "48": 9.15, "60": 9.25, "72": 9.40, "84": 9.50},
            "750–799": {"12": 9.00, "24": 9.10, "36": 9.25, "48": 9.40, "60": 9.50, "72": 9.65, "84": 9.75},
            "700–749": {"12": 9.50, "24": 9.65, "36": 9.75, "48": 9.90, "60":10.00, "72":10.15, "84":10.25},
            "650–699": {"12":10.25, "24":10.40, "36":10.50, "48":10.65, "60":10.75, "72":10.90, "84":11.00},
        },
    },
    {
        "bank_code": "ICICI", "bank_name": "ICICI Bank",
        "processing_fee_pct": 0.50, "max_ltv_pct": 90,
        "notes": ["Base rate 9.15% p.a. (ICICI x Maruti, April 2026)", "CIBIL 800+: −0.75% → effective 8.40%", "Best achievable: ~7.90–8.15% (multiple factors stacked)", "FOIR above 50%: application declined", "iMobile pre-approved customers: additional 0.10% off"],
        "factors": _factors(0.10, 0.50, 0.25, 0.25, 0.50, 0.25, 0.10, 0.15),
        "base_rates": {
            "800+":    {"12": 8.40, "24": 8.50, "36": 8.65, "48": 8.75, "60": 8.90, "72": 9.00, "84": 9.15},
            "750–799": {"12": 8.90, "24": 9.00, "36": 9.15, "48": 9.25, "60": 9.40, "72": 9.50, "84": 9.65},
            "700–749": {"12": 9.15, "24": 9.25, "36": 9.40, "48": 9.55, "60": 9.65, "72": 9.80, "84": 9.95},
            "650–699": {"12":10.15, "24":10.30, "36":10.45, "48":10.60, "60":10.75, "72":10.90, "84":11.05},
        },
    },
    {
        "bank_code": "AXIS", "bank_name": "Axis Bank",
        "processing_fee_pct": 0.50, "max_ltv_pct": 85,
        "notes": ["Burgundy & Prestige customers: additional 0.15% off", "Processing fee minimum ₹3,500", "Govt employee benefit: −0.50%"],
        "factors": _factors(0.10, 0.50, 0.25, 0.25, 0.50, 0.25, 0.10, 0.15),
        "base_rates": {
            "800+":    {"12": 8.85, "24": 9.00, "36": 9.10, "48": 9.25, "60": 9.35, "72": 9.50, "84": 9.60},
            "750–799": {"12": 9.10, "24": 9.25, "36": 9.35, "48": 9.50, "60": 9.65, "72": 9.75, "84": 9.90},
            "700–749": {"12": 9.65, "24": 9.75, "36": 9.90, "48":10.05, "60":10.20, "72":10.30, "84":10.45},
            "650–699": {"12":10.45, "24":10.60, "36":10.70, "48":10.85, "60":11.00, "72":11.10, "84":11.25},
        },
    },
    {
        "bank_code": "SBI", "bank_name": "SBI (State Bank of India)",
        "processing_fee_pct": 0.25, "max_ltv_pct": 90,
        "notes": ["Govt/PSU employee benefit: −0.50%", "Salary account holders: 0.05% additional waiver", "Processing fee waived for pre-approved customers", "Zero processing fee on high down payment (≥25%) cases"],
        "factors": _factors(0.10, 0.50, 0.25, 0.30, 0.50, 0.15, 0.10, 0.10),
        "base_rates": {
            "800+":    {"12": 8.65, "24": 8.75, "36": 8.90, "48": 9.00, "60": 9.10, "72": 9.25, "84": 9.35},
            "750–799": {"12": 8.85, "24": 9.00, "36": 9.10, "48": 9.25, "60": 9.35, "72": 9.50, "84": 9.60},
            "700–749": {"12": 9.25, "24": 9.40, "36": 9.55, "48": 9.65, "60": 9.80, "72": 9.90, "84":10.05},
            "650–699": {"12": 9.75, "24": 9.90, "36":10.05, "48":10.15, "60":10.30, "72":10.40, "84":10.55},
        },
    },
    {
        "bank_code": "KOTAK", "bank_name": "Kotak Mahindra Bank",
        "processing_fee_pct": 0.50, "max_ltv_pct": 90,
        "notes": ["811 account holders: additional 0.10% off", "Rate lock for 30 days from sanction", "High income (>₹1.5L/mo): −0.50%"],
        "factors": _factors(0.10, 0.50, 0.25, 0.25, 0.50, 0.25, 0.10, 0.15),
        "base_rates": {
            "800+":    {"12": 8.90, "24": 9.00, "36": 9.15, "48": 9.25, "60": 9.40, "72": 9.50, "84": 9.65},
            "750–799": {"12": 9.15, "24": 9.25, "36": 9.40, "48": 9.55, "60": 9.65, "72": 9.80, "84": 9.90},
            "700–749": {"12": 9.65, "24": 9.80, "36": 9.90, "48":10.05, "60":10.20, "72":10.30, "84":10.45},
            "650–699": {"12":10.40, "24":10.55, "36":10.65, "48":10.80, "60":10.95, "72":11.05, "84":11.20},
        },
    },
    {
        "bank_code": "BAJAJ", "bank_name": "Bajaj Finance",
        "processing_fee_pct": 1.00, "max_ltv_pct": 85,
        "notes": ["Flexible eligibility — self-employed welcome", "Step-up EMI option available", "Bajaj EMI card holders: 0.15% off", "High income benefit: −0.50%"],
        "factors": _factors(0.10, 0.50, 0.20, 0.25, 0.40, 0.20, 0.10, 0.10),
        "base_rates": {
            "800+":    {"12": 9.25, "24": 9.40, "36": 9.55, "48": 9.65, "60": 9.80, "72": 9.95, "84":10.10},
            "750–799": {"12": 9.50, "24": 9.65, "36": 9.80, "48": 9.95, "60":10.10, "72":10.25, "84":10.40},
            "700–749": {"12":10.00, "24":10.15, "36":10.30, "48":10.45, "60":10.60, "72":10.75, "84":10.90},
            "650–699": {"12":10.75, "24":10.90, "36":11.05, "48":11.20, "60":11.40, "72":11.55, "84":11.75},
        },
    },
    {
        "bank_code": "INDUSIND", "bank_name": "IndusInd Bank",
        "processing_fee_pct": 0.75, "max_ltv_pct": 85,
        "notes": ["Pioneer account holders: priority processing", "Doorstep documentation available", "Festive offers applicable Oct–Nov", "Govt/PSU employee benefit: −0.50%"],
        "factors": _factors(0.10, 0.50, 0.25, 0.25, 0.50, 0.25, 0.10, 0.15),
        "base_rates": {
            "800+":    {"12": 9.00, "24": 9.15, "36": 9.25, "48": 9.40, "60": 9.55, "72": 9.65, "84": 9.80},
            "750–799": {"12": 9.25, "24": 9.40, "36": 9.55, "48": 9.65, "60": 9.80, "72": 9.95, "84":10.05},
            "700–749": {"12": 9.75, "24": 9.90, "36":10.00, "48":10.15, "60":10.30, "72":10.45, "84":10.55},
            "650–699": {"12":10.50, "24":10.65, "36":10.80, "48":10.95, "60":11.10, "72":11.25, "84":11.40},
        },
    },
    {
        "bank_code": "PNB", "bank_name": "Punjab National Bank",
        "processing_fee_pct": 0.25, "max_ltv_pct": 90,
        "notes": ["Govt/PSU employee concessional rate: −0.50%", "Zero processing fee on EV loans", "PNB One account holders: additional 0.05% off", "High down payment (≥25%): −0.30%"],
        "factors": _factors(0.10, 0.50, 0.25, 0.30, 0.50, 0.15, 0.10, 0.10),
        "base_rates": {
            "800+":    {"12": 8.70, "24": 8.80, "36": 8.95, "48": 9.05, "60": 9.15, "72": 9.30, "84": 9.40},
            "750–799": {"12": 8.90, "24": 9.05, "36": 9.15, "48": 9.30, "60": 9.40, "72": 9.55, "84": 9.65},
            "700–749": {"12": 9.30, "24": 9.45, "36": 9.60, "48": 9.70, "60": 9.85, "72": 9.95, "84":10.10},
            "650–699": {"12": 9.80, "24": 9.95, "36":10.10, "48":10.20, "60":10.35, "72":10.45, "84":10.60},
        },
    },
    {
        "bank_code": "MAHINDRA", "bank_name": "Mahindra Finance",
        "processing_fee_pct": 1.00, "max_ltv_pct": 85,
        "notes": ["Strong rural & semi-urban reach", "Flexible income documentation norms", "Agri-income customers welcome", "High income (>₹1.5L/mo) benefit: −0.50%"],
        "factors": _factors(0.10, 0.50, 0.20, 0.25, 0.35, 0.15, 0.10, 0.10),
        "base_rates": {
            "800+":    {"12": 9.50, "24": 9.65, "36": 9.80, "48": 9.95, "60":10.10, "72":10.25, "84":10.40},
            "750–799": {"12": 9.75, "24": 9.90, "36":10.05, "48":10.20, "60":10.35, "72":10.50, "84":10.65},
            "700–749": {"12":10.25, "24":10.40, "36":10.55, "48":10.70, "60":10.85, "72":11.00, "84":11.15},
            "650–699": {"12":11.00, "24":11.15, "36":11.30, "48":11.50, "60":11.65, "72":11.85, "84":12.00},
        },
    },
    {
        "bank_code": "SARASWAT", "bank_name": "Saraswat Co-operative Bank",
        "processing_fee_pct": 0.60, "max_ltv_pct": 85,
        "notes": ["Member account holders: 0.10% additional discount", "Salary account discount: 0.05% off", "EV vehicle benefit: −0.20%", "Processing fee minimum ₹2,500"],
        "factors": _factors(0.10, 0.40, 0.20, 0.25, 0.40, 0.20, 0.10, 0.10),
        "base_rates": {
            "800+":    {"12": 8.50, "24": 8.65, "36": 8.80, "48": 8.95, "60": 9.10, "72": 9.25, "84": 9.40},
            "750–799": {"12": 8.90, "24": 9.05, "36": 9.20, "48": 9.35, "60": 9.50, "72": 9.65, "84": 9.80},
            "700–749": {"12": 9.40, "24": 9.55, "36": 9.70, "48": 9.85, "60":10.00, "72":10.15, "84":10.30},
            "650–699": {"12":10.10, "24":10.25, "36":10.40, "48":10.55, "60":10.70, "72":10.85, "84":11.00},
        },
    },
    {
        "bank_code": "AU", "bank_name": "AU Small Finance Bank",
        "processing_fee_pct": 0.75, "max_ltv_pct": 85,
        "notes": ["Applicants with thin credit file accepted", "Self-employed and informal income considered", "Doorstep loan processing available", "High income (>₹1.5L/mo) benefit: −0.40%"],
        "factors": _factors(0.10, 0.40, 0.20, 0.20, 0.35, 0.20, 0.10, 0.10),
        "base_rates": {
            "800+":    {"12": 9.25, "24": 9.40, "36": 9.55, "48": 9.70, "60": 9.85, "72":10.00, "84":10.15},
            "750–799": {"12": 9.60, "24": 9.75, "36": 9.90, "48":10.05, "60":10.20, "72":10.35, "84":10.50},
            "700–749": {"12":10.10, "24":10.25, "36":10.40, "48":10.55, "60":10.70, "72":10.85, "84":11.00},
            "650–699": {"12":10.75, "24":10.90, "36":11.05, "48":11.20, "60":11.40, "72":11.55, "84":11.75},
        },
    },
    {
        "bank_code": "RRB_RJ", "bank_name": "Rajasthan Gramin Bank",
        "processing_fee_pct": 0.30, "max_ltv_pct": 85,
        "notes": ["Rural & semi-urban customers preferred", "Agri-income and KCC holders: priority processing", "Govt/PSU employee benefit: −0.40%", "Low processing fee — no hidden charges"],
        "factors": _factors(0.10, 0.35, 0.15, 0.25, 0.40, 0.10, 0.10, 0.10),
        "base_rates": {
            "800+":    {"12": 9.40, "24": 9.55, "36": 9.70, "48": 9.85, "60":10.00, "72":10.15, "84":10.30},
            "750–799": {"12": 9.65, "24": 9.80, "36": 9.95, "48":10.10, "60":10.25, "72":10.40, "84":10.55},
            "700–749": {"12":10.10, "24":10.25, "36":10.40, "48":10.55, "60":10.70, "72":10.85, "84":11.00},
            "650–699": {"12":10.60, "24":10.75, "36":10.90, "48":11.05, "60":11.20, "72":11.35, "84":11.50},
        },
    },
]


BANKS = [
    dict(code="SBI",       name="State Bank of India",          bank_type="PSU",     base_rate=8.70, best_rate=8.20, min_cibil_score=650, max_foir_pct=50, min_income=15000, processing_fee_pct=0.40, ev_discount_pct=0.25, api_type="SFTP", priority_rank=1,  is_baas_eligible=False),
    dict(code="PNB",       name="Punjab National Bank",          bank_type="PSU",     base_rate=8.90, best_rate=8.40, min_cibil_score=650, max_foir_pct=50, min_income=15000, processing_fee_pct=0.45, ev_discount_pct=0.20, api_type="SFTP", priority_rank=2,  is_baas_eligible=False),
    dict(code="HDFC",      name="HDFC Bank",                     bank_type="PRIVATE", base_rate=8.25, best_rate=7.75, min_cibil_score=700, max_foir_pct=45, min_income=20000, processing_fee_pct=0.50, ev_discount_pct=0.50, api_type="REST", priority_rank=3,  is_baas_eligible=True),
    dict(code="AXIS",      name="Axis Bank",                     bank_type="PRIVATE", base_rate=8.40, best_rate=7.90, min_cibil_score=700, max_foir_pct=45, min_income=18000, processing_fee_pct=0.50, ev_discount_pct=0.40, api_type="REST", priority_rank=4,  is_baas_eligible=True),
    dict(code="ICICI",     name="ICICI Bank",                    bank_type="PRIVATE", base_rate=8.35, best_rate=7.85, min_cibil_score=700, max_foir_pct=45, min_income=20000, processing_fee_pct=0.50, ev_discount_pct=0.45, api_type="REST", priority_rank=5,  is_baas_eligible=True),
    dict(code="INDUSIND",  name="IndusInd Bank",                 bank_type="PRIVATE", base_rate=8.80, best_rate=8.25, min_cibil_score=680, max_foir_pct=48, min_income=18000, processing_fee_pct=0.75, ev_discount_pct=0.30, api_type="REST", priority_rank=6,  is_baas_eligible=False),
    dict(code="KOTAK",     name="Kotak Mahindra Bank",           bank_type="PRIVATE", base_rate=8.60, best_rate=8.10, min_cibil_score=700, max_foir_pct=45, min_income=25000, processing_fee_pct=0.60, ev_discount_pct=0.35, api_type="REST", priority_rank=7,  is_baas_eligible=False),
    dict(code="BAJAJ",     name="Bajaj Finance",                 bank_type="NBFC",    base_rate=9.50, best_rate=8.75, min_cibil_score=650, max_foir_pct=55, min_income=12000, processing_fee_pct=1.00, ev_discount_pct=0.50, api_type="REST", priority_rank=8,  is_baas_eligible=True),
    dict(code="MAHINDRA",  name="Mahindra Finance",              bank_type="NBFC",    base_rate=9.75, best_rate=9.00, min_cibil_score=625, max_foir_pct=55, min_income=10000, processing_fee_pct=1.00, ev_discount_pct=0.25, api_type="REST", priority_rank=9,  is_baas_eligible=False),
    dict(code="SARASWAT",  name="Saraswat Co-operative Bank",   bank_type="PRIVATE", base_rate=9.20, best_rate=8.50, min_cibil_score=660, max_foir_pct=50, min_income=15000, processing_fee_pct=0.60, ev_discount_pct=0.20, api_type="REST", priority_rank=10, is_baas_eligible=False),
    dict(code="AU",        name="AU Small Finance Bank",          bank_type="PRIVATE", base_rate=10.0, best_rate=9.25, min_cibil_score=650, max_foir_pct=55, min_income=12000, processing_fee_pct=0.75, ev_discount_pct=0.20, api_type="REST", priority_rank=11, is_baas_eligible=False),
    dict(code="RRB_RJ",    name="Rajasthan Gramin Bank",         bank_type="PSU",     base_rate=9.90, best_rate=9.40, min_cibil_score=600, max_foir_pct=55, min_income=8000,  processing_fee_pct=0.30, ev_discount_pct=0.10, api_type="SFTP", priority_rank=12, is_baas_eligible=False),
]

VEHICLES = [
    "Swift", "Baleno", "Brezza", "Grand Vitara", "Dzire",
    "Ertiga", "XL6", "Celerio", "WagonR", "Alto K10",
    "Ciaz", "S-Cross", "Jimny", "Fronx", "Invicto",
]

NAMES = [
    "Rajesh Kumar", "Priya Sharma", "Amit Singh", "Deepa Nair", "Suresh Patel",
    "Anjali Mehta", "Vikram Rao", "Kavitha Reddy", "Rahul Gupta", "Pooja Verma",
    "Manoj Tiwari", "Sunita Joshi", "Arun Krishnan", "Meena Pillai", "Ravi Desai",
    "Lakshmi Iyer", "Sanjay Bose", "Geeta Mishra", "Mohan Yadav", "Rekha Pandey",
]

STATUSES = [
    "DRAFT", "IN_PROGRESS", "OFFERS_GENERATED", "OFFER_ACCEPTED",
    "KYC_PENDING", "DOCUMENTS_PENDING", "SUBMITTED_TO_BANK",
    "BANK_PROCESSING", "APPROVED", "CONDITIONALLY_APPROVED",
    "REJECTED", "DISBURSED",
]

BANKS_FOR_APPS = ["HDFC Bank", "Axis Bank", "ICICI Bank", "SBI", "Bajaj Finance", None]
EMP_TYPES = ["SALARIED", "SELF_EMPLOYED", "GOVT_EMPLOYEE", "BUSINESS"]


def seed(db: Session):
    # Admin user
    if not db.query(AdminUser).first():
        admin = AdminUser(
            id=str(uuid.uuid4()),
            email=settings.admin_email,
            hashed_password=hash_password(settings.admin_password),
        )
        db.add(admin)
        print(f"[seed] Created admin: {settings.admin_email}")

    # Banks
    if not db.query(BankPartner).first():
        for b in BANKS:
            db.add(BankPartner(id=str(uuid.uuid4()), **b))
        print(f"[seed] Created {len(BANKS)} banks")

    # Applications (150 samples)
    if not db.query(LoanApplication).first():
        import random
        rng = random.Random(42)

        apps = []
        for i in range(1, 151):
            name = rng.choice(NAMES)
            phone = f"9{rng.randint(100000000, 999999999)}"
            vehicle = rng.choice(VEHICLES)
            status = rng.choice(STATUSES)
            step = STATUSES.index(status) + 1 if status in STATUSES else 1
            loan = rng.randint(3, 15) * 100000
            bank = rng.choice(BANKS_FOR_APPS)
            emp = rng.choice(EMP_TYPES)
            income = rng.randint(20, 150) * 1000
            cibil = rng.choice([650, 680, 700, 720, 750, 780, 800, 820])
            rate = round(rng.uniform(8.25, 10.5), 2)
            tenure = rng.choice([36, 48, 60, 72, 84])
            emi = round(loan * rate / 1200 / (1 - (1 + rate / 1200) ** -tenure), 0)
            days_ago = rng.randint(0, 180)
            created = datetime.now(timezone.utc) - timedelta(days=days_ago)

            apps.append(LoanApplication(
                id=str(uuid.uuid4()),
                application_no=f"APPL-2025-{i:04d}",
                customer_name=name,
                customer_phone=phone,
                email=f"{name.split()[0].lower()}{i}@email.com",
                vehicle_model=vehicle,
                loan_amount=loan,
                status=status,
                current_step=min(step, 12),
                bank_name=bank,
                employment_type=emp,
                monthly_income=income,
                cibil_score=cibil,
                rate_of_interest=rate if status not in ("DRAFT", "IN_PROGRESS") else None,
                emi_amount=emi if status not in ("DRAFT", "IN_PROGRESS") else None,
                tenure_months=tenure if status not in ("DRAFT", "IN_PROGRESS") else None,
                external_ref_id=f"{(bank or 'NA').split()[0].upper()}-{uuid.uuid4().hex[:8].upper()}" if bank and status in ("SUBMITTED_TO_BANK", "BANK_PROCESSING", "APPROVED", "DISBURSED") else None,
                submission_status="UNDER_REVIEW" if status == "SUBMITTED_TO_BANK" else None,
                created_at=created,
            ))

        db.bulk_save_objects(apps)
        print(f"[seed] Created 150 sample applications")

    # Rate grids — upsert per bank so new entries are added without wiping existing
    added = 0
    for g in RATE_GRIDS:
        existing = db.query(BankRateGrid).filter(BankRateGrid.bank_code == g["bank_code"]).first()
        if not existing:
            db.add(BankRateGrid(**g))
            added += 1
            # Sync bank_partners rates from the new grid
            partner = db.query(BankPartner).filter(BankPartner.code == g["bank_code"]).first()
            if partner:
                best_band = g["base_rates"].get("800+", {})
                std_band  = g["base_rates"].get("750–799", {})
                partner.best_rate = float(best_band.get("12", partner.best_rate))
                partner.base_rate = float(std_band.get("60", partner.base_rate))
    if added:
        print(f"[seed] Created {added} rate grids")

    db.commit()
