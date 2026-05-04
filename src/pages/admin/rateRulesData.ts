// ── Standalone Rate Rules Data — all 9 banks ─────────────────────────────────
// Factors derived from ICICI x Maruti Car Loan Interest Rate Rules (April 2026)
// No API dependency. Edit here or export JSON from the UI.

export type CibilBand = '800+' | '750–799' | '700–749' | '650–699'
export type TenureMonth = 12 | 24 | 36 | 48 | 60 | 72 | 84

export const CIBIL_BANDS: CibilBand[] = ['800+', '750–799', '700–749', '650–699']
export const TENURE_OPTIONS: TenureMonth[] = [12, 24, 36, 48, 60, 72, 84]

// base_rates[cibil_band][tenure_months] = annual interest rate %
export type RateGrid = Record<CibilBand, Record<TenureMonth, number>>

export type FactorDef = {
  id: string
  label: string
  description: string
  defaultValue: number   // % discount default
  maxValue: number       // max allowed
  step: number
}

export type BankRuleSet = {
  bank_code: string
  bank_name: string
  bank_type: 'PSU' | 'PRIVATE' | 'NBFC' | 'SFB'
  base_rates: RateGrid
  factors: FactorDef[]
  processing_fee_pct: number
  max_ltv_pct: number
  notes: string[]
}

// ── Factor definitions from ICICI x Maruti document (April 2026) ──────────────
// Factors: Age, Income, Car Value, Down Payment, Govt Employee, MNC Employee, Low FOIR, Maruti Loyalty
// Values vary per bank — see ICICI_Maruti_LoanRateRules.docx for reference
//
// Factor impact reference (ICICI base 9.15%):
//   Young Applicant (21–30 yrs):     −0.10%
//   High Income (>₹1.5L/mo):         −0.50%
//   Premium Car (>₹30L):             −0.25%
//   High Down Payment (≥25%):        −0.25%
//   Govt / PSU Employee:             −0.50%
//   MNC / Listed Co. (Salaried):     −0.25%
//   Low FOIR (<30%):                 −0.10%
//   Maruti Loyalty (repeat buyer):   −0.15%

function factors(
  ageYoung: number,
  highIncome: number,
  premiumCar: number,
  highDown: number,
  govtEmp: number,
  mncEmp: number,
  lowFoir: number,
  maruti: number,
): FactorDef[] {
  return [
    {
      id: 'age_young',
      label: 'Young Applicant (21–30 yrs)',
      description: 'Rate benefit for primary applicant aged 21–30 years',
      defaultValue: ageYoung, maxValue: 0.25, step: 0.05,
    },
    {
      id: 'high_income',
      label: 'High Income (>₹1.5L/mo)',
      description: 'Discount for monthly salary above ₹1.5 lakh (₹18L+ p.a.)',
      defaultValue: highIncome, maxValue: 0.75, step: 0.05,
    },
    {
      id: 'premium_car',
      label: 'Premium Car (>₹30L)',
      description: 'Rate concession for on-road car price above ₹30 lakh',
      defaultValue: premiumCar, maxValue: 0.50, step: 0.05,
    },
    {
      id: 'high_down',
      label: 'High Down Payment (≥25%)',
      description: 'Discount for down payment of 25% or more of car value',
      defaultValue: highDown, maxValue: 0.50, step: 0.05,
    },
    {
      id: 'govt_emp',
      label: 'Govt / PSU Employee',
      description: 'Concessional rate for government and PSU employees',
      defaultValue: govtEmp, maxValue: 0.75, step: 0.05,
    },
    {
      id: 'mnc_emp',
      label: 'MNC / Listed Co. (Salaried)',
      description: 'Discount for salaried employees of MNC or listed company',
      defaultValue: mncEmp, maxValue: 0.50, step: 0.05,
    },
    {
      id: 'low_foir',
      label: 'Low FOIR (<30%)',
      description: 'Benefit for fixed obligation to income ratio below 30%',
      defaultValue: lowFoir, maxValue: 0.25, step: 0.05,
    },
    {
      id: 'maruti',
      label: 'Maruti Loyalty (Repeat Buyer)',
      description: 'Repeat Maruti Suzuki customer loyalty discount',
      defaultValue: maruti, maxValue: 0.25, step: 0.05,
    },
  ]
}

// ── 9 Bank Rate Sets ──────────────────────────────────────────────────────────

export const BANK_RATE_RULES: BankRuleSet[] = [
  // ── HDFC Bank ──────────────────────────────────────────────────────────────
  {
    bank_code: 'HDFC',
    bank_name: 'HDFC Bank',
    bank_type: 'PRIVATE',
    processing_fee_pct: 0.50,
    max_ltv_pct: 90,
    notes: [
      'Rate valid for Maruti Suzuki new vehicles only',
      'Processing fee capped at ₹7,500',
      'Young applicant (21–30 yrs) benefit: −0.10%',
      'High down payment (≥25%) benefit: −0.25%',
    ],
    // factors(ageYoung, highIncome, premiumCar, highDown, govtEmp, mncEmp, lowFoir, maruti)
    factors: factors(0.10, 0.50, 0.25, 0.25, 0.50, 0.25, 0.10, 0.15),
    base_rates: {
      '800+':    { 12: 8.75, 24: 8.85, 36: 9.00, 48: 9.15, 60: 9.25, 72: 9.40, 84: 9.50 },
      '750–799': { 12: 9.00, 24: 9.10, 36: 9.25, 48: 9.40, 60: 9.50, 72: 9.65, 84: 9.75 },
      '700–749': { 12: 9.50, 24: 9.65, 36: 9.75, 48: 9.90, 60:10.00, 72:10.15, 84:10.25 },
      '650–699': { 12:10.25, 24:10.40, 36:10.50, 48:10.65, 60:10.75, 72:10.90, 84:11.00 },
    },
  },

  // ── ICICI Bank ─────────────────────────────────────────────────────────────
  // Base rate 9.15% per ICICI x Maruti document (April 2026)
  // Factors directly from document: Age −0.10%, Income −0.50%, Car −0.25%,
  // Down Pmt −0.25%, Govt −0.50%, MNC −0.25%, Low FOIR −0.10%
  {
    bank_code: 'ICICI',
    bank_name: 'ICICI Bank',
    bank_type: 'PRIVATE',
    processing_fee_pct: 0.50,
    max_ltv_pct: 90,
    notes: [
      'Base rate 9.15% p.a. (ICICI x Maruti, April 2026)',
      'CIBIL 800+: −0.75% → effective 8.40%',
      'Best achievable: ~7.90–8.15% (multiple factors stacked)',
      'FOIR above 50%: application declined',
      'iMobile pre-approved customers: additional 0.10% off',
    ],
    factors: factors(0.10, 0.50, 0.25, 0.25, 0.50, 0.25, 0.10, 0.15),
    base_rates: {
      '800+':    { 12: 8.40, 24: 8.50, 36: 8.65, 48: 8.75, 60: 8.90, 72: 9.00, 84: 9.15 },
      '750–799': { 12: 8.90, 24: 9.00, 36: 9.15, 48: 9.25, 60: 9.40, 72: 9.50, 84: 9.65 },
      '700–749': { 12: 9.15, 24: 9.25, 36: 9.40, 48: 9.55, 60: 9.65, 72: 9.80, 84: 9.95 },
      '650–699': { 12:10.15, 24:10.30, 36:10.45, 48:10.60, 60:10.75, 72:10.90, 84:11.05 },
    },
  },

  // ── Axis Bank ──────────────────────────────────────────────────────────────
  {
    bank_code: 'AXIS',
    bank_name: 'Axis Bank',
    bank_type: 'PRIVATE',
    processing_fee_pct: 0.50,
    max_ltv_pct: 85,
    notes: [
      'Burgundy & Prestige customers: additional 0.15% off',
      'Processing fee minimum ₹3,500',
      'Govt employee benefit: −0.50%',
    ],
    factors: factors(0.10, 0.50, 0.25, 0.25, 0.50, 0.25, 0.10, 0.15),
    base_rates: {
      '800+':    { 12: 8.85, 24: 9.00, 36: 9.10, 48: 9.25, 60: 9.35, 72: 9.50, 84: 9.60 },
      '750–799': { 12: 9.10, 24: 9.25, 36: 9.35, 48: 9.50, 60: 9.65, 72: 9.75, 84: 9.90 },
      '700–749': { 12: 9.65, 24: 9.75, 36: 9.90, 48:10.05, 60:10.20, 72:10.30, 84:10.45 },
      '650–699': { 12:10.45, 24:10.60, 36:10.70, 48:10.85, 60:11.00, 72:11.10, 84:11.25 },
    },
  },

  // ── SBI ────────────────────────────────────────────────────────────────────
  {
    bank_code: 'SBI',
    bank_name: 'SBI (State Bank of India)',
    bank_type: 'PSU',
    processing_fee_pct: 0.25,
    max_ltv_pct: 90,
    notes: [
      'Govt/PSU employee benefit: −0.50%',
      'Salary account holders: 0.05% additional waiver',
      'Processing fee waived for pre-approved customers',
      'Zero processing fee on high down payment (≥25%) cases',
    ],
    factors: factors(0.10, 0.50, 0.25, 0.30, 0.50, 0.15, 0.10, 0.10),
    base_rates: {
      '800+':    { 12: 8.65, 24: 8.75, 36: 8.90, 48: 9.00, 60: 9.10, 72: 9.25, 84: 9.35 },
      '750–799': { 12: 8.85, 24: 9.00, 36: 9.10, 48: 9.25, 60: 9.35, 72: 9.50, 84: 9.60 },
      '700–749': { 12: 9.25, 24: 9.40, 36: 9.55, 48: 9.65, 60: 9.80, 72: 9.90, 84:10.05 },
      '650–699': { 12: 9.75, 24: 9.90, 36:10.05, 48:10.15, 60:10.30, 72:10.40, 84:10.55 },
    },
  },

  // ── Kotak Mahindra Bank ────────────────────────────────────────────────────
  {
    bank_code: 'KOTAK',
    bank_name: 'Kotak Mahindra Bank',
    bank_type: 'PRIVATE',
    processing_fee_pct: 0.50,
    max_ltv_pct: 90,
    notes: [
      '811 account holders: additional 0.10% off',
      'Rate lock for 30 days from sanction',
      'High income (>₹1.5L/mo): −0.50%',
    ],
    factors: factors(0.10, 0.50, 0.25, 0.25, 0.50, 0.25, 0.10, 0.15),
    base_rates: {
      '800+':    { 12: 8.90, 24: 9.00, 36: 9.15, 48: 9.25, 60: 9.40, 72: 9.50, 84: 9.65 },
      '750–799': { 12: 9.15, 24: 9.25, 36: 9.40, 48: 9.55, 60: 9.65, 72: 9.80, 84: 9.90 },
      '700–749': { 12: 9.65, 24: 9.80, 36: 9.90, 48:10.05, 60:10.20, 72:10.30, 84:10.45 },
      '650–699': { 12:10.40, 24:10.55, 36:10.65, 48:10.80, 60:10.95, 72:11.05, 84:11.20 },
    },
  },

  // ── Bajaj Finance ──────────────────────────────────────────────────────────
  {
    bank_code: 'BAJAJ',
    bank_name: 'Bajaj Finance',
    bank_type: 'NBFC',
    processing_fee_pct: 1.00,
    max_ltv_pct: 85,
    notes: [
      'Flexible eligibility — self-employed welcome',
      'Step-up EMI option available',
      'Bajaj EMI card holders: 0.15% off',
      'High income benefit: −0.50%',
    ],
    factors: factors(0.10, 0.50, 0.20, 0.25, 0.40, 0.20, 0.10, 0.10),
    base_rates: {
      '800+':    { 12: 9.25, 24: 9.40, 36: 9.55, 48: 9.65, 60: 9.80, 72: 9.95, 84:10.10 },
      '750–799': { 12: 9.50, 24: 9.65, 36: 9.80, 48: 9.95, 60:10.10, 72:10.25, 84:10.40 },
      '700–749': { 12:10.00, 24:10.15, 36:10.30, 48:10.45, 60:10.60, 72:10.75, 84:10.90 },
      '650–699': { 12:10.75, 24:10.90, 36:11.05, 48:11.20, 60:11.40, 72:11.55, 84:11.75 },
    },
  },

  // ── IndusInd Bank ──────────────────────────────────────────────────────────
  {
    bank_code: 'INDUSIND',
    bank_name: 'IndusInd Bank',
    bank_type: 'PRIVATE',
    processing_fee_pct: 0.75,
    max_ltv_pct: 85,
    notes: [
      'Pioneer account holders: priority processing',
      'Doorstep documentation available',
      'Festive offers applicable Oct–Nov',
      'Govt/PSU employee benefit: −0.50%',
    ],
    factors: factors(0.10, 0.50, 0.25, 0.25, 0.50, 0.25, 0.10, 0.15),
    base_rates: {
      '800+':    { 12: 9.00, 24: 9.15, 36: 9.25, 48: 9.40, 60: 9.55, 72: 9.65, 84: 9.80 },
      '750–799': { 12: 9.25, 24: 9.40, 36: 9.55, 48: 9.65, 60: 9.80, 72: 9.95, 84:10.05 },
      '700–749': { 12: 9.75, 24: 9.90, 36:10.00, 48:10.15, 60:10.30, 72:10.45, 84:10.55 },
      '650–699': { 12:10.50, 24:10.65, 36:10.80, 48:10.95, 60:11.10, 72:11.25, 84:11.40 },
    },
  },

  // ── Punjab National Bank ───────────────────────────────────────────────────
  {
    bank_code: 'PNB',
    bank_name: 'Punjab National Bank',
    bank_type: 'PSU',
    processing_fee_pct: 0.25,
    max_ltv_pct: 90,
    notes: [
      'Govt/PSU employee concessional rate: −0.50%',
      'Zero processing fee on EV loans',
      'PNB One account holders: additional 0.05% off',
      'High down payment (≥25%): −0.30%',
    ],
    factors: factors(0.10, 0.50, 0.25, 0.30, 0.50, 0.15, 0.10, 0.10),
    base_rates: {
      '800+':    { 12: 8.70, 24: 8.80, 36: 8.95, 48: 9.05, 60: 9.15, 72: 9.30, 84: 9.40 },
      '750–799': { 12: 8.90, 24: 9.05, 36: 9.15, 48: 9.30, 60: 9.40, 72: 9.55, 84: 9.65 },
      '700–749': { 12: 9.30, 24: 9.45, 36: 9.60, 48: 9.70, 60: 9.85, 72: 9.95, 84:10.10 },
      '650–699': { 12: 9.80, 24: 9.95, 36:10.10, 48:10.20, 60:10.35, 72:10.45, 84:10.60 },
    },
  },

  // ── Mahindra Finance ───────────────────────────────────────────────────────
  {
    bank_code: 'MAHINDRA',
    bank_name: 'Mahindra Finance',
    bank_type: 'NBFC',
    processing_fee_pct: 1.00,
    max_ltv_pct: 85,
    notes: [
      'Strong rural & semi-urban reach',
      'Flexible income documentation norms',
      'Agri-income customers welcome',
      'High income (>₹1.5L/mo) benefit: −0.50%',
    ],
    factors: factors(0.10, 0.50, 0.20, 0.25, 0.35, 0.15, 0.10, 0.10),
    base_rates: {
      '800+':    { 12: 9.50, 24: 9.65, 36: 9.80, 48: 9.95, 60:10.10, 72:10.25, 84:10.40 },
      '750–799': { 12: 9.75, 24: 9.90, 36:10.05, 48:10.20, 60:10.35, 72:10.50, 84:10.65 },
      '700–749': { 12:10.25, 24:10.40, 36:10.55, 48:10.70, 60:10.85, 72:11.00, 84:11.15 },
      '650–699': { 12:11.00, 24:11.15, 36:11.30, 48:11.50, 60:11.65, 72:11.85, 84:12.00 },
    },
  },

  // ── Saraswat Co-operative Bank ─────────────────────────────────────────────
  {
    bank_code: 'SARASWAT',
    bank_name: 'Saraswat Co-operative Bank',
    bank_type: 'PRIVATE',
    processing_fee_pct: 0.60,
    max_ltv_pct: 85,
    notes: [
      'Member account holders: 0.10% additional discount',
      'Salary account discount: 0.05% off',
      'EV vehicle benefit: −0.20%',
      'Processing fee minimum ₹2,500',
    ],
    factors: factors(0.10, 0.40, 0.20, 0.25, 0.40, 0.20, 0.10, 0.10),
    base_rates: {
      '800+':    { 12: 8.50, 24: 8.65, 36: 8.80, 48: 8.95, 60: 9.10, 72: 9.25, 84: 9.40 },
      '750–799': { 12: 8.90, 24: 9.05, 36: 9.20, 48: 9.35, 60: 9.50, 72: 9.65, 84: 9.80 },
      '700–749': { 12: 9.40, 24: 9.55, 36: 9.70, 48: 9.85, 60:10.00, 72:10.15, 84:10.30 },
      '650–699': { 12:10.10, 24:10.25, 36:10.40, 48:10.55, 60:10.70, 72:10.85, 84:11.00 },
    },
  },

  // ── AU Small Finance Bank ──────────────────────────────────────────────────
  {
    bank_code: 'AU',
    bank_name: 'AU Small Finance Bank',
    bank_type: 'SFB',
    processing_fee_pct: 0.75,
    max_ltv_pct: 85,
    notes: [
      'Applicants with thin credit file accepted',
      'Self-employed and informal income considered',
      'Doorstep loan processing available',
      'High income (>₹1.5L/mo) benefit: −0.40%',
    ],
    factors: factors(0.10, 0.40, 0.20, 0.20, 0.35, 0.20, 0.10, 0.10),
    base_rates: {
      '800+':    { 12: 9.25, 24: 9.40, 36: 9.55, 48: 9.70, 60: 9.85, 72:10.00, 84:10.15 },
      '750–799': { 12: 9.60, 24: 9.75, 36: 9.90, 48:10.05, 60:10.20, 72:10.35, 84:10.50 },
      '700–749': { 12:10.10, 24:10.25, 36:10.40, 48:10.55, 60:10.70, 72:10.85, 84:11.00 },
      '650–699': { 12:10.75, 24:10.90, 36:11.05, 48:11.20, 60:11.40, 72:11.55, 84:11.75 },
    },
  },

  // ── Rajasthan Gramin Bank ──────────────────────────────────────────────────
  {
    bank_code: 'RRB_RJ',
    bank_name: 'Rajasthan Gramin Bank',
    bank_type: 'PSU',
    processing_fee_pct: 0.30,
    max_ltv_pct: 85,
    notes: [
      'Rural & semi-urban customers preferred',
      'Agri-income and KCC holders: priority processing',
      'Govt/PSU employee benefit: −0.40%',
      'Low processing fee — no hidden charges',
    ],
    factors: factors(0.10, 0.35, 0.15, 0.25, 0.40, 0.10, 0.10, 0.10),
    base_rates: {
      '800+':    { 12: 9.40, 24: 9.55, 36: 9.70, 48: 9.85, 60:10.00, 72:10.15, 84:10.30 },
      '750–799': { 12: 9.65, 24: 9.80, 36: 9.95, 48:10.10, 60:10.25, 72:10.40, 84:10.55 },
      '700–749': { 12:10.10, 24:10.25, 36:10.40, 48:10.55, 60:10.70, 72:10.85, 84:11.00 },
      '650–699': { 12:10.60, 24:10.75, 36:10.90, 48:11.05, 60:11.20, 72:11.35, 84:11.50 },
    },
  },
]

// ── EMI Calculator ────────────────────────────────────────────────────────────
export function calcEMI(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (principal <= 0 || annualRatePct <= 0 || tenureMonths <= 0) return 0
  const r = annualRatePct / 12 / 100
  return Math.round((principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1))
}

// ── Rate colour (green → amber → red) ─────────────────────────────────────────
export function rateToColor(rate: number): { bg: string; text: string; border: string } {
  if (rate < 9.00)  return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
  if (rate < 9.50)  return { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200' }
  if (rate < 10.00) return { bg: 'bg-lime-50',     text: 'text-lime-700',    border: 'border-lime-200' }
  if (rate < 10.50) return { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200' }
  if (rate < 11.00) return { bg: 'bg-orange-50',   text: 'text-orange-700',  border: 'border-orange-200' }
  return                    { bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200' }
}
