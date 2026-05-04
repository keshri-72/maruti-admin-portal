# Maruti Finance Admin Console — Complete Build Specification
### For Lovable AI Deployment (April 2026)

> **IMPORTANT**: This is a complete, self-contained spec. Every piece of code, schema, and data is embedded here.  
> The most critical feature is the **Integration Mapper** — an agentic system that calls **Google Gemini (gemini-2.0-flash)** to semantically map fields between Maruti's canonical API and each bank's API format.  
> The Python backend LLM code is provided **verbatim** in Section 8. Do not mock or simplify it.

---

## 1. Project Overview

**Product**: Maruti Finance Admin Console  
**Brand**: Maruti Suzuki Finance / MSIL  
**Brand Color**: `#003A8F` (Maruti deep blue)  
**Admin Login**: `admin@maruti.co.in` / `password`

**Purpose**: Internal admin panel for:
1. Managing 12 bank partner configurations and CIBIL × Tenure rate matrices
2. Tracking 150 sample loan applications through a 7-step journey
3. **AI-powered Integration Mapper** — uses Google Gemini (gemini-2.0-flash) to map Maruti's master schema fields to each bank's API fields

**Architecture**:
- Frontend: React + Vite on port 5000
- Backend: FastAPI on port 8001
- Vite proxy: `/api/*` → `http://localhost:8001`
- DB: SQLite at `backend/admin_portal.db`

---

## 2. Tech Stack

### Frontend
```
react@18, react-dom@18
typescript
vite (port 5000)
tailwindcss
@tanstack/react-query (v5)
zustand + zustand/middleware (persist)
react-router-dom (v6)
lucide-react
sweetalert2
@monaco-editor/react
fast-xml-parser
```

### Backend (requirements.txt)
```
fastapi==0.115.5
uvicorn[standard]==0.32.1
sqlalchemy==2.0.36
python-jose[cryptography]==3.3.0
bcrypt==4.2.1
pydantic-settings==2.6.1
google-generativeai==0.8.3
openai==1.54.4
anthropic==0.39.0
httpx==0.27.2
```

---

## 3. Environment Configuration

### `backend/.env` — CREATE THIS FILE EXACTLY
```env
SECRET_KEY=maruti-admin-secret-key-32chars-production
APP_ENV=development
DEBUG=true
DATABASE_URL=sqlite:///./admin_portal.db
ADMIN_EMAIL=admin@maruti.co.in
ADMIN_PASSWORD=password
LLM_PROVIDER=gemini
GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
LLM_MODEL=gemini-2.0-flash
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30
CORS_ORIGINS=http://localhost:4000,http://localhost:5000,http://localhost:4001
```

> **The Integration Mapper will not work without a valid `GEMINI_API_KEY`.**  
> Add your Google Gemini API key to `GEMINI_API_KEY=` before running. Get it from https://aistudio.google.com/app/apikey  
> `LLM_PROVIDER=gemini` and `LLM_MODEL=gemini-2.0-flash` — use these exact values.

### `backend/app/config.py`
```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    secret_key: str = "dev-secret-key-change-in-production-min-32-chars"
    app_env: str = "development"
    debug: bool = True
    database_url: str = "sqlite:///./admin_portal.db"
    admin_email: str = "admin@maruti.co.in"
    admin_password: str = "password"
    llm_provider: str = "gemini"
    gemini_api_key: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    llm_model: str = "gemini-2.0-flash"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 30
    cors_origins: str = "http://localhost:4000,http://localhost:5000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
```

### `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
})
```

---

## 4. Application Routes

```tsx
// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAdminAuthStore } from './store/adminAuthStore'
import { AdminLayout } from './components/layout/AdminLayout'
import { BankPartners } from './pages/admin/BankPartners'
import { Applications } from './pages/admin/Applications'
import { IntegrationMapper } from './pages/admin/integration-mapper/IntegrationMapper'
import { MapperLogin } from './pages/admin/integration-mapper/MapperLogin'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/login" element={<MapperLogin />} />
      <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/admin/banks" replace />} />
        <Route path="banks" element={<BankPartners />} />
        <Route path="applications" element={<Applications />} />
        <Route path="integration-mapper" element={<IntegrationMapper />} />
      </Route>
    </Routes>
  )
}
```

---

## 5. Auth Store & API Client

### `src/store/adminAuthStore.ts`
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminAuthState {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  adminId: string | null
  email: string | null
  login: (data: { access_token: string; refresh_token: string; admin_id: string; email: string }) => void
  logout: () => void
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      adminId: null,
      email: null,
      login: (data) => set({
        isAuthenticated: true,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        adminId: data.admin_id,
        email: data.email,
      }),
      logout: () => set({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        adminId: null,
        email: null,
      }),
    }),
    { name: 'maruti-admin-auth' }
  )
)
```

### `src/api/admin.ts`
```typescript
import { useAdminAuthStore } from '../store/adminAuthStore'

const BASE = '/api/v1'

async function apiFetch(path: string, options: RequestInit = {}) {
  const { accessToken } = useAdminAuthStore.getState()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const adminApi = {
  login: (email: string, password: string) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getBanks: () => apiFetch('/admin/banks'),

  getApplications: (page = 1, size = 20, status?: string) => {
    const p = new URLSearchParams({ page: String(page), size: String(size) })
    if (status && status !== 'ALL') p.set('status', status)
    return apiFetch(`/admin/applications?${p}`)
  },

  getRateGrids: () => apiFetch('/admin/rate-grids'),

  runMapping: (payload: {
    bank_name: string
    stage: string
    maruti_schema: string
    bank_schema: string
    maruti_format?: string
    bank_format?: string
  }) => apiFetch('/admin/integration-mapper/run', {
    method: 'POST',
    body: JSON.stringify({ maruti_format: 'JSON', bank_format: 'JSON', ...payload }),
  }),

  saveMapping: (payload: {
    bank_name: string
    stage: string
    maruti_format?: string
    maruti_payload?: string
    bank_format?: string
    bank_payload?: string
    mapping_result: unknown
  }) => apiFetch('/admin/integration-mapper/save', {
    method: 'POST',
    body: JSON.stringify({ maruti_format: 'JSON', bank_format: 'JSON', ...payload }),
  }),
}
```

---

## 6. Backend API Endpoints

All protected routes require: `Authorization: Bearer <jwt_token>`

```
GET  /health                                    → { status: "ok" }

POST /api/v1/auth/login                         → { access_token, refresh_token, admin_id, email, is_admin }
POST /api/v1/auth/refresh                       → { access_token }

GET  /api/v1/admin/banks                        → { banks: BankOut[], total: int }
POST /api/v1/admin/banks                        → BankOut
PATCH /api/v1/admin/banks/{id}/toggle           → { bank_id, is_active }
POST /api/v1/admin/banks/{id}/test-connection   → { bank_code, reachable, api_type }

GET  /api/v1/admin/applications                 → { items, total, page, size }
  query params: page=1, size=20, status=IN_PROGRESS|APPROVED|REJECTED|DISBURSED
GET  /api/v1/admin/applications/{id}            → ApplicationDetail

GET  /api/v1/admin/rate-grids                   → RateGridOut[]

POST /api/v1/admin/integration-mapper/run       → LLMMappingResult   ← CALLS OPENAI gpt-4o-mini
POST /api/v1/admin/integration-mapper/save      → { status: "success", id: string }

GET  /api/v1/admin/analytics/funnel             → FunnelResponse
GET  /api/v1/admin/analytics/agents             → AgentsResponse
```

---

## 7. Database Models

```python
# backend/app/models/models.py
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Float, Integer, Text, DateTime, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()
def _now(): return datetime.now(timezone.utc)
def _uuid(): return str(uuid.uuid4())

class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=_now)

class BankPartner(Base):
    __tablename__ = "bank_partners"
    id = Column(String, primary_key=True, default=_uuid)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    bank_type = Column(String, nullable=False, default="PRIVATE")
    is_active = Column(Boolean, default=True)
    is_baas_eligible = Column(Boolean, default=False)
    priority_rank = Column(Integer, default=10)
    base_rate = Column(Float, default=9.0)
    best_rate = Column(Float, default=8.0)
    max_ltv_pct = Column(Float, default=85.0)
    min_cibil_score = Column(Integer, default=650)
    max_foir_pct = Column(Float, default=50.0)
    min_income = Column(Float, default=15000.0)
    processing_fee_pct = Column(Float, default=0.5)
    ev_discount_pct = Column(Float, default=0.0)
    women_discount_pct = Column(Float, default=0.0)
    api_type = Column(String, default="REST")
    logo_url = Column(String, nullable=True)
    tagline = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

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
    employment_type = Column(String, nullable=True)
    monthly_income = Column(Float, nullable=True)
    cibil_score = Column(Integer, nullable=True)
    rate_of_interest = Column(Float, nullable=True)
    emi_amount = Column(Float, nullable=True)
    tenure_months = Column(Integer, nullable=True)
    external_ref_id = Column(String, nullable=True)
    submission_status = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)

class BankRateGrid(Base):
    __tablename__ = "bank_rate_grids"
    bank_code = Column(String(20), primary_key=True)
    bank_name = Column(String, nullable=False)
    base_rates = Column(JSON, nullable=False)
    factors = Column(JSON, nullable=False)
    processing_fee_pct = Column(Float, default=0.5)
    max_ltv_pct = Column(Float, default=85.0)
    notes = Column(JSON, default=list)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)

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
```

---

## 8. Integration Mapper — Backend (THE AGENTIC LLM CODE)

**This is the most critical file. Copy it verbatim.**

```python
# backend/app/api/v1/integration_mapper.py
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_admin_id
from app.models.models import BankIntegrationMapping
from app.schemas.schemas import MapperRunRequest, MapperSaveRequest, MapperSaveResponse
from app.config import settings

router = APIRouter(prefix="/admin/integration-mapper", tags=["integration-mapper"])

SYSTEM_PROMPT = """You are an elite API integration architect specializing in Indian automotive fintech.
Your goal is to achieve 95%+ mapping coverage between Maruti's Master API and various Bank APIs.

CRITICAL INSTRUCTIONS FOR ACCURACY:
1. Deep Traversal: Traverse all nested objects (Header, Body, request, applicant, CustomerData, Financials)
2. Semantic Flattening: If Maruti flat/Bank nested (or vice versa), logically flatten to find matches
3. Industry Context: Map pan_number→pan_no, aadhaar→uid, monthly_income→gross_income, tenure→repayment_period
4. Aggressive Matching: Even if names differ, if they represent the same data point, they MUST be mapped
5. Transform Logic: Identify field transforms (multiply by 100 for paise, format dates, enum mapping)
6. Goal: 100% mapping of REQUIRED Maruti fields

Confidence Scoring:
  - 95-100: Direct semantic equivalent
  - 80-94: Clear match with simple transform
  - 60-79: Probable match with assumptions
  - Below 60: Mark as unmapped

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "integration_summary": {
    "bank": "<bank name>",
    "stage": "<stage>",
    "total_maruti_fields": <int>,
    "total_bank_fields": <int>,
    "mapped": <int>,
    "unmapped_maruti": <int>,
    "transforms_required": <int>,
    "integration_risk": "LOW"|"MEDIUM"|"HIGH",
    "risk_reason": "<one sentence>"
  },
  "mappings": [
    {
      "maruti_field": "<field>",
      "maruti_type": "string|number|integer|boolean|object|array",
      "maruti_required": true|false,
      "maruti_desc": "<description>",
      "bank_field": "<field or nested.path>",
      "bank_type": "string|number|integer|boolean|object|array",
      "bank_required": true|false,
      "bank_desc": "<description>",
      "confidence": <1-100>,
      "match_type": "exact"|"semantic"|"inferred"|"derived",
      "transform": null|"<transform_name>",
      "transform_detail": null|"<explanation>",
      "example": null|"<example_value>",
      "notes": null|"<notes>"
    }
  ],
  "unmapped_maruti_fields": [
    {
      "field": "<field>",
      "type": "<type>",
      "required": true|false,
      "reason": "<why unmapped>",
      "suggestion": "<suggestion>"
    }
  ],
  "unmapped_bank_fields": [
    {
      "field": "<field>",
      "type": "<type>",
      "required": false,
      "likely_source": "<likely source>"
    }
  ],
  "master_data_flags": [
    {
      "field": "<field>",
      "issue": "<issue description>",
      "maruti_values": ["<val1>", "<val2>"],
      "bank_values": ["<val1>", "<val2>"],
      "severity": "LOW"|"MEDIUM"|"HIGH"
    }
  ]
}"""


def _call_llm(bank_name: str, stage: str, maruti_schema: str, bank_schema: str) -> dict:
    user_msg = f"""MARUTI API SCHEMA (stage: {stage}):
{maruti_schema}

BANK: {bank_name}
BANK API SCHEMA (stage: {stage}):
{bank_schema}

Map ALL fields. Return ONLY valid JSON — no markdown fences, no explanations."""

    # LLM_PROVIDER=gemini and LLM_MODEL=gemini-2.0-flash (set in backend/.env)
    provider = settings.llm_provider.lower()

    if provider == "gemini" and settings.gemini_api_key:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(
            model_name=settings.llm_model,   # gemini-2.0-flash
            system_instruction=SYSTEM_PROMPT,
        )
        response = model.generate_content(
            user_msg,
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                max_output_tokens=4096,
            ),
        )
        raw = response.text

    elif provider == "anthropic" and settings.anthropic_api_key:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        msg = client.messages.create(
            model=settings.llm_model if "claude" in settings.llm_model else "claude-haiku-4-5-20251001",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = msg.content[0].text

    elif settings.openai_api_key:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        resp = client.chat.completions.create(
            model=settings.llm_model,
            temperature=0.1,
            max_tokens=4096,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
        )
        raw = resp.choices[0].message.content

    else:
        raise HTTPException(
            status_code=503,
            detail="No LLM API key configured. Set GEMINI_API_KEY= in backend/.env"
        )

    # Strip markdown fences if model wraps response
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw
        raw = raw.rsplit("```", 1)[0]

    return json.loads(raw)


@router.post("/run")
def run_mapping(
    req: MapperRunRequest,
    _: str = Depends(get_current_admin_id),
):
    """
    Receives Maruti schema + Bank schema, calls OpenAI gpt-4o-mini,
    returns structured field mapping result with confidence scores.
    """
    try:
        result = _call_llm(req.bank_name, req.stage, req.maruti_schema, req.bank_schema)
        return result
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"LLM returned invalid JSON: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save", response_model=MapperSaveResponse)
def save_mapping(
    req: MapperSaveRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin_id),
):
    """Upsert mapping by (bank_name, stage)."""
    existing = db.query(BankIntegrationMapping).filter(
        BankIntegrationMapping.bank_name == req.bank_name,
        BankIntegrationMapping.stage == req.stage,
    ).first()

    if existing:
        existing.maruti_format = req.maruti_format
        existing.maruti_payload = req.maruti_payload
        existing.bank_format = req.bank_format
        existing.bank_payload = req.bank_payload
        existing.mapping_result = req.mapping_result
        db.commit()
        return MapperSaveResponse(status="success", id=existing.id)

    mapping = BankIntegrationMapping(
        bank_name=req.bank_name,
        stage=req.stage,
        maruti_format=req.maruti_format,
        maruti_payload=req.maruti_payload,
        bank_format=req.bank_format,
        bank_payload=req.bank_payload,
        mapping_result=req.mapping_result,
    )
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return MapperSaveResponse(status="success", id=mapping.id)
```

### Pydantic Schemas for Integration Mapper

```python
# In backend/app/schemas/schemas.py — add these:

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
```

### LLM Response TypeScript Types

```typescript
interface IntegrationSummary {
  bank: string; stage: string
  total_maruti_fields: number; total_bank_fields: number
  mapped: number; unmapped_maruti: number; transforms_required: number
  integration_risk: 'LOW' | 'MEDIUM' | 'HIGH'; risk_reason: string
}
interface MappingEntry {
  maruti_field: string; maruti_type: string; maruti_required: boolean; maruti_desc: string
  bank_field: string; bank_type: string; bank_required: boolean; bank_desc: string
  confidence: number  // 1–100
  match_type: 'exact' | 'semantic' | 'inferred' | 'derived'
  transform: string | null; transform_detail: string | null
  example: string | null; notes: string | null
}
interface UnmappedMarutiField { field: string; type: string; required: boolean; reason: string; suggestion: string }
interface UnmappedBankField   { field: string; type: string; required: boolean; likely_source: string }
interface MasterDataFlag      { field: string; issue: string; maruti_values: string[]; bank_values: string[]; severity: 'LOW'|'MEDIUM'|'HIGH' }
interface LLMMappingResult {
  integration_summary: IntegrationSummary
  mappings: MappingEntry[]
  unmapped_maruti_fields: UnmappedMarutiField[]
  unmapped_bank_fields: UnmappedBankField[]
  master_data_flags: MasterDataFlag[]
}
```

---

## 9. Integration Mapper — Master Schemas (masterSchemas.ts)

This file is loaded by the frontend and the schemas are passed directly to the backend (and then to the LLM) at runtime.

```typescript
// src/pages/admin/integration-mapper/masterSchemas.ts

export type JourneyStageDef = {
  id: string; label: string; icon: string; description: string
  masterMarutiJson: string; masterMarutiXml: string
  bankSamples: Record<string, string>
}

export const SUPPORTED_BANKS = [
  'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'SBI (State Bank of India)',
  'AU SFB', 'Kotak Mahindra Bank', 'Bajaj Finance', 'IndusInd Bank',
  'Punjab National Bank', 'Mahindra Finance',
]
```

### Maruti Master Schemas (canonical internal format)

**ELIGIBILITY_MASTER** — 20 fields:
```json
{
  "endpoint": "POST /api/v1/eligibility/check",
  "fields": [
    { "name": "applicant_id",              "type": "string",  "required": true,  "description": "Maruti internal customer UUID" },
    { "name": "pan_number",                "type": "string",  "required": true,  "description": "Applicant PAN card number" },
    { "name": "date_of_birth",             "type": "string",  "required": true,  "description": "DOB in YYYY-MM-DD format" },
    { "name": "gender",                    "type": "string",  "required": true,  "description": "MALE | FEMALE | OTHER" },
    { "name": "marital_status",            "type": "string",  "required": false, "description": "SINGLE | MARRIED | DIVORCED" },
    { "name": "employment_type",           "type": "string",  "required": true,  "description": "salaried | self_employed | business_owner | pensioner" },
    { "name": "monthly_income",            "type": "number",  "required": true,  "description": "Gross monthly income in INR" },
    { "name": "existing_emi_obligations",  "type": "number",  "required": false, "description": "Total existing EMIs per month in INR" },
    { "name": "loan_amount_requested",     "type": "number",  "required": true,  "description": "Principal loan amount in INR" },
    { "name": "vehicle_on_road_price",     "type": "number",  "required": true,  "description": "On-road price of vehicle in INR" },
    { "name": "down_payment",              "type": "number",  "required": true,  "description": "Customer down payment in INR" },
    { "name": "tenure_months",             "type": "integer", "required": true,  "description": "Loan tenure in months (12–84)" },
    { "name": "city",                      "type": "string",  "required": true,  "description": "Applicant city name" },
    { "name": "state",                     "type": "string",  "required": true,  "description": "State name e.g. Maharashtra" },
    { "name": "pincode",                   "type": "string",  "required": true,  "description": "6-digit PIN code" },
    { "name": "cibil_score",               "type": "integer", "required": false, "description": "Latest CIBIL score if pre-fetched" },
    { "name": "is_existing_customer",      "type": "boolean", "required": false, "description": "Is this a returning Maruti customer" },
    { "name": "vehicle_category",          "type": "string",  "required": true,  "description": "HATCHBACK | SEDAN | SUV | MUV | EV" },
    { "name": "maruti_dealer_code",        "type": "string",  "required": true,  "description": "MSPIN of originating dealer" },
    { "name": "educational_qualification", "type": "string",  "required": false, "description": "GRADUATE | POST_GRADUATE | DOCTORATE" }
  ]
}
```

**OFFER_MASTER** — 15 fields:
```json
{
  "endpoint": "GET /api/v1/offers/{application_id}",
  "fields": [
    { "name": "application_id",         "type": "string",  "required": true,  "description": "Maruti loan application UUID" },
    { "name": "bank_code",              "type": "string",  "required": true,  "description": "Target bank code e.g. HDFC, ICICI" },
    { "name": "loan_amount",            "type": "number",  "required": true,  "description": "Approved loan amount in INR" },
    { "name": "tenure_months",          "type": "integer", "required": true,  "description": "Tenure in months" },
    { "name": "interest_rate_pa",       "type": "number",  "required": true,  "description": "Annual interest rate %" },
    { "name": "emi_amount",             "type": "number",  "required": true,  "description": "Monthly EMI in INR" },
    { "name": "processing_fee",         "type": "number",  "required": true,  "description": "Processing fee in INR" },
    { "name": "processing_fee_pct",     "type": "number",  "required": false, "description": "Processing fee as % of loan" },
    { "name": "down_payment_required",  "type": "number",  "required": true,  "description": "Minimum down payment in INR" },
    { "name": "ltv_ratio",              "type": "number",  "required": true,  "description": "Loan-to-value ratio %" },
    { "name": "offer_valid_till",       "type": "string",  "required": true,  "description": "Offer expiry in ISO 8601" },
    { "name": "offer_id",               "type": "string",  "required": true,  "description": "Unique offer reference" },
    { "name": "special_scheme_code",    "type": "string",  "required": false, "description": "Promotional scheme if applicable" },
    { "name": "foreclosure_charges_pct","type": "number",  "required": false, "description": "Prepayment penalty %" },
    { "name": "is_baas_eligible",       "type": "boolean", "required": false, "description": "Battery-as-a-Service split loan" }
  ]
}
```

**APPLICATION_MASTER** — 29 fields:
```json
{
  "endpoint": "POST /api/v1/journey/{id}/step",
  "fields": [
    { "name": "application_id",              "type": "string",  "required": true  },
    { "name": "full_name",                   "type": "string",  "required": true  },
    { "name": "father_name",                 "type": "string",  "required": true  },
    { "name": "gender",                      "type": "string",  "required": true  },
    { "name": "date_of_birth",               "type": "string",  "required": true  },
    { "name": "pan_number",                  "type": "string",  "required": true  },
    { "name": "aadhaar_number",              "type": "string",  "required": true  },
    { "name": "mobile_number",               "type": "string",  "required": true  },
    { "name": "email_address",               "type": "string",  "required": false },
    { "name": "current_address_line1",       "type": "string",  "required": true  },
    { "name": "current_address_line2",       "type": "string",  "required": false },
    { "name": "current_city",                "type": "string",  "required": true  },
    { "name": "current_state",               "type": "string",  "required": true  },
    { "name": "current_pincode",             "type": "string",  "required": true  },
    { "name": "residence_type",              "type": "string",  "required": true,  "description": "OWNED|RENTED|COMPANY_PROVIDED|FAMILY_OWNED" },
    { "name": "years_at_current_address",    "type": "integer", "required": false },
    { "name": "employment_type",             "type": "string",  "required": true  },
    { "name": "employer_name",               "type": "string",  "required": false },
    { "name": "employer_address",            "type": "string",  "required": false },
    { "name": "monthly_income",              "type": "number",  "required": true  },
    { "name": "loan_amount",                 "type": "number",  "required": true  },
    { "name": "tenure_months",               "type": "integer", "required": true  },
    { "name": "vehicle_model_code",          "type": "string",  "required": true  },
    { "name": "vehicle_variant",             "type": "string",  "required": true  },
    { "name": "vehicle_colour",              "type": "string",  "required": false },
    { "name": "dealer_code",                 "type": "string",  "required": true  },
    { "name": "offer_id",                    "type": "string",  "required": true  },
    { "name": "consent_given",               "type": "boolean", "required": true  },
    { "name": "bank_account_number",         "type": "string",  "required": true  },
    { "name": "bank_ifsc",                   "type": "string",  "required": true  }
  ]
}
```

**DOCUMENT_MASTER** — 8 fields:
```json
{
  "endpoint": "POST /api/v1/documents/{app_id}/upload",
  "fields": [
    { "name": "application_id",      "type": "string",  "required": true,  "description": "App UUID" },
    { "name": "document_type",       "type": "string",  "required": true,  "description": "PAN|AADHAAR_FRONT|AADHAAR_BACK|PHOTO|INCOME_PROOF|BANK_STATEMENT|FORM16|ITR|ADDRESS_PROOF|VEHICLE_INVOICE|INSURANCE" },
    { "name": "file_content",        "type": "string",  "required": true,  "description": "Base64 encoded file content" },
    { "name": "file_name",           "type": "string",  "required": true,  "description": "Original file name" },
    { "name": "file_mime_type",      "type": "string",  "required": true,  "description": "image/jpeg|image/png|application/pdf" },
    { "name": "file_size_bytes",     "type": "integer", "required": true,  "description": "File size in bytes" },
    { "name": "is_password_protected","type": "boolean","required": false },
    { "name": "document_password",   "type": "string",  "required": false }
  ]
}
```

**STATUS_MASTER** — 3 fields:
```json
{
  "endpoint": "GET /api/v1/journey/{app_id}/bank-status",
  "fields": [
    { "name": "application_id",  "type": "string", "required": true, "description": "Maruti app UUID" },
    { "name": "external_ref_id", "type": "string", "required": true, "description": "Bank-issued reference" },
    { "name": "bank_code",       "type": "string", "required": true, "description": "Bank code" }
  ]
}
```

**DISBURSEMENT_MASTER** — 11 fields:
```json
{
  "endpoint": "POST /api/v1/journey/{app_id}/disbursement-confirm",
  "fields": [
    { "name": "application_id",              "type": "string", "required": true  },
    { "name": "bank_account_number",         "type": "string", "required": true  },
    { "name": "bank_ifsc_code",              "type": "string", "required": true  },
    { "name": "bank_account_name",           "type": "string", "required": true  },
    { "name": "disbursement_amount",         "type": "number", "required": true  },
    { "name": "disbursement_mode",           "type": "string", "required": true,  "description": "NEFT|RTGS|IMPS|DD" },
    { "name": "payee_type",                  "type": "string", "required": true,  "description": "DEALER|CUSTOMER|INSURER" },
    { "name": "vehicle_registration_number", "type": "string", "required": false },
    { "name": "chassis_number",              "type": "string", "required": false },
    { "name": "engine_number",               "type": "string", "required": false },
    { "name": "insurance_policy_number",     "type": "string", "required": false }
  ]
}
```

### Bank Sample Payloads

#### HDFC Bank — `Header/Body` envelope, `snake_case` abbreviated
```typescript
// HDFC_ELIGIBILITY
{
  Header: { msg_id: "HDFC-EL-20260501-001", timestamp: "2026-05-01T10:00:00+05:30", channel_id: "MARUTI_DMS", src_code: "MSIL", api_ver: "v2" },
  Body: { EligibilityRequest: { customer_id: "MSIL-CUST-12345", pan_no: "ABCDE1234F", dob: "15/05/1990", gender: "M", marital_sts: "M", emp_type: "SAL", net_salary: 75000, existing_emi: 12000, loan_amt: 600000, on_road_price: 800000, margin_money: 200000, tenure: 60, city_cd: "MUM", state_cd: "MH", pin_cd: "400001", cibil_scr: 750, existing_cust_flg: "Y", car_segment: "HATCHBACK", dealer_cd: "DL-HDFC-9901", edu_qual: "GRADUATE" } }
}

// HDFC_APPLICATION — nested CustomerData + Financials + VehicleInfo + Consent
{
  Header: { msg_id: "HDFC-APP-20260501-001", channel_id: "MARUTI_DMS", src_code: "MSIL", api_ver: "v2" },
  CustomerData: {
    Personal: { applicant_name: "Rahul Kumar", father_name: "Suresh Kumar", gender_cd: "M", birth_dt: "19900515", marital_sts: "M" },
    Identity: { pan_card: "ABCDE1234F", uid_no: "XXXX-XXXX-1234" },
    Contact: { mobile_no: "9876543210", email_id: "rahul.kumar@example.com" },
    Residence: { addr_ln1: "Flat 101, Sea View Apts", addr_ln2: "Bandra West", city_nm: "Mumbai", state_nm: "Maharashtra", pin_cd: "400050", res_type: "OWNED", stability_yrs: 5 }
  },
  Financials: { occ_type: "SALARIED", employer_nm: "Tech Corp India Pvt Ltd", office_addr: "Andheri East, Mumbai", net_monthly_inc: 75000, loan_amt: 600000, tenure_mths: 60 },
  VehicleInfo: { model_cd: "SWIFT", variant_cd: "VXI", colour_cd: "RED", dealer_cd: "DL-HDFC-9901" },
  Consent: { offer_ref_no: "HDFC-OFF-20260501-8821", consent_flg: "Y", bank_acc_no: "000011112222", bank_ifsc: "HDFC0000123" }
}

// HDFC DOCUMENT: DocUploadRequest.{ hdfc_app_ref, doc_cat, doc_sub_cat, file_nm, mime_type, file_size, file_data, pwd_protected, doc_pwd }
// HDFC STATUS: StatusRequest.{ hdfc_app_ref, partner_app_id, bank_cd }
// HDFC DISBURSEMENT: DisbursementRequest.{ hdfc_app_ref, partner_app_id, payee_acc_no, payee_ifsc, payee_nm, disb_amt, disb_mode, payee_type, veh_reg_no, chassis_no, engine_no, insurance_pol_no }
```

#### ICICI Bank — flat `camelCase`, no envelope
```typescript
// ICICI_ELIGIBILITY
{
  requestId: "MSIL-ICICI-EL-20260501001", timestamp: "2026-05-01T10:00:00+05:30", channelCode: "MARUTI_DMS", sourceSystem: "MSIL",
  eligibilityCheckRequest: { applicantRefId: "MSIL-CUST-12345", pan: "ABCDE1234F", dob: "1990-05-15", gender: "MALE", maritalStatus: "MARRIED", profession: "SALARIED", monthlyIncome: 75000, existingEmiAmount: 12000, loanAmountRequired: 600000, vehicleOnRoadPrice: 800000, downPayment: 200000, tenure: 60, city: "Mumbai", state: "Maharashtra", pincode: "400001", cibilScore: 750, isExistingCustomer: true, vehicleCategory: "HATCHBACK", dealerCode: "MSIL-DLR-9901", educationalQualification: "GRADUATE" }
}

// ICICI_APPLICATION — nested applicantDetails + addressDetails + employmentDetails + loanDetails + vehicleDetails + bankDetails
{
  requestId: "MSIL-ICICI-APP-20260501001", channelCode: "MARUTI_DMS",
  loanApplicationRequest: {
    applicationId: "MSIL-APP-88821",
    applicantDetails: { fullName: "Rahul Kumar", fatherName: "Suresh Kumar", gender: "MALE", dateOfBirth: "1990-05-15", panNumber: "ABCDE1234F", aadhaarNumber: "XXXX-XXXX-1234", mobileNumber: "9876543210", emailId: "rahul.kumar@example.com" },
    addressDetails: { addressLine1: "Flat 101, Sea View Apts", addressLine2: "Bandra West", city: "Mumbai", state: "Maharashtra", pincode: "400050", residenceType: "OWNED", yearsAtAddress: 5 },
    employmentDetails: { employmentType: "SALARIED", employerName: "Tech Corp India Pvt Ltd", employerAddress: "Andheri East, Mumbai", monthlyIncome: 75000 },
    loanDetails: { loanAmount: 600000, tenure: 60, offerId: "ICICI-OFF-2026050188821" },
    vehicleDetails: { modelCode: "SWIFT", variant: "VXI", colour: "Blazing Red", dealerCode: "MSIL-DLR-9901" },
    bankDetails: { accountNumber: "000011112222", ifscCode: "ICIC0000456" },
    consentFlag: true, consentTimestamp: "2026-05-01T10:10:00+05:30"
  }
}
// ICICI DOCUMENT: documentUploadRequest.{ applicationId, iciciAppRef, documentType, documentSubType, fileName, mimeType, fileSizeBytes, fileContent, isPasswordProtected, documentPassword }
// ICICI STATUS: statusInquiryRequest.{ applicationId, iciciReferenceId, bankCode }
// ICICI DISBURSEMENT: disbursementRequest.{ applicationId, iciciReferenceId, beneficiaryAccountNumber, beneficiaryIfscCode, beneficiaryName, disbursementAmount, paymentMode, payeeType, vehicleRegistrationNumber, chassisNumber, engineNumber, insurancePolicyNumber }
```

#### Axis Bank — `camelCase`, `axisRequestId` prefix
```typescript
// AXIS_ELIGIBILITY
{
  axisRequestId: "AXIS-EL-20260501-001", requestTimestamp: "2026-05-01T10:00:00+05:30", channelCode: "MARUTI_DMS", partnerCode: "MSIL",
  eligibilityCheckRequest: { partnerCustomerId: "MSIL-CUST-12345", panNumber: "ABCDE1234F", dateOfBirth: "15-05-1990", gender: "M", maritalStatus: "MARRIED", employmentCategory: "SALARIED", grossMonthlyIncome: 75000, monthlyEmiObligations: 12000, requestedLoanAmount: 600000, vehicleExShowroomPrice: 800000, downPaymentAmount: 200000, loanTenureMonths: 60, applicantCity: "Mumbai", applicantState: "Maharashtra", applicantPincode: "400001", bureauScore: 750, isExistingAxisCustomer: false, vehicleSegment: "HATCHBACK", dealerOutletCode: "MSIL-DLR-9901", educationLevel: "GRADUATE" }
}

// AXIS_APPLICATION — personalInfo + residenceInfo + occupationInfo + loanInfo + vehicleInfo + bankAccountInfo
{
  axisRequestId: "AXIS-APP-20260501-001", channelCode: "MARUTI_DMS", partnerCode: "MSIL",
  autoLoanApplicationRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    personalInfo: { applicantFullName: "Rahul Kumar", fatherOrSpouseName: "Suresh Kumar", genderCode: "M", dob: "1990-05-15", panNo: "ABCDE1234F", aadhaarNo: "XXXXXXXXXXXX", mobileNo: "9876543210", emailAddress: "rahul.kumar@example.com" },
    residenceInfo: { addressLine1: "Flat 101, Sea View Apts", addressLine2: "Bandra West", cityName: "Mumbai", stateName: "Maharashtra", pinCode: "400050", ownershipType: "SELF_OWNED", residingSinceYears: 5 },
    occupationInfo: { employmentType: "SALARIED", organizationName: "Tech Corp India Pvt Ltd", officeAddress: "Andheri East, Mumbai", monthlyNetIncome: 75000 },
    loanInfo: { loanAmountRequested: 600000, repaymentTenure: 60, offerReferenceNumber: "AXIS-OFF-2026050188821" },
    vehicleInfo: { vehicleModelCode: "SWIFT", vehicleVariant: "VXI", preferredColour: "Blazing Red", dealerOutletCode: "MSIL-DLR-9901" },
    bankAccountInfo: { accountNumber: "000011112222", ifscCode: "UTIB0000123" },
    customerConsent: true, consentCapturedAt: "2026-05-01T10:10:00+05:30"
  }
}
```

#### SBI — `snake_case` abbreviated govt-style
```typescript
// SBI_ELIGIBILITY
{
  req_ref_no: "SBI-EL-20260501-001", req_dt_tm: "01-05-2026 10:00:00", chnl_cd: "MARUTI_DMS", src_sys_cd: "MSIL",
  eligibility_req: { cust_ref_no: "MSIL-CUST-12345", pan_no: "ABCDE1234F", birth_date: "15-05-1990", gender_cd: "M", marital_sts_cd: "M", occ_code: "01", gross_inc: 75000, existing_emi_oblg: 12000, loan_amt_req: 600000, on_road_price: 800000, margin_amt: 200000, repayment_mths: 60, city_nm: "Mumbai", state_nm: "Maharashtra", pin_cd: "400001", cibil_scr: 750, existing_cust_flg: "Y", veh_cat_cd: "HATCHBACK", dealer_cd: "MSIL-DLR-9901", edu_qual_cd: "GRD" }
}

// SBI_APPLICATION — personal_dtls + addr_dtls + employ_dtls + loan_dtls + veh_dtls + bank_dtls
{
  req_ref_no: "SBI-APP-20260501-001", chnl_cd: "MARUTI_DMS", src_sys_cd: "MSIL",
  loan_appl_req: {
    appl_ref_no: "MSIL-APP-88821",
    personal_dtls: { appl_nm: "Rahul Kumar", father_nm: "Suresh Kumar", gender_cd: "M", birth_dt: "15051990", pan_no: "ABCDE1234F", uid_no: "XXXXXXXXXXXX", mob_no: "9876543210", email_id: "rahul.kumar@example.com" },
    addr_dtls: { addr_ln1: "Flat 101, Sea View Apts", addr_ln2: "Bandra West", city_nm: "Mumbai", state_nm: "Maharashtra", pin_cd: "400050", res_type_cd: "OWN", stay_dur_yrs: 5 },
    employ_dtls: { occ_cd: "01", org_nm: "Tech Corp India Pvt Ltd", office_addr: "Andheri East, Mumbai", gross_sal: 75000 },
    loan_dtls: { loan_amt: 600000, repayment_mths: 60, offer_ref_no: "SBI-OFF-2026050188821" },
    veh_dtls: { model_cd: "SWIFT", variant_cd: "VXI", colour_nm: "Blazing Red", dealer_cd: "MSIL-DLR-9901" },
    bank_dtls: { acct_no: "000011112222", ifsc_cd: "SBIN0001234" },
    consent_flg: "Y", consent_dt_tm: "01-05-2026 10:10:00"
  }
}
```

#### AU SFB — `camelCase`, `auRequestId` prefix, minimal fields
```typescript
// AUSFB_ELIGIBILITY
{
  auRequestId: "AUSFB-EL-20260501-001", requestDateTime: "2026-05-01T10:00:00+05:30", channelId: "MARUTI_DMS", partnerCode: "MSIL",
  eligibilityRequest: { partnerCustomerId: "MSIL-CUST-12345", panCard: "ABCDE1234F", dateOfBirth: "1990-05-15", gender: "MALE", employmentType: "SALARIED", monthlyGrossIncome: 75000, existingEmiPerMonth: 12000, loanAmountRequired: 600000, vehicleOnRoadPrice: 800000, proposedDownPayment: 200000, loanTenure: 60, city: "Mumbai", state: "Maharashtra", pinCode: "400001", creditScore: 750, vehicleType: "HATCHBACK", dealerCode: "MSIL-DLR-9901" }
}

// AUSFB_APPLICATION — applicantInfo + addressInfo + employmentInfo + loanInfo + vehicleInfo + bankAccountInfo
{
  auRequestId: "AUSFB-APP-20260501-001", channelId: "MARUTI_DMS", partnerCode: "MSIL",
  vehicleLoanApplication: {
    partnerApplicationId: "MSIL-APP-88821",
    applicantInfo: { name: "Rahul Kumar", fatherName: "Suresh Kumar", gender: "MALE", dob: "1990-05-15", pan: "ABCDE1234F", aadhaar: "XXXXXXXXXXXX", mobile: "9876543210", email: "rahul.kumar@example.com" },
    addressInfo: { line1: "Flat 101, Sea View Apts", city: "Mumbai", state: "Maharashtra", pincode: "400050", residenceOwnership: "OWNED" },
    employmentInfo: { category: "SALARIED", employerName: "Tech Corp India Pvt Ltd", monthlyIncome: 75000 },
    loanInfo: { amount: 600000, tenure: 60, auOfferRef: "AUSFB-OFF-2026050188821" },
    vehicleInfo: { model: "SWIFT", variant: "VXI", dealerCode: "MSIL-DLR-9901" },
    bankAccountInfo: { accountNo: "000011112222", ifscCode: "AUBL0002083" },
    consent: true, consentTimestamp: "2026-05-01T10:10:00+05:30"
  }
}
```

#### Kotak Mahindra Bank — `camelCase`, `kotakRequestId` prefix
```typescript
// KOTAK_APPLICATION — personalDetails + residentialDetails + professionalDetails + loanParameters + vehicleParameters + repaymentBankDetails
{
  kotakRequestId: "KOTAK-APP-20260501-001", channelCode: "MARUTI_DMS", partnerIdentifier: "MSIL",
  autoLoanApplicationPayload: {
    partnerAppId: "MSIL-APP-88821",
    personalDetails: { customerName: "Rahul Kumar", fatherSpouseName: "Suresh Kumar", gender: "MALE", dob: "15/05/1990", panNo: "ABCDE1234F", aadhaarNo: "XXXXXXXXXXXX", contactNumber: "9876543210", emailAddress: "rahul.kumar@example.com" },
    residentialDetails: { houseNo: "Flat 101, Sea View Apts", streetLocality: "Bandra West", cityName: "Mumbai", stateName: "Maharashtra", postalCode: "400050", accommodationType: "OWNED", stayDurationYears: 5 },
    professionalDetails: { employmentStatus: "SALARIED", companyName: "Tech Corp India Pvt Ltd", companyAddress: "Andheri East, Mumbai", monthlyTakeHome: 75000 },
    loanParameters: { loanAmount: 600000, repaymentPeriod: 60, kotakOfferRefId: "KOTAK-OFF-2026050188821" },
    vehicleParameters: { modelCode: "SWIFT", variantCode: "VXI", colorPreference: "Blazing Red", dealerCode: "MSIL-DLR-9901" },
    repaymentBankDetails: { accountNumber: "000011112222", ifscCode: "KKBK0001234" },
    consentProvided: true, consentCapturedAt: "2026-05-01T10:10:00+05:30"
  }
}
```

#### Bajaj Finance — `camelCase`, `bflRequestId`, `productType: "AUTO_LOAN"`
```typescript
// BAJAJ_APPLICATION — customerDetails + addressDetails + employmentDetails + loanDetails + assetDetails + disbursementBankDetails
{
  bflRequestId: "BFL-APP-20260501-001", channel: "MARUTI_DMS", partnerCode: "MSIL", productType: "AUTO_LOAN",
  loanApplicationRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    customerDetails: { name: "Rahul Kumar", fatherName: "Suresh Kumar", gender: "M", dob: "15/05/1990", pan: "ABCDE1234F", aadhaar: "XXXXXXXXXXXX", mobile: "9876543210", email: "rahul.kumar@example.com" },
    addressDetails: { address1: "Flat 101, Sea View Apts", address2: "Bandra West", city: "Mumbai", state: "Maharashtra", pincode: "400050", residenceType: "OWNED", residingYears: 5 },
    employmentDetails: { employmentCategory: "SALARIED", organizationName: "Tech Corp India Pvt Ltd", organizationAddress: "Andheri East, Mumbai", netMonthlyIncome: 75000 },
    loanDetails: { loanAmount: 600000, tenure: 60, bflOfferId: "BFL-OFF-2026050188821" },
    assetDetails: { modelCode: "SWIFT", variant: "VXI", color: "Blazing Red", dealerCode: "MSIL-DLR-9901" },
    disbursementBankDetails: { accountNo: "000011112222", ifscCode: "HDFC0000123" },
    customerConsent: true, consentTimestamp: "2026-05-01T10:10:00+05:30"
  }
}
// Note: Bajaj uses "assetCost" not "on_road_price"; has both flatRoi and reducingRoi in offer response
```

#### IndusInd Bank — `camelCase`, `indusRequestId`, `sourceChannel`
```typescript
// INDUSIND_APPLICATION — applicantData + residenceData + employmentData + loanData + vehicleData + bankAccountData
{
  indusRequestId: "INDUS-APP-20260501-001", sourceChannel: "MARUTI_DMS", partnerCode: "MSIL",
  vehicleLoanRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    applicantData: { applicantName: "Rahul Kumar", fatherName: "Suresh Kumar", genderCode: "M", birthDate: "1990-05-15", panCardNo: "ABCDE1234F", aadhaarNo: "XXXXXXXXXXXX", mobileNumber: "9876543210", emailId: "rahul.kumar@example.com" },
    residenceData: { addressLine1: "Flat 101, Sea View Apts", addressLine2: "Bandra West", city: "Mumbai", state: "Maharashtra", pinCode: "400050", propertyOwnership: "OWNED", yearsAtAddress: 5 },
    employmentData: { employmentClassification: "SALARIED", employerName: "Tech Corp India Pvt Ltd", workAddress: "Andheri East, Mumbai", takeHomeSalary: 75000 },
    loanData: { requestedAmount: 600000, repaymentMonths: 60, indusOfferRefId: "INDUS-OFF-2026050188821" },
    vehicleData: { vehicleModel: "SWIFT", vehicleVariant: "VXI", vehicleColour: "Blazing Red", dealerCode: "MSIL-DLR-9901" },
    bankAccountData: { accountNumber: "000011112222", ifscCode: "INDB0000123" },
    consentGiven: true, consentRecordedAt: "2026-05-01T10:10:00+05:30"
  }
}
// IndusInd uses: creditBureauScore, vehicleOnRoadCost, initialContribution, loanDurationMonths
```

#### Punjab National Bank — `snake_case` abbreviated PSB
```typescript
// PNB_APPLICATION — personal_info + addr_info + emp_info + loan_info + veh_info + bank_info
{
  req_id: "PNB-APP-20260501-001", req_dt: "01/05/2026", req_tm: "10:10:00", src_sys: "MARUTI_DMS", partner_cd: "MSIL",
  loan_appl: {
    appl_no: "MSIL-APP-88821",
    personal_info: { appl_nm: "Rahul Kumar", father_nm: "Suresh Kumar", gender: "M", dob: "15051990", pan_no: "ABCDE1234F", aadhaar_no: "XXXXXXXXXXXX", mob_no: "9876543210", email: "rahul.kumar@example.com" },
    addr_info: { addr1: "Flat 101, Sea View Apts", addr2: "Bandra West", city: "Mumbai", state: "Maharashtra", pincode: "400050", house_own_sts: "OWNED", stay_yrs: 5 },
    emp_info: { emp_type_cd: "SL", emp_org_nm: "Tech Corp India Pvt Ltd", emp_addr: "Andheri East, Mumbai", grs_salary: 75000 },
    loan_info: { loan_amt: 600000, tenure_mths: 60, offer_no: "PNB-OFF-2026050188821" },
    veh_info: { model_cd: "SWIFT", variant_cd: "VXI", colour: "Blazing Red", dealer_cd: "MSIL-DLR-9901" },
    bank_info: { acct_no: "000011112222", ifsc_cd: "PUNB0001234" },
    consent_flg: "Y", consent_dt_tm: "01/05/2026 10:10:00"
  }
}
// PNB uses: emp_type_cd "SL" for SALARIED, monthly_grs_inc, running_emi_amt
```

#### Mahindra Finance — `camelCase`, `mmfslRequestId`, `productCode: "VHL"`
```typescript
// MAHINDRA_APPLICATION — applicantDetails + addressDetails + incomeDetails + financeDetails + vehicleDetails + repaymentDetails
{
  mmfslRequestId: "MMFSL-APP-20260501-001", channelCode: "MARUTI_DMS", dealerPartnerCode: "MSIL", productCode: "VHL",
  loanApplicationRequest: {
    partnerApplicationId: "MSIL-APP-88821",
    applicantDetails: { applicantName: "Rahul Kumar", fatherName: "Suresh Kumar", gender: "M", dob: "15-05-1990", pan: "ABCDE1234F", aadhaarNo: "XXXXXXXXXXXX", mobileNo: "9876543210", emailId: "rahul.kumar@example.com" },
    addressDetails: { houseAddress1: "Flat 101, Sea View Apts", houseAddress2: "Bandra West", districtCity: "Mumbai", stateName: "Maharashtra", pinCode: "400050", houseOwnershipType: "OWNED", yearsAtAddress: 5 },
    incomeDetails: { occupationType: "SALARIED", employerName: "Tech Corp India Pvt Ltd", officeAddress: "Andheri East, Mumbai", grossMonthlyIncome: 75000 },
    financeDetails: { financeAmount: 600000, repaymentTenure: 60, mmfslOfferRef: "MMFSL-OFF-2026050188821" },
    vehicleDetails: { modelCode: "SWIFT", variantCode: "VXI", colorCode: "RED", dealerCode: "MSIL-DLR-9901" },
    repaymentDetails: { bankAccountNo: "000011112222", bankIfscCode: "MAHB0001234" },
    customerConsentFlag: true, consentDateTime: "2026-05-01T10:10:00+05:30"
  }
}
// Mahindra uses: existingEmiLiability, vehicleLoanRequired (not loan_amount), ownFunding, financierCode: "MMFSL"
```

### Journey Stage Definitions Export

```typescript
export const JOURNEY_STAGES: JourneyStageDef[] = [
  {
    id: 'eligibility_check', label: 'Eligibility Check', icon: '🔍',
    description: 'Pre-qualification: income, CIBIL, FOIR check before generating offers',
    masterMarutiJson: ELIGIBILITY_MASTER, masterMarutiXml: '',
    bankSamples: {
      'HDFC Bank': HDFC_ELIGIBILITY, 'ICICI Bank': ICICI_ELIGIBILITY,
      'Axis Bank': AXIS_ELIGIBILITY, 'SBI (State Bank of India)': SBI_ELIGIBILITY,
      'AU SFB': AUSFB_ELIGIBILITY, 'Kotak Mahindra Bank': KOTAK_ELIGIBILITY,
      'Bajaj Finance': BAJAJ_ELIGIBILITY, 'IndusInd Bank': INDUSIND_ELIGIBILITY,
      'Punjab National Bank': PNB_ELIGIBILITY, 'Mahindra Finance': MAHINDRA_ELIGIBILITY,
    }
  },
  {
    id: 'offer_generation', label: 'Offer Generation', icon: '💰',
    description: 'Rate, EMI, tenure offer from bank after eligibility approval',
    masterMarutiJson: OFFER_MASTER, masterMarutiXml: '',
    bankSamples: { /* same 10 banks, OFFER payloads */ }
  },
  {
    id: 'loan_application', label: 'Loan Application', icon: '📋',
    description: 'Full applicant details, vehicle info, dealer submission',
    masterMarutiJson: APPLICATION_MASTER, masterMarutiXml: '',
    bankSamples: { /* same 10 banks, APPLICATION payloads */ }
  },
  {
    id: 'document_upload', label: 'Document Upload', icon: '📎',
    description: 'KYC, income proof, vehicle documents upload to bank',
    masterMarutiJson: DOCUMENT_MASTER, masterMarutiXml: '',
    bankSamples: { /* same 10 banks, DOCUMENT payloads */ }
  },
  {
    id: 'status_polling', label: 'Status Polling', icon: '🔄',
    description: 'Poll bank LOS for application status updates',
    masterMarutiJson: STATUS_MASTER, masterMarutiXml: '',
    bankSamples: { /* same 10 banks, STATUS payloads */ }
  },
  {
    id: 'disbursement', label: 'Disbursement', icon: '🏦',
    description: 'Initiate loan disbursement to dealer or customer',
    masterMarutiJson: DISBURSEMENT_MASTER, masterMarutiXml: '',
    bankSamples: { /* same 10 banks, DISBURSEMENT payloads */ }
  },
]
```

---

## 10. Integration Mapper — Frontend Component Spec

### IntegrationMapper.tsx — State & Layout

```typescript
// State
const [selectedBank, setSelectedBank] = useState('')
const [selectedStage, setSelectedStage] = useState('')
const [marutiPayload, setMarutiPayload] = useState('')
const [bankPayload, setBankPayload] = useState('')
const [mappingResult, setMappingResult] = useState<LLMMappingResult | null>(null)
const [isRunning, setIsRunning] = useState(false)
const [isSaving, setIsSaving] = useState(false)

// Auto-populate schemas when bank + stage selected:
useEffect(() => {
  if (!selectedBank || !selectedStage) return
  const stage = JOURNEY_STAGES.find(s => s.id === selectedStage)
  if (stage) {
    setMarutiPayload(stage.masterMarutiJson)
    setBankPayload(stage.bankSamples[selectedBank] || '')
  }
}, [selectedBank, selectedStage])
```

**Layout**: 2-column (config/Maruti | bank/run). When result exists → 3-column with results panel on right.

**Run Mapping button handler**:
```typescript
const handleRunMapping = async () => {
  setIsRunning(true)
  try {
    const result = await adminApi.runMapping({
      bank_name: selectedBank,
      stage: selectedStage,
      maruti_schema: marutiPayload,
      bank_schema: bankPayload,
    })
    setMappingResult(result)
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Mapping Failed', text: err.message })
  } finally {
    setIsRunning(false)
  }
}
```

**Save handler**:
```typescript
const handleSave = async () => {
  setIsSaving(true)
  try {
    await adminApi.saveMapping({
      bank_name: selectedBank,
      stage: selectedStage,
      maruti_payload: marutiPayload,
      bank_payload: bankPayload,
      mapping_result: mappingResult,
    })
    Swal.fire({ icon: 'success', title: 'Saved', text: 'Mapping saved to database' })
  } finally {
    setIsSaving(false)
  }
}
```

**Empty State** (animated orbital system — shown before any result):
```tsx
// Inject these CSS keyframes via <style> tag:
// @keyframes im-orbit1  { from { transform: rotate(0deg) }   to { transform: rotate(360deg) } }
// @keyframes im-orbit2  { from { transform: rotate(0deg) }   to { transform: rotate(-360deg) } }
// @keyframes im-orbit3  { from { transform: rotate(0deg) }   to { transform: rotate(360deg) } }
// @keyframes im-orbit4  { from { transform: rotate(0deg) }   to { transform: rotate(-360deg) } }
// @keyframes im-float   { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
// @keyframes im-glow    { 0%,100% { box-shadow: 0 0 32px 8px #3b82f640 } 50% { box-shadow: 0 0 48px 16px #6366f150 } }
// @keyframes im-r1      { from { transform: rotate(0deg) }   to { transform: rotate(360deg) } }
// @keyframes im-r2      { from { transform: rotate(0deg) }   to { transform: rotate(-360deg) } }

// Timings: orbit1=8s, orbit2=13s, orbit3=6s, orbit4=17s, float=4s, glow=3s, r1=7s, r2=11s

// Center orb: 82×82px circle
//   background: radial-gradient(circle at 30% 30%, #1d4ed8, #003A8F, #312e81)
//   animation: im-float 4s ease-in-out infinite, im-glow 3s ease-in-out infinite

// 4 orbiting nodes at radii 80px, 115px, 50px, 140px using im-orbit1/2/3/4
// Each node: small circle 24px with icon (Building2, Settings, Zap, Shield from lucide-react)
// Dashed ring circles for orbit paths

// Text below: "Ready to Analyze" h2, subtitle p, step chips "1→Select 2→Configure 3→Map"
```

### MappingResults.tsx — Component Spec

**SummaryBar**: 6 stat cards:
- Total Maruti Fields (blue), Total Bank Fields (slate), Mapped (green), Unmapped Maruti (orange if >0 else gray), Transforms Required (purple), Integration Risk (green/amber/red pill)
- Coverage bar: `width: ${(summary.mapped / summary.total_maruti_fields * 100).toFixed(0)}%` with gradient fill

**4 Tabs**: Mapped Fields | Unmapped | Data Flags | Payload Preview

**MappingRow** (each item in `mappings[]`):
```
[maruti_field]  →  [bank_field]   [confidence: 92]  [semantic]
↓ expand: transform_detail, example, notes
↓ hover: [Edit] [Remove] buttons
```

Confidence badge colors: ≥95=emerald, 80–94=blue, 60–79=amber, <60=red

**EditMappingForm** (inline expand on click Edit):
- Editable: bank_field, confidence (number), match_type (select), transform (text), transform_detail (textarea), notes (textarea)
- Save → update `result.mappings[i]`, call `onEdit(updatedResult)`

**ManualMapRow** (for each item in `unmapped_maruti_fields[]`):
- Shows field, type badge, required badge, reason, suggestion
- "Map Manually" → inline form: bank_field (autocomplete from flattenKeys), match_type, confidence=80, transform
- "Add" → move to mappings[], call onEdit

**AddMappingForm**: "+ Add Mapping" button at bottom of Mapped tab

**PayloadPreview**: dual panel — Maruti fields list (left) + Monaco read-only JSON (right)

**`flattenKeys` utility**:
```typescript
function flattenKeys(json: string, prefix = ''): string[] {
  try {
    const obj = JSON.parse(json)
    const keys: string[] = []
    function walk(o: unknown, p: string) {
      if (o && typeof o === 'object' && !Array.isArray(o)) {
        for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
          const full = p ? `${p}.${k}` : k
          keys.push(full)
          walk(v, full)
        }
      }
    }
    walk(obj, prefix)
    return keys
  } catch { return [] }
}
```

---

## 11. Bank Rate Matrix Data

### Types
```typescript
// src/pages/admin/rateRulesData.ts
export type CibilBand = '800+' | '750–799' | '700–749' | '650–699'
export type TenureMonth = 12 | 24 | 36 | 48 | 60 | 72 | 84
export type RateGrid = Record<CibilBand, Record<TenureMonth, number>>
export const CIBIL_BANDS: CibilBand[] = ['800+', '750–799', '700–749', '650–699']
export const TENURE_OPTIONS: TenureMonth[] = [12, 24, 36, 48, 60, 72, 84]
```

### 8 Universal Factors
```typescript
// factors(ageYoung, highIncome, premiumCar, highDown, govtEmp, mncEmp, lowFoir, maruti)
// maxValues: [0.25, 0.75, 0.50, 0.50, 0.75, 0.50, 0.25, 0.25]
ids: ['age_young','high_income','premium_car','high_down','govt_emp','mnc_emp','low_foir','maruti']
```

### 11 Bank Rate Grids (base_rates: CIBIL band → tenure → rate %)

| Bank | Code | Type | Fee% | LTV% | Factors (8 values) |
|------|------|------|------|------|--------------------|
| HDFC Bank | HDFC | PRIVATE | 0.50 | 90 | 0.10,0.50,0.25,0.25,0.50,0.25,0.10,0.15 |
| ICICI Bank | ICICI | PRIVATE | 0.50 | 90 | 0.10,0.50,0.25,0.25,0.50,0.25,0.10,0.15 |
| Axis Bank | AXIS | PRIVATE | 0.50 | 85 | 0.10,0.50,0.25,0.25,0.50,0.25,0.10,0.15 |
| SBI | SBI | PSU | 0.25 | 90 | 0.10,0.50,0.25,0.30,0.50,0.15,0.10,0.10 |
| Kotak | KOTAK | PRIVATE | 0.50 | 90 | 0.10,0.50,0.25,0.25,0.50,0.25,0.10,0.15 |
| Bajaj Finance | BAJAJ | NBFC | 1.00 | 85 | 0.10,0.50,0.20,0.25,0.40,0.20,0.10,0.10 |
| IndusInd | INDUSIND | PRIVATE | 0.75 | 85 | 0.10,0.50,0.25,0.25,0.50,0.25,0.10,0.15 |
| PNB | PNB | PSU | 0.25 | 90 | 0.10,0.50,0.25,0.30,0.50,0.15,0.10,0.10 |
| Mahindra Finance | MAHINDRA | NBFC | 1.00 | 85 | 0.10,0.50,0.20,0.25,0.35,0.15,0.10,0.10 |
| Saraswat Co-op Bank | SARASWAT | PRIVATE | 0.60 | 85 | 0.10,0.40,0.20,0.25,0.40,0.20,0.10,0.10 |
| AU Small Finance Bank | AU | SFB | 0.75 | 85 | 0.10,0.40,0.20,0.20,0.35,0.20,0.10,0.10 |
| Rajasthan Gramin Bank | RRB_RJ | PSU | 0.30 | 85 | 0.10,0.35,0.15,0.25,0.40,0.10,0.10,0.10 |

**Rate grid values** (format: 800+ | 750–799 | 700–749 | 650–699, each as 12/24/36/48/60/72/84):

```
HDFC:     8.75/8.85/9.00/9.15/9.25/9.40/9.50 | 9.00/9.10/9.25/9.40/9.50/9.65/9.75 | 9.50/9.65/9.75/9.90/10.00/10.15/10.25 | 10.25/10.40/10.50/10.65/10.75/10.90/11.00
ICICI:    8.40/8.50/8.65/8.75/8.90/9.00/9.15 | 8.90/9.00/9.15/9.25/9.40/9.50/9.65 | 9.15/9.25/9.40/9.55/9.65/9.80/9.95  | 10.15/10.30/10.45/10.60/10.75/10.90/11.05
AXIS:     8.85/9.00/9.10/9.25/9.35/9.50/9.60 | 9.10/9.25/9.35/9.50/9.65/9.75/9.90 | 9.65/9.75/9.90/10.05/10.20/10.30/10.45 | 10.45/10.60/10.70/10.85/11.00/11.10/11.25
SBI:      8.65/8.75/8.90/9.00/9.10/9.25/9.35 | 8.85/9.00/9.10/9.25/9.35/9.50/9.60 | 9.25/9.40/9.55/9.65/9.80/9.90/10.05  | 9.75/9.90/10.05/10.15/10.30/10.40/10.55
KOTAK:    8.90/9.00/9.15/9.25/9.40/9.50/9.65 | 9.15/9.25/9.40/9.55/9.65/9.80/9.90 | 9.65/9.80/9.90/10.05/10.20/10.30/10.45 | 10.40/10.55/10.65/10.80/10.95/11.05/11.20
BAJAJ:    9.25/9.40/9.55/9.65/9.80/9.95/10.10 | 9.50/9.65/9.80/9.95/10.10/10.25/10.40 | 10.00/10.15/10.30/10.45/10.60/10.75/10.90 | 10.75/10.90/11.05/11.20/11.40/11.55/11.75
INDUSIND: 9.00/9.15/9.25/9.40/9.55/9.65/9.80 | 9.25/9.40/9.55/9.65/9.80/9.95/10.05 | 9.75/9.90/10.00/10.15/10.30/10.45/10.55 | 10.50/10.65/10.80/10.95/11.10/11.25/11.40
PNB:      8.70/8.80/8.95/9.05/9.15/9.30/9.40 | 8.90/9.05/9.15/9.30/9.40/9.55/9.65 | 9.30/9.45/9.60/9.70/9.85/9.95/10.10  | 9.80/9.95/10.10/10.20/10.35/10.45/10.60
MAHINDRA: 9.50/9.65/9.80/9.95/10.10/10.25/10.40 | 9.75/9.90/10.05/10.20/10.35/10.50/10.65 | 10.25/10.40/10.55/10.70/10.85/11.00/11.15 | 11.00/11.15/11.30/11.50/11.65/11.85/12.00
SARASWAT: 8.50/8.65/8.80/8.95/9.10/9.25/9.40 | 8.90/9.05/9.20/9.35/9.50/9.65/9.80 | 9.40/9.55/9.70/9.85/10.00/10.15/10.30 | 10.10/10.25/10.40/10.55/10.70/10.85/11.00
AU:       9.25/9.40/9.55/9.70/9.85/10.00/10.15 | 9.60/9.75/9.90/10.05/10.20/10.35/10.50 | 10.10/10.25/10.40/10.55/10.70/10.85/11.00 | 10.75/10.90/11.05/11.20/11.40/11.55/11.75
RRB_RJ:   9.40/9.55/9.70/9.85/10.00/10.15/10.30 | 9.65/9.80/9.95/10.10/10.25/10.40/10.55 | 10.10/10.25/10.40/10.55/10.70/10.85/11.00 | 10.60/10.75/10.90/11.05/11.20/11.35/11.50
```

### findRateRule (CRITICAL — prevents ICICI showing HDFC rate)
```typescript
const GENERIC_WORDS = new Set(['bank', 'finance', 'small', 'india', 'national', 'gramin', 'cooperative'])
function findRateRule(code: string, name: string) {
  const c = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const n = name.toLowerCase()
  return BANK_RATE_RULES.find(r => {
    const rc = r.bank_code.replace(/[^A-Z0-9]/g, '')
    return (
      c === rc || c.startsWith(rc) || rc.startsWith(c) ||
      n.includes(r.bank_code.toLowerCase()) ||
      r.bank_name.toLowerCase().split(' ').some(w => w.length > 4 && !GENERIC_WORDS.has(w) && n.includes(w))
    )
  })
}
```

### Rate color coding
```typescript
export function rateToColor(rate: number) {
  if (rate < 9.00)  return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
  if (rate < 9.50)  return { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200' }
  if (rate < 10.00) return { bg: 'bg-lime-50',     text: 'text-lime-700',   border: 'border-lime-200' }
  if (rate < 10.50) return { bg: 'bg-amber-50',    text: 'text-amber-700',  border: 'border-amber-200' }
  if (rate < 11.00) return { bg: 'bg-orange-50',   text: 'text-orange-700', border: 'border-orange-200' }
  return                    { bg: 'bg-red-50',      text: 'text-red-700',    border: 'border-red-200' }
}

export function calcEMI(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (!principal || !annualRatePct || !tenureMonths) return 0
  const r = annualRatePct / 12 / 100
  return Math.round((principal * r * Math.pow(1+r, tenureMonths)) / (Math.pow(1+r, tenureMonths) - 1))
}
```

---

## 12. Seed Data

### `backend/app/seed.py`
```python
import bcrypt
from app.models.models import AdminUser, BankPartner, BankRateGrid, LoanApplication
from sqlalchemy.orm import Session

BANK_PARTNERS = [
  { "code": "HDFC",     "name": "HDFC Bank",                 "bank_type": "PRIVATE", "best_rate": 8.75, "base_rate": 9.50, "max_ltv_pct": 90, "min_cibil_score": 700, "max_foir_pct": 50, "min_income": 25000, "processing_fee_pct": 0.50, "ev_discount_pct": 0.25, "women_discount_pct": 0.10, "is_baas_eligible": False, "priority_rank": 1,  "tagline": "India's largest private bank" },
  { "code": "ICICI",    "name": "ICICI Bank",                 "bank_type": "PRIVATE", "best_rate": 8.40, "base_rate": 9.40, "max_ltv_pct": 90, "min_cibil_score": 700, "max_foir_pct": 50, "min_income": 25000, "processing_fee_pct": 0.50, "ev_discount_pct": 0.30, "women_discount_pct": 0.10, "is_baas_eligible": True,  "priority_rank": 2,  "tagline": "iLens digital auto loan" },
  { "code": "AXIS",     "name": "Axis Bank",                  "bank_type": "PRIVATE", "best_rate": 8.85, "base_rate": 9.65, "max_ltv_pct": 85, "min_cibil_score": 700, "max_foir_pct": 50, "min_income": 25000, "processing_fee_pct": 0.50, "ev_discount_pct": 0.25, "women_discount_pct": 0.10, "is_baas_eligible": False, "priority_rank": 3,  "tagline": "ETB customers get best rates" },
  { "code": "SBI",      "name": "SBI (State Bank of India)",  "bank_type": "PSU",     "best_rate": 8.65, "base_rate": 9.35, "max_ltv_pct": 90, "min_cibil_score": 650, "max_foir_pct": 55, "min_income": 15000, "processing_fee_pct": 0.25, "ev_discount_pct": 0.50, "women_discount_pct": 0.25, "is_baas_eligible": False, "priority_rank": 4,  "tagline": "Trusted for 70+ years" },
  { "code": "KOTAK",    "name": "Kotak Mahindra Bank",        "bank_type": "PRIVATE", "best_rate": 8.90, "base_rate": 9.65, "max_ltv_pct": 90, "min_cibil_score": 700, "max_foir_pct": 50, "min_income": 30000, "processing_fee_pct": 0.50, "ev_discount_pct": 0.25, "women_discount_pct": 0.10, "is_baas_eligible": True,  "priority_rank": 5,  "tagline": "811 zero-hassle auto finance" },
  { "code": "BAJAJ",    "name": "Bajaj Finance",              "bank_type": "NBFC",    "best_rate": 9.25, "base_rate":10.10, "max_ltv_pct": 85, "min_cibil_score": 650, "max_foir_pct": 55, "min_income": 20000, "processing_fee_pct": 1.00, "ev_discount_pct": 0.20, "women_discount_pct": 0.10, "is_baas_eligible": False, "priority_rank": 6,  "tagline": "Quick approval self-employed" },
  { "code": "INDUSIND", "name": "IndusInd Bank",              "bank_type": "PRIVATE", "best_rate": 9.00, "base_rate": 9.80, "max_ltv_pct": 85, "min_cibil_score": 700, "max_foir_pct": 50, "min_income": 25000, "processing_fee_pct": 0.75, "ev_discount_pct": 0.25, "women_discount_pct": 0.10, "is_baas_eligible": False, "priority_rank": 7,  "tagline": "Pioneer banking for auto" },
  { "code": "PNB",      "name": "Punjab National Bank",       "bank_type": "PSU",     "best_rate": 8.70, "base_rate": 9.40, "max_ltv_pct": 90, "min_cibil_score": 650, "max_foir_pct": 55, "min_income": 15000, "processing_fee_pct": 0.25, "ev_discount_pct": 0.50, "women_discount_pct": 0.25, "is_baas_eligible": False, "priority_rank": 8,  "tagline": "Zero fee on EV loans" },
  { "code": "MAHINDRA", "name": "Mahindra Finance",           "bank_type": "NBFC",    "best_rate": 9.50, "base_rate":10.40, "max_ltv_pct": 85, "min_cibil_score": 650, "max_foir_pct": 55, "min_income": 15000, "processing_fee_pct": 1.00, "ev_discount_pct": 0.20, "women_discount_pct": 0.10, "is_baas_eligible": False, "priority_rank": 9,  "tagline": "Rural India's finance partner" },
  { "code": "SARASWAT", "name": "Saraswat Co-operative Bank", "bank_type": "PRIVATE", "best_rate": 8.50, "base_rate": 9.50, "max_ltv_pct": 85, "min_cibil_score": 650, "max_foir_pct": 50, "min_income": 20000, "processing_fee_pct": 0.60, "ev_discount_pct": 0.20, "women_discount_pct": 0.10, "is_baas_eligible": False, "priority_rank": 10, "tagline": "Member-first cooperative banking" },
  { "code": "AU",       "name": "AU Small Finance Bank",      "bank_type": "SFB",     "best_rate": 9.25, "base_rate":10.20, "max_ltv_pct": 85, "min_cibil_score": 600, "max_foir_pct": 55, "min_income": 15000, "processing_fee_pct": 0.75, "ev_discount_pct": 0.20, "women_discount_pct": 0.10, "is_baas_eligible": False, "priority_rank": 11, "tagline": "Thin-file & informal income welcome" },
  { "code": "RRB_RJ",   "name": "Rajasthan Gramin Bank",      "bank_type": "PSU",     "best_rate": 9.40, "base_rate":10.25, "max_ltv_pct": 85, "min_cibil_score": 600, "max_foir_pct": 55, "min_income": 12000, "processing_fee_pct": 0.30, "ev_discount_pct": 0.15, "women_discount_pct": 0.10, "is_baas_eligible": False, "priority_rank": 12, "tagline": "Rural Rajasthan auto loans" },
]

def seed(db: Session):
    # Admin user
    if not db.query(AdminUser).filter_by(email="admin@maruti.co.in").first():
        db.add(AdminUser(
            email="admin@maruti.co.in",
            hashed_password=bcrypt.hashpw(b"password", bcrypt.gensalt()).decode()
        ))

    # Bank partners (skip if already exists by code)
    existing_codes = {b.code for b in db.query(BankPartner).all()}
    for bp in BANK_PARTNERS:
        if bp["code"] not in existing_codes:
            db.add(BankPartner(**bp))

    # Rate grids — per-bank upsert
    # (add all 11 bank rate grids matching BANK_RATE_RULES data above)
    
    # Applications — generate 150 sample applications if none exist
    if db.query(LoanApplication).count() == 0:
        import random, uuid as _uuid
        VEHICLES = ['SWIFT', 'BALENO', 'BREZZA', 'ERTIGA', 'GRAND VITARA', 'CIAZ', 'XL6']
        STATUSES = ['IN_PROGRESS']*40 + ['APPROVED']*25 + ['REJECTED']*20 + ['DISBURSED']*15
        NAMES = ['Rahul Kumar','Priya Sharma','Amit Patel','Sunita Verma','Rajesh Singh',
                 'Neha Gupta','Vikram Joshi','Pooja Mishra','Suresh Nair','Kavita Reddy']
        BANKS = [b["name"] for b in BANK_PARTNERS]
        for i in range(150):
            status = random.choice(STATUSES)
            db.add(LoanApplication(
                application_no=f"MSIL-APP-{10001+i}",
                customer_name=random.choice(NAMES),
                customer_phone=f"98{random.randint(10000000,99999999)}",
                vehicle_model=random.choice(VEHICLES),
                loan_amount=random.choice([300000,500000,700000,900000,1200000,1500000]),
                status=status,
                current_step=random.randint(1,7),
                bank_name=random.choice(BANKS),
                employment_type=random.choice(['salaried','self_employed']),
                monthly_income=random.choice([30000,50000,75000,100000,150000]),
                cibil_score=random.choice([680,720,750,780,810,840]),
                tenure_months=random.choice([36,48,60,72]),
            ))

    db.commit()
```

---

## 13. Directory Structure

```
maruti-admin-portal/
├── admin-frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/admin.ts
│   │   ├── store/adminAuthStore.ts
│   │   ├── components/layout/AdminLayout.tsx
│   │   └── pages/admin/
│   │       ├── BankPartners.tsx
│   │       ├── Applications.tsx
│   │       ├── rateRulesData.ts
│   │       └── integration-mapper/
│   │           ├── IntegrationMapper.tsx
│   │           ├── MapperLogin.tsx
│   │           ├── MappingResults.tsx
│   │           └── masterSchemas.ts
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
└── backend/
    ├── run.py
    ├── .env                    ← LLM keys here — REQUIRED
    ├── requirements.txt
    └── app/
        ├── main.py
        ├── config.py
        ├── dependencies.py
        ├── seed.py
        ├── core/database.py
        ├── models/models.py
        ├── schemas/schemas.py
        └── api/v1/
            ├── auth.py
            ├── banks.py
            ├── applications.py
            ├── rate_grids.py
            ├── analytics.py
            └── integration_mapper.py   ← THE AGENTIC CODE (Section 8)
```

---

## Critical Notes for Lovable AI

1. **`GEMINI_API_KEY` is mandatory** — without it, the Integration Mapper returns HTTP 503. Add your Google Gemini key in `backend/.env` as `GEMINI_API_KEY=<your key>`. Get it free from https://aistudio.google.com/app/apikey. Default: `LLM_PROVIDER=gemini`, `LLM_MODEL=gemini-2.0-flash`. Fallback providers also supported: set `LLM_PROVIDER=openai` + `OPENAI_API_KEY=` or `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY=`.

2. **The LLM is called per run** — each click of "Run Mapping" sends ~3–5KB of JSON to Gemini and returns ~8–15KB structured JSON. `gemini-2.0-flash` has a generous free tier on Google AI Studio — no cost for typical usage volumes.

3. **The SYSTEM_PROMPT in Section 8 is core IP** — copy it verbatim. It instructs the model to achieve 95%+ field coverage and return a specific 5-key JSON structure. Do not simplify.

4. **masterSchemas.ts is the LLM's context** — when user selects "ICICI Bank" + "loan_application", the frontend takes `ICICI_APPLICATION` from `masterSchemas.ts` and sends it as `bank_schema` to the backend. The LLM sees actual ICICI field names and produces accurate mappings.

5. **MappingResults.tsx is a fully interactive editor** — every field mapping can be edited inline. The "Save Draft" button persists the (possibly edited) result to DB via `POST /api/v1/admin/integration-mapper/save`.

6. **Rate matrix best_rate** on bank card = `base_rates['800+'][12]`. Base rate on card = `base_rates['750–799'][60]`. DB grid overrides hardcoded when available. Use `findRateRule()` to match — prevents cross-bank rate pollution (HDFC rates showing on ICICI card).

7. **Backend startup** — `main.py` calls `seed()` in lifespan. SQLite DB auto-created. All tables created via `Base.metadata.create_all(engine)`.
