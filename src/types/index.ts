// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface CustomerAuth {
  customerId: string
  tokens: AuthTokens
}

// ─── Customer ─────────────────────────────────────────────────────────────────
export interface CustomerProfile {
  full_name: string
  email: string
  monthly_income: number
  employment_type: EmploymentType
  employer_name: string
  existing_emi: number
  city: string
  pincode: string
  age: number
  gender: Gender
}

export type EmploymentType =
  | 'SALARIED'
  | 'SELF_EMPLOYED'
  | 'BUSINESS'
  | 'GOVT_EMPLOYEE'
  | 'DEFENCE'
  | 'PENSIONER'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

// ─── Vehicle ──────────────────────────────────────────────────────────────────
export interface Vehicle {
  id: string
  make: string
  model_name: string
  variant: string
  year: number
  ex_showroom_price: number
  on_road_price: number
  fuel_type: FuelType
  segment: VehicleSegment
  is_ev: boolean
  is_baas_eligible: boolean
  battery_capacity_kwh?: number
}

export type FuelType = 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID'
export type VehicleSegment = 'HATCHBACK' | 'SEDAN' | 'COMPACT_SUV' | 'SUV' | 'MUV'

// ─── Bank ─────────────────────────────────────────────────────────────────────
export interface BankPartner {
  id: string
  code: string
  name: string
  bank_type: BankType
  base_rate: number
  best_rate: number
  max_ltv_pct: number
  min_cibil_score: number
  max_foir_pct: number
  min_income: number
  processing_fee_pct: number
  ev_discount_pct: number
  women_discount_pct: number
  pre_approved_discount_pct: number
  is_baas_eligible: boolean
  priority_rank: number
  api_type: ApiType
  tagline: string
  is_active: boolean
}

export type BankType = 'PSU' | 'PRIVATE' | 'COOPERATIVE' | 'NBFC' | 'RRB'
export type ApiType = 'REST' | 'SFTP' | 'SOAP'

// ─── Loan Application ─────────────────────────────────────────────────────────
export interface LoanApplication {
  id: string
  application_no: string
  current_step: number
  status: LoanStatus
  is_ev: boolean
  baas_opted: boolean
  loan_amount_requested?: number
  tenure_months?: number
  down_payment?: number
  agent_thread_id?: string
  created_at: string
  updated_at: string
}

export type LoanStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'OFFERS_GENERATED'
  | 'OFFER_ACCEPTED'
  | 'KYC_PENDING'
  | 'DOCUMENTS_PENDING'
  | 'SUBMITTED_TO_BANK'
  | 'BANK_PROCESSING'
  | 'APPROVED'
  | 'CONDITIONALLY_APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'CANCELLED'

// ─── Loan Offer ───────────────────────────────────────────────────────────────
export interface LoanOffer {
  id: string
  application_id: string
  bank_id: string
  bank_code: string
  bank_name: string
  rank: number
  loan_amount: number
  tenure_months: number
  rate_of_interest: number
  emi_amount: number
  processing_fee: number
  total_cost: number
  ltv_pct: number
  rate_factors_json: RateFactors
  is_baas_eligible: boolean
  ev_discount_applied: boolean
  women_discount_applied: boolean
  pre_approved_discount_applied: boolean
  status: string
  baas_chassis_rate?: number
  baas_battery_rate?: number
  baas_chassis_emi?: number
  baas_battery_emi?: number
  baas_chassis_amount?: number
  baas_battery_amount?: number
  is_accepted: boolean
  expires_at: string
}

export interface RateFactors {
  base_rate: number
  cibil_adjustment: number
  employment_adjustment: number
  income_adjustment: number
  tenure_adjustment: number
  down_payment_adjustment: number
  car_value_adjustment: number
  age_adjustment: number
  foir_adjustment: number
  ev_discount: number
  women_discount: number
  pre_approved_discount: number
  final_rate: number
}

// ─── Document ─────────────────────────────────────────────────────────────────
export interface Document {
  id: string
  application_id: string
  document_type: DocumentType
  upload_status: UploadStatus
  original_filename: string
  file_path?: string
  quality_score?: number
  ocr_data_json?: Record<string, unknown>
  validation_errors?: string[]
  created_at: string
}

export type DocumentType =
  | 'PAN_CARD'
  | 'AADHAAR_FRONT'
  | 'AADHAAR_BACK'
  | 'SALARY_SLIP_1'
  | 'SALARY_SLIP_2'
  | 'SALARY_SLIP_3'
  | 'BANK_STATEMENT'
  | 'ITR_1'
  | 'ITR_2'
  | 'FORM_16'
  | 'EMPLOYMENT_LETTER'
  | 'VEHICLE_PROFORMA'
  | 'SANCTION_LETTER'
  | 'LOAN_AGREEMENT'
  | 'NACH_MANDATE'

export type UploadStatus = 'PENDING' | 'UPLOADED' | 'PROCESSING' | 'VERIFIED' | 'REJECTED'

// ─── Credit Report ────────────────────────────────────────────────────────────
export interface CreditReport {
  id: string
  customer_id: string
  score: number
  dpd_30: number
  dpd_90: number
  monthly_obligations: number
  bureau: string
  pulled_at: string
  expires_at: string
}

// ─── Bank Submission ──────────────────────────────────────────────────────────
export interface BankSubmission {
  id: string
  application_id: string
  bank_id: string
  bank_name: string
  bank_code: string
  external_ref_id?: string
  status: SubmissionStatus
  submitted_at?: string
  last_polled_at?: string
  sanction_letter_path?: string
  remarks?: string
}

export type SubmissionStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'CONDITIONALLY_APPROVED'
  | 'REJECTED'
  | 'CANCELLED'

// ─── Agent ────────────────────────────────────────────────────────────────────
export interface AgentEvent {
  id: string
  agent_name: AgentName
  event_type: AgentEventType
  message: string
  step: number
  timestamp: string
  latency_ms?: number
  metadata?: Record<string, unknown>
}

export type AgentName =
  | 'loan_advisor'
  | 'offer_optimisation'
  | 'document_processing'
  | 'customer_engagement'
  | 'compliance'
  | 'financier_integration'
  | 'credit_intelligence'
  | 'analytics'
  | 'supervisor'

export type AgentEventType =
  | 'STARTED'
  | 'TOOL_CALL'
  | 'TOOL_RESULT'
  | 'REASONING'
  | 'COMPLETED'
  | 'ERROR'

// ─── Agent State (from backend) ───────────────────────────────────────────────
export interface AgentState {
  current_step: number
  loan_status: LoanStatus
  eligibility_score?: number
  cibil_score?: number
  is_eligible?: boolean
  recommended_loan_amount?: number
  foir?: number
  offers_generated?: LoanOffer[]
  selected_offer_id?: string
  baas_opted?: boolean
  kyc_status?: string
  documents_verified?: boolean
  submission_ids?: string[]
  error_message?: string
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface FunnelMetric {
  step: number
  step_name: string
  count: number
  drop_off_pct: number
}

export interface AgentPerformanceMetric {
  agent_name: AgentName
  total_invocations: number
  avg_latency_ms: number
  error_count: number
  error_rate_pct: number
}

export interface DashboardStats {
  total_applications: number
  approved_count: number
  disbursed_count: number
  pending_count: number
  approval_rate_pct: number
  avg_processing_days: number
  total_loan_value: number
  funnel: FunnelMetric[]
  agent_performance: AgentPerformanceMetric[]
}

// ─── Journey Step Response ────────────────────────────────────────────────────
export interface StepAdvanceResponse {
  application_id: string
  current_step: number
  agent_state: AgentState
  step_name: string
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
}

export interface ApiError {
  detail: string
  code?: string
}
