export type MatchType = 'exact' | 'semantic' | 'inferred' | 'derived'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW'

export interface FieldMapping {
  maruti_field: string
  maruti_type: string
  maruti_required: boolean
  maruti_desc: string
  bank_field: string
  bank_type: string
  bank_required: boolean
  bank_desc: string
  confidence: number
  match_type: MatchType
  transform: string | null
  transform_detail: string | null
  example: string | null
  notes: string | null
}

export interface UnmappedMarutiField {
  field: string
  type: string
  required: boolean
  reason: string
  suggestion: string
}

export interface UnmappedBankField {
  field: string
  type: string
  required: boolean
  likely_source: string
}

export interface MasterDataFlag {
  field: string
  issue: string
  maruti_values: string[]
  bank_values: string[]
  severity: Severity
}

export interface IntegrationSummary {
  bank: string
  stage: string
  total_maruti_fields: number
  total_bank_fields: number
  mapped: number
  unmapped_maruti: number
  transforms_required: number
  integration_risk: RiskLevel
  risk_reason: string
}

export interface MappingResult {
  integration_summary: IntegrationSummary
  mappings: FieldMapping[]
  unmapped_maruti_fields: UnmappedMarutiField[]
  unmapped_bank_fields: UnmappedBankField[]
  master_data_flags: MasterDataFlag[]
}

export interface JourneyStage {
  id: string
  label: string
  icon: string
  description: string
  marutiSchema: string
  bankSchemas: Record<string, string>
}
