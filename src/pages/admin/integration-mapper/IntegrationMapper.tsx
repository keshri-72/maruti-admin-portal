import { useState, useCallback, useEffect, useRef } from 'react'
import Swal from 'sweetalert2'
import { adminClient } from '../../../api/admin'
import { JOURNEY_STAGES, SUPPORTED_BANKS } from './masterSchemas'
import { MappingResults } from './MappingResults'
import type { MappingResult, FieldMapping, UnmappedMarutiField, MatchType } from './types'
import { Button } from '../../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import {
  Link2,
  Zap,
  AlertTriangle,
  XCircle,
  Database,
  ChevronDown,
  Upload,
  Copy,
  Layers,
  CheckCircle2,
  ShieldCheck,
  BadgePercent,
  ClipboardList,
  FileUp,
  RefreshCw,
  Banknote,
  type LucideProps,
} from 'lucide-react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

// ── Stage icon map ─────────────────────────────────────────────────────────────
type LucideIcon = ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>

const STAGE_ICON_MAP: Record<string, LucideIcon> = {
  eligibility_check:  ShieldCheck,
  offer_generation:   BadgePercent,
  loan_application:   ClipboardList,
  document_upload:    FileUp,
  status_polling:     RefreshCw,
  disbursement:       Banknote,
}
import Editor from '@monaco-editor/react'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'

type Format = 'JSON' | 'XML'

// ── Top Progress Bar ──────────────────────────────────────────────────────────
function MappingProgressBar({ progress }: { progress: number }) {
  if (progress === 0) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-all duration-500 ease-out"
        style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(99,102,241,0.7)' }}
      />
    </div>
  )
}

// ── VS Code-style Schema Editor ───────────────────────────────────────────────
function SchemaEditor({
  label,
  value,
  onChange,
  format,
  onFormatChange,
  accent,
  showUpload = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  format: Format
  onFormatChange: (f: Format) => void
  accent: 'blue' | 'indigo'
  showUpload?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const lineCount = value.split('\n').length
  const accentDot = accent === 'blue' ? 'bg-blue-500' : 'bg-indigo-500'
  const accentText = accent === 'blue' ? 'text-blue-400' : 'text-indigo-400'
  const ringColor = accent === 'blue' ? 'ring-blue-500/15 hover:ring-blue-500/30' : 'ring-indigo-500/15 hover:ring-indigo-500/30'

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      onChange(content)
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'xml') onFormatChange('XML')
      if (ext === 'json') onFormatChange('JSON')
    }
    reader.readAsText(file)
  }

  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden ring-1 ${ringColor} transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.10)]`}>
      {/* Toolbar */}
      <div className="bg-[#0D1117] px-4 py-2.5 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          {/* macOS-style traffic lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57] opacity-80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] opacity-80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41] opacity-80" />
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className={`w-2 h-2 rounded-full ${accentDot} shadow-[0_0_4px_currentColor]`} />
          <span className={`text-[11px] font-semibold ${accentText} tracking-wide`}>{label}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/20 font-mono mr-1">{lineCount}L</span>

          {/* Format toggle */}
          <div className="flex bg-white/[0.05] rounded-lg p-0.5 border border-white/[0.07]">
            {(['JSON', 'XML'] as Format[]).map(f => (
              <button
                key={f}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  format === f ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/55'
                }`}
                onClick={() => onFormatChange(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={copy}
            className={`p-1.5 rounded-lg transition-colors ${copied ? 'text-emerald-400' : 'text-white/25 hover:text-white/60 hover:bg-white/[0.06]'}`}
            title="Copy"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {showUpload && (
            <label className="cursor-pointer p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors" title="Upload file">
              <Upload className="w-3.5 h-3.5" />
              <input type="file" accept=".json,.xml" className="hidden" onChange={handleFileUpload} />
            </label>
          )}
        </div>
      </div>

      {/* Monaco editor */}
      <div className="h-[420px] bg-[#0D1117]">
        <Editor
          height="100%"
          language={format.toLowerCase()}
          theme="vs-dark"
          value={value}
          onChange={(val) => onChange(val || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 12.5,
            lineHeight: 20,
            padding: { top: 12, bottom: 12 },
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            renderLineHighlight: 'line',
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            automaticLayout: true,
            tabSize: 2,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>

      {/* Status bar */}
      <div className="bg-[#0D1117] border-t border-white/[0.04] px-4 py-1 flex items-center justify-between">
        <span className="text-[9px] text-white/20 font-mono uppercase tracking-wider">UTF-8 · {format}</span>
        <span className="text-[9px] text-white/20 font-mono">{lineCount} lines</span>
      </div>
    </div>
  )
}

// ── Stage Tab Button ──────────────────────────────────────────────────────────
const STAGE_COLORS: Record<string, { active: string; icon: string; glow: string }> = {
  eligibility_check:  { active: 'bg-blue-600 text-white',    icon: 'text-blue-500',   glow: 'shadow-[0_2px_10px_rgba(37,99,235,0.35)]' },
  offer_generation:   { active: 'bg-emerald-600 text-white', icon: 'text-emerald-500',glow: 'shadow-[0_2px_10px_rgba(5,150,105,0.35)]' },
  loan_application:   { active: 'bg-violet-600 text-white',  icon: 'text-violet-500', glow: 'shadow-[0_2px_10px_rgba(124,58,237,0.35)]' },
  document_upload:    { active: 'bg-amber-600 text-white',   icon: 'text-amber-500',  glow: 'shadow-[0_2px_10px_rgba(217,119,6,0.35)]' },
  status_polling:     { active: 'bg-cyan-600 text-white',    icon: 'text-cyan-500',   glow: 'shadow-[0_2px_10px_rgba(8,145,178,0.35)]' },
  disbursement:       { active: 'bg-rose-600 text-white',    icon: 'text-rose-500',   glow: 'shadow-[0_2px_10px_rgba(225,29,72,0.35)]' },
}

function StageTab({
  stage,
  active,
  onClick,
  index,
}: {
  stage: typeof JOURNEY_STAGES[0]
  active: boolean
  onClick: () => void
  index: number
}) {
  const Icon = STAGE_ICON_MAP[stage.id] ?? ShieldCheck
  const colors = STAGE_COLORS[stage.id] ?? { active: 'bg-primary text-primary-foreground', icon: 'text-primary', glow: '' }

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap select-none ${
        active
          ? `${colors.active} ${colors.glow} scale-[1.02]`
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
      }`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 ${active ? 'text-white/90' : colors.icon}`}
        strokeWidth={active ? 2.5 : 2}
      />
      <span className="leading-tight tracking-tight">{stage.label}</span>
      {active && (
        <span className="hidden xl:inline text-[9px] font-medium opacity-60 ml-0.5 uppercase tracking-widest">
          {index + 1}/{JOURNEY_STAGES.length}
        </span>
      )}
    </button>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function IntegrationMapper() {
  const [selectedBank, setSelectedBank] = useState(SUPPORTED_BANKS[0])
  const [selectedStageIdx, setSelectedStageIdx] = useState(0)
  const stage = JOURNEY_STAGES[selectedStageIdx]

  const [marutiPayload, setMarutiPayload] = useState(stage.masterMarutiJson)
  const [payloadFormat, setPayloadFormat] = useState<Format>('JSON')
  const [bankPayload, setBankPayload] = useState(() => {
    const s = JOURNEY_STAGES[0]
    return s.bankSamples[SUPPORTED_BANKS[0]] || '{\n  "example": "paste bank API payload here"\n}'
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<MappingResult | null>(null)
  const [editedResult, setEditedResult] = useState<MappingResult | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Track what the last run was for — to show a stale banner when context changes
  const [resultContext, setResultContext] = useState<{ bank: string; stageId: string } | null>(null)
  const [progress, setProgress] = useState(0)
  const progressRef = useRef(0)

  useEffect(() => { progressRef.current = progress }, [progress])

  useEffect(() => {
    if (!loading) {
      if (progressRef.current > 0) {
        setProgress(100)
        const t = setTimeout(() => setProgress(0), 700)
        return () => clearTimeout(t)
      }
      return
    }
    setProgress(3)
    const interval = setInterval(() => {
      setProgress(prev => {
        const inc = Math.max(0.4, (87 - prev) * 0.045)
        return Math.min(87, prev + inc)
      })
    }, 350)
    return () => clearInterval(interval)
  }, [loading])

  const convertData = (data: string, from: Format, to: Format): string => {
    try {
      if (from === 'JSON' && to === 'XML') {
        const obj = JSON.parse(data)
        const builder = new XMLBuilder({ format: true, ignoreAttributes: false })
        return builder.build({ root: obj })
      } else if (from === 'XML' && to === 'JSON') {
        const parser = new XMLParser({ ignoreAttributes: false })
        const obj = parser.parse(data)
        return JSON.stringify(obj.root || obj, null, 2)
      }
    } catch (e) {
      console.error('Conversion failed', e)
    }
    return data
  }

  const changeFormat = (newFormat: Format) => {
    if (newFormat === payloadFormat) return
    setMarutiPayload(prev => convertData(prev, payloadFormat, newFormat))
    setBankPayload(prev => convertData(prev, payloadFormat, newFormat))
    setPayloadFormat(newFormat)
  }

  const selectStage = useCallback((idx: number) => {
    setSelectedStageIdx(idx)
    const s = JOURNEY_STAGES[idx]
    let mPayload = s.masterMarutiJson
    if (payloadFormat === 'XML') mPayload = convertData(mPayload, 'JSON', 'XML')
    setMarutiPayload(mPayload)
    const sample = s.bankSamples[selectedBank]
    if (sample) {
      let bPayload = sample
      if (payloadFormat === 'XML') bPayload = convertData(bPayload, 'JSON', 'XML')
      setBankPayload(bPayload)
    } else {
      setBankPayload('{\n  "example": "paste bank API payload here"\n}')
    }
  }, [selectedBank, payloadFormat])

  const selectBank = useCallback((bank: string) => {
    setSelectedBank(bank)
    const sample = stage.bankSamples[bank]
    if (sample) {
      let bPayload = sample
      if (payloadFormat === 'XML') bPayload = convertData(bPayload, 'JSON', 'XML')
      setBankPayload(bPayload)
    } else {
      setBankPayload('{\n  "example": "paste bank API payload here"\n}')
    }
  }, [stage, payloadFormat])

  const runMapping = async () => {
    setLoading(true); setResult(null); setEditedResult(null)
    setIsDirty(false); setIsSaved(false); setError(null); setResultContext(null)
    try {
      const { data } = await adminClient.post('/admin/integration-mapper/run', {
        bank_name: selectedBank, stage: stage.id,
        maruti_schema: marutiPayload, bank_schema: bankPayload,
        maruti_format: payloadFormat, bank_format: payloadFormat,
      })
      setResult(data)
      setEditedResult(JSON.parse(JSON.stringify(data)))
      setResultContext({ bank: selectedBank, stageId: stage.id })
    } catch (e: unknown) {
      const err = e as { code?: string; response?: { data?: { detail?: string } } }
      const msg = err.code === 'ECONNABORTED'
        ? 'Request timed out — the LLM is taking longer than expected. Please try again.'
        : err.response?.data?.detail ?? 'Mapping failed. Check console.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const updateMapping = useCallback((idx: number, updated: FieldMapping) => {
    setEditedResult(prev => {
      if (!prev) return prev
      const mappings = [...prev.mappings]; mappings[idx] = updated
      return { ...prev, mappings }
    })
    setIsDirty(true); setIsSaved(false)
  }, [])

  const addMapping = useCallback((mapping: FieldMapping) => {
    setEditedResult(prev => {
      if (!prev) return prev
      return {
        ...prev,
        mappings: [...prev.mappings, mapping],
        integration_summary: { ...prev.integration_summary, mapped: prev.integration_summary.mapped + 1 },
      }
    })
    setIsDirty(true); setIsSaved(false)
  }, [])

  const removeMapping = useCallback((idx: number) => {
    setEditedResult(prev => {
      if (!prev) return prev
      const removed = prev.mappings[idx]
      const mappings = prev.mappings.filter((_, i) => i !== idx)
      const restoredField: UnmappedMarutiField = {
        field: removed.maruti_field, type: removed.maruti_type,
        required: removed.maruti_required,
        reason: 'Mapping removed — remap manually',
        suggestion: removed.maruti_desc || `Map ${removed.maruti_field} to an appropriate bank field`,
      }
      const unmappedMaruti = [...prev.unmapped_maruti_fields, restoredField]
      return {
        ...prev, mappings, unmapped_maruti_fields: unmappedMaruti,
        integration_summary: { ...prev.integration_summary, mapped: mappings.length, unmapped_maruti: unmappedMaruti.length },
      }
    })
    setIsDirty(true); setIsSaved(false)
  }, [])

  const mapUnmappedField = useCallback((
    field: UnmappedMarutiField, bankField: string, matchType: MatchType, confidence: number
  ) => {
    setEditedResult(prev => {
      if (!prev) return prev
      const newMapping: FieldMapping = {
        maruti_field: field.field, maruti_type: field.type, maruti_required: field.required,
        maruti_desc: field.suggestion, bank_field: bankField, bank_type: 'string',
        bank_required: false, bank_desc: '', confidence, match_type: matchType,
        transform: null, transform_detail: null, example: null, notes: 'Manually mapped',
      }
      const unmapped = prev.unmapped_maruti_fields.filter(f => f.field !== field.field)
      return {
        ...prev, mappings: [...prev.mappings, newMapping], unmapped_maruti_fields: unmapped,
        integration_summary: { ...prev.integration_summary, mapped: prev.integration_summary.mapped + 1, unmapped_maruti: unmapped.length },
      }
    })
    setIsDirty(true); setIsSaved(false)
  }, [])

  const saveDraft = useCallback(() => {
    setIsSaved(true); setIsDirty(false)
    Swal.fire({
      icon: 'info', title: 'Draft Saved',
      text: 'Your mapping edits are saved. Click "Deploy" to publish.',
      confirmButtonColor: '#003A8F', timer: 2500, timerProgressBar: true,
    })
  }, [])

  const saveMapping = async () => {
    if (!editedResult) return
    setSaving(true)
    try {
      await adminClient.post('/admin/integration-mapper/save', {
        bank_name: selectedBank, stage: stage.id,
        maruti_format: payloadFormat, maruti_payload: marutiPayload,
        bank_format: payloadFormat, bank_payload: bankPayload,
        mapping_result: editedResult,
      })
      Swal.fire({
        icon: 'success', title: 'Deployed!',
        text: 'Integration mapping saved successfully to database.',
        confirmButtonColor: '#003A8F', timer: 3000, timerProgressBar: true,
      })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Save failed.'
      Swal.fire({ icon: 'error', title: 'Deploy Failed', text: msg, confirmButtonColor: '#003A8F' })
    } finally {
      setSaving(false)
    }
  }

  const exportJSON = () => {
    if (!editedResult) return
    const blob = new Blob([JSON.stringify(editedResult, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mapping_${selectedBank.replace(/[\s()]+/g, '_')}_${stage.id}.json`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const coverage = editedResult
    ? Math.round((editedResult.integration_summary.mapped / editedResult.integration_summary.total_maruti_fields) * 100)
    : null

  return (
    <div className="min-h-screen bg-background">
      <MappingProgressBar progress={progress} />

      {/* ── Sticky Header ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border/60 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="max-w-[1680px] mx-auto px-6 h-[60px] flex items-center justify-between gap-4">

          {/* Brand mark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#003A8F] to-[#0055CC] flex items-center justify-center shadow-[0_2px_8px_rgba(0,58,143,0.30)]">
              <Link2 className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <div className="text-[14px] font-black text-foreground tracking-tight">
                Integration <span className="text-[#003A8F]">Mapper</span>
              </div>
              <div className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium">
                Semantic Field Mapping Engine
              </div>
            </div>
          </div>

          {/* Bank selector */}
          <div className="flex-1 flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 h-9 px-3.5 rounded-xl border border-border/70 bg-muted/40 hover:bg-muted/70 hover:border-border text-sm font-semibold text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[220px] group">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left truncate">{selectedBank}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="center"
                sideOffset={6}
                className="w-64 p-1.5 rounded-2xl border border-border/60 bg-popover shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm"
              >
                <DropdownMenuLabel className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Select Bank Partner
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1 bg-border/50" />

                <DropdownMenuRadioGroup value={selectedBank} onValueChange={selectBank}>
                  {SUPPORTED_BANKS.map(bank => {
                    const initials = bank
                      .split(' ')
                      .filter(w => /^[A-Z]/.test(w))
                      .slice(0, 2)
                      .map(w => w[0])
                      .join('')
                    const isSelected = bank === selectedBank
                    return (
                      <DropdownMenuRadioItem
                        key={bank}
                        value={bank}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer text-sm font-medium transition-colors focus:bg-accent data-[state=checked]:bg-primary/8 data-[state=checked]:text-primary [&>span:first-child]:hidden"
                      >
                        {/* Initials avatar */}
                        <span className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {initials}
                        </span>
                        <span className="flex-1 truncate">{bank}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </DropdownMenuRadioItem>
                    )
                  })}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Coverage pill */}
            {coverage !== null && !Number.isNaN(coverage) && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {coverage}% covered
              </div>
            )}

            {/* Dirty pill */}
            {editedResult && isDirty && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-semibold">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Unsaved edits
              </div>
            )}

            {/* Deploy */}
            {editedResult && (
              <Button
                variant="outline"
                onClick={saveMapping}
                disabled={saving || !isSaved}
                className="h-9 gap-1.5 text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 rounded-xl disabled:opacity-35"
              >
                <Database className="w-3.5 h-3.5" />
                {saving ? 'Deploying…' : 'Deploy'}
              </Button>
            )}

            {/* Run Mapping */}
            <Button
              onClick={runMapping}
              disabled={loading || !marutiPayload || !bankPayload}
              className="h-9 gap-2 bg-[#003A8F] hover:bg-[#002d6e] text-white rounded-xl px-5 font-bold text-xs uppercase tracking-wide transition-all active:scale-95 shadow-[0_2px_8px_rgba(0,58,143,0.30)] hover:shadow-[0_4px_16px_rgba(0,58,143,0.40)] disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mapping…
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Run Mapping
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* ── Page Body ──────────────────────────────────────────────────────── */}
      <div className="max-w-[1680px] mx-auto px-6 pt-5 pb-16 space-y-5">

        {/* Journey Stage Selector */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-5 py-2.5 bg-muted/30 border-b border-border/40 flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em]">Loan Journey Stage</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              {(() => { const I = STAGE_ICON_MAP[stage.id]; return I ? <I className={`w-3.5 h-3.5 ${STAGE_COLORS[stage.id]?.icon ?? 'text-primary'}`} /> : null })()}
              <strong className="text-foreground">{stage.label}</strong>
              <span className="opacity-50">—</span>
              <span className="opacity-70">{stage.description}</span>
            </span>
          </div>
          <div className="px-4 py-3">
            <div className="flex gap-1.5 overflow-x-auto">
              {JOURNEY_STAGES.map((s, i) => (
                <StageTab
                  key={s.id}
                  stage={s}
                  active={i === selectedStageIdx}
                  onClick={() => selectStage(i)}
                  index={i}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dual Schema Editors */}
        <div className="grid grid-cols-2 gap-5">
          <SchemaEditor
            label="Maruti Master Schema"
            value={marutiPayload}
            onChange={setMarutiPayload}
            format={payloadFormat}
            onFormatChange={changeFormat}
            accent="blue"
          />
          <SchemaEditor
            label={`${selectedBank} Target API Payload`}
            value={bankPayload}
            onChange={setBankPayload}
            format={payloadFormat}
            onFormatChange={changeFormat}
            accent="indigo"
            showUpload
          />
        </div>

        {/* Hint banner */}
        {(!bankPayload || bankPayload.includes('paste bank API payload here')) && !loading && !editedResult && (
          <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-semibold leading-none">Bank payload not provided</p>
              <p className="text-xs mt-1 opacity-75 leading-relaxed">
                Paste the target bank's API payload (JSON or XML) in the right editor, then click <strong>Run Mapping</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3.5 bg-red-50 border border-red-200/80 rounded-xl text-red-800">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold leading-none">Mapping failed</p>
              <p className="mt-1 font-mono text-xs opacity-75 break-all">{error}</p>
            </div>
          </div>
        )}

        {/* Stale result banner */}
        {editedResult && !loading && resultContext && (
          resultContext.bank !== selectedBank || resultContext.stageId !== stage.id
        ) && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800">
            <RefreshCw className="w-4 h-4 shrink-0 text-amber-500" />
            <p className="text-sm flex-1">
              Showing results for <strong>{resultContext.bank}</strong> · <strong>{resultContext.stageId.replace(/_/g, ' ')}</strong>.
              Click <strong>Run Mapping</strong> to analyze the current selection.
            </p>
            <button
              onClick={runMapping}
              className="text-xs font-bold text-amber-700 underline underline-offset-2 hover:text-amber-900 shrink-0"
            >
              Re-run now
            </button>
          </div>
        )}

        {/* Results panel */}
        {editedResult && !loading && (
          <MappingResults
            result={result!}
            editedResult={editedResult}
            onUpdateMapping={updateMapping}
            onAddMapping={addMapping}
            onRemoveMapping={removeMapping}
            onMapUnmappedField={mapUnmappedField}
            onSaveDraft={saveDraft}
            isDirty={isDirty}
            isSaved={isSaved}
            onExport={exportJSON}
            onDeploy={saveMapping}
            isSaving={saving}
            marutiPayload={marutiPayload}
            bankPayload={bankPayload}
          />
        )}

        {/* Empty state */}
        {!loading && !editedResult && !error && (
          <div className="relative flex flex-col items-center justify-center py-20 text-center select-none overflow-hidden">
            <style>{`
              @keyframes im-orbit1 { from { transform: rotate(0deg)   translateX(76px)  rotate(0deg);    } to { transform: rotate(360deg)  translateX(76px)  rotate(-360deg);  } }
              @keyframes im-orbit2 { from { transform: rotate(130deg) translateX(100px) rotate(-130deg); } to { transform: rotate(490deg)  translateX(100px) rotate(-490deg); } }
              @keyframes im-orbit3 { from { transform: rotate(250deg) translateX(58px)  rotate(-250deg); } to { transform: rotate(610deg)  translateX(58px)  rotate(-610deg); } }
              @keyframes im-orbit4 { from { transform: rotate(55deg)  translateX(118px) rotate(-55deg);  } to { transform: rotate(415deg)  translateX(118px) rotate(-415deg); } }
              @keyframes im-float  { 0%,100% { transform: translateY(0px);  } 50% { transform: translateY(-7px); } }
              @keyframes im-glow   { 0%,100% { box-shadow: 0 0 28px rgba(0,58,143,0.45), 0 0 56px rgba(99,102,241,0.20), inset 0 1px 0 rgba(255,255,255,0.15); }
                                     50%      { box-shadow: 0 0 48px rgba(0,58,143,0.65), 0 0 96px rgba(99,102,241,0.30), inset 0 1px 0 rgba(255,255,255,0.20); } }
              @keyframes im-ring1  { 0%,100% { transform: scale(1);    opacity: 0.18; } 50% { transform: scale(1.07); opacity: 0.08; } }
              @keyframes im-ring2  { 0%,100% { transform: scale(1);    opacity: 0.10; } 50% { transform: scale(1.13); opacity: 0.04; } }
              @keyframes im-dash   { to { stroke-dashoffset: -48; } }
              .im-o1 { animation: im-orbit1  8s linear infinite; }
              .im-o2 { animation: im-orbit2 13s linear infinite; }
              .im-o3 { animation: im-orbit3  6s linear infinite; }
              .im-o4 { animation: im-orbit4 17s linear infinite; }
              .im-float { animation: im-float 4s ease-in-out infinite; }
              .im-glow  { animation: im-glow  3s ease-in-out infinite; }
              .im-r1 { animation: im-ring1 3.2s ease-in-out infinite; }
              .im-r2 { animation: im-ring2 3.2s ease-in-out infinite 1.6s; }
            `}</style>

            {/* Radial ambient glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div style={{ width: 560, height: 320, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(0,58,143,0.07) 0%, rgba(99,102,241,0.05) 45%, transparent 72%)' }} />
            </div>

            {/* Orbital rig */}
            <div className="relative flex items-center justify-center mb-9" style={{ width: 272, height: 272 }}>

              {/* Pulsing halos */}
              <div className="im-r1 absolute inset-0 rounded-full border border-[#003A8F]/12" style={{ margin: 8 }} />
              <div className="im-r2 absolute inset-0 rounded-full border border-indigo-400/10" style={{ margin: 32 }} />

              {/* Dashed orbit paths */}
              {[{ size: 152, color: 'rgba(0,58,143,0.13)' }, { size: 200, color: 'rgba(99,102,241,0.10)' }, { size: 236, color: 'rgba(99,102,241,0.07)' }].map(({ size, color }) => (
                <div key={size} className="absolute rounded-full border border-dashed" style={{ width: size, height: size, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', borderColor: color }} />
              ))}

              {/* Orbiting nodes */}
              {[
                { cls: 'im-o1', size: 16, bg: '#003A8F', shadow: 'rgba(0,58,143,0.9)',  inner: true },
                { cls: 'im-o2', size: 12, bg: '#4f46e5', shadow: 'rgba(99,102,241,0.8)', inner: false },
                { cls: 'im-o3', size: 10, bg: '#7c3aed', shadow: 'rgba(124,58,237,0.8)', inner: false },
                { cls: 'im-o4', size:  8, bg: '#93c5fd', shadow: 'rgba(147,197,253,0.6)', inner: false },
              ].map(({ cls, size, bg, shadow, inner }) => (
                <div key={cls} className="absolute" style={{ top: '50%', left: '50%', marginTop: -size/2, marginLeft: -size/2 }}>
                  <div className={cls}>
                    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, boxShadow: `0 0 ${size}px ${shadow}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {inner && <div style={{ width: size * 0.38, height: size * 0.38, borderRadius: '50%', background: 'rgba(255,255,255,0.75)' }} />}
                    </div>
                  </div>
                </div>
              ))}

              {/* Center orb */}
              <div className="im-float im-glow relative z-10 flex items-center justify-center rounded-[22px]"
                style={{ width: 82, height: 82, background: 'linear-gradient(140deg, #003A8F 0%, #1e40af 55%, #4f46e5 100%)' }}>
                <Link2 className="w-9 h-9 text-white" strokeWidth={2.2} />
                <div className="absolute inset-0 rounded-[22px]" style={{ background: 'radial-gradient(circle at 32% 30%, rgba(255,255,255,0.22) 0%, transparent 58%)' }} />
              </div>
            </div>

            {/* Heading */}
            <h3 className="text-[22px] font-black text-foreground tracking-tight leading-none">Ready to analyze</h3>
            <p className="text-sm text-muted-foreground mt-3 max-w-[360px] leading-relaxed">
              Select a bank and journey stage, review the schemas, then click{' '}
              <span className="inline-flex items-center gap-1 font-bold text-[#003A8F] bg-[#003A8F]/8 border border-[#003A8F]/15 px-1.5 py-0.5 rounded-md text-xs">
                <Zap className="w-3 h-3" />Run Mapping
              </span>{' '}
              in the header.
            </p>

            {/* Step chips */}
            <div className="flex items-center gap-2 mt-7">
              {['Select Bank', 'Choose Stage', 'Run Mapping'].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-muted/30 text-[11px] font-semibold text-muted-foreground">
                    <span className="w-4 h-4 rounded-full bg-[#003A8F]/12 text-[#003A8F] text-[9px] font-black flex items-center justify-center leading-none">{i + 1}</span>
                    {step}
                  </div>
                  {i < 2 && <div className="w-5 h-px bg-border/50" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
