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

    provider = settings.llm_provider.lower()

    if provider == "anthropic" and settings.anthropic_api_key:
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
        raise HTTPException(status_code=503, detail="No LLM API key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in backend/.env")

    # Strip markdown fences if present
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
    # Upsert: update if (bank_name, stage) already exists
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
