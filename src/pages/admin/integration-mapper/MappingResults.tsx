import { useState } from 'react'
import type { MappingResult, FieldMapping, UnmappedMarutiField, UnmappedBankField, MasterDataFlag, MatchType } from './types'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  Check,
  X,
  Database,
  Save,
  ArrowRight,
  Activity,
  TrendingUp,
  Zap,
  Eye,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
interface MappingResultsProps {
  result: MappingResult
  editedResult: MappingResult
  onUpdateMapping: (idx: number, updated: FieldMapping) => void
  onAddMapping: (mapping: FieldMapping) => void
  onRemoveMapping: (idx: number) => void
  onMapUnmappedField: (field: UnmappedMarutiField, bankField: string, matchType: MatchType, confidence: number) => void
  onSaveDraft: () => void
  isDirty: boolean
  isSaved: boolean
  onExport: () => void
  onDeploy: () => void
  isSaving: boolean
  marutiPayload: string
  bankPayload: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function confidenceColor(c: number) {
  if (c >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (c >= 70) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-orange-700 bg-orange-50 border-orange-200'
}

function ConfidenceBar({ c }: { c: number }) {
  const barColor = c >= 90 ? 'from-emerald-400 to-emerald-500' : c >= 70 ? 'from-amber-400 to-amber-500' : 'from-orange-400 to-orange-500'
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
          style={{ width: `${c}%` }}
        />
      </div>
      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${confidenceColor(c)}`}>
        {c}%
      </span>
    </div>
  )
}

const MATCH_TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  exact:    { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  semantic: { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200' },
  inferred: { bg: 'bg-purple-50',   text: 'text-purple-700',  border: 'border-purple-200' },
  derived:  { bg: 'bg-orange-50',   text: 'text-orange-700',  border: 'border-orange-200' },
  manual:   { bg: 'bg-slate-50',    text: 'text-slate-600',   border: 'border-slate-200' },
}

function MatchBadge({ type }: { type: string }) {
  const s = MATCH_TYPE_STYLES[type] || MATCH_TYPE_STYLES.manual
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold tracking-wide ${s.bg} ${s.text} ${s.border}`}>
      {type}
    </span>
  )
}

function TypeChip({ type, required }: { type: string; required?: boolean }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <code className="text-[10px] bg-muted/70 text-muted-foreground px-1.5 py-0.5 rounded-md font-mono uppercase tracking-wide">{type}</code>
      {required && <span className="text-red-500 text-[11px] font-bold leading-none">*</span>}
    </span>
  )
}

function RiskPill({ risk, reason }: { risk: string; reason: string }) {
  const styles: Record<string, { pill: string; dot: string }> = {
    LOW:    { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    MEDIUM: { pill: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
    HIGH:   { pill: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500' },
  }
  const s = styles[risk] || styles.MEDIUM
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${s.pill}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot} animate-pulse`} />
      {risk} RISK
      <span className="font-normal opacity-70">— {reason}</span>
    </div>
  )
}

const MATCH_TYPES: MatchType[] = ['exact', 'semantic', 'inferred', 'derived']
const FIELD_TYPES = ['string', 'number', 'integer', 'boolean', 'object', 'array']

// ── Styled input/select helpers ────────────────────────────────────────────────
const inputCls = 'w-full border border-border/70 rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/40 font-mono'
const selectCls = 'w-full border border-border/70 rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all cursor-pointer'
const labelCls = 'block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5'

// ── Inline Edit Form ───────────────────────────────────────────────────────────
function EditMappingForm({ mapping, onSave, onCancel }: {
  mapping: FieldMapping
  onSave: (updated: FieldMapping) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<FieldMapping>({ ...mapping })
  const set = (k: keyof FieldMapping, v: unknown) => setDraft(prev => ({ ...prev, [k]: v }))

  return (
    <div className="px-5 pb-5 pt-4 border-t border-blue-100 bg-gradient-to-b from-blue-50/60 to-transparent space-y-4 animate-in fade-in duration-200">
      <p className="text-[11px] font-bold text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
        <Pencil className="w-3 h-3" /> Edit Mapping
      </p>
      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <label className={labelCls}>Bank Field</label>
          <input className={inputCls} value={draft.bank_field} onChange={e => set('bank_field', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Bank Type</label>
          <select className={selectCls} value={draft.bank_type} onChange={e => set('bank_type', e.target.value)}>
            {FIELD_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Confidence ({draft.confidence}%)</label>
          <input type="range" min={1} max={100} className="w-full accent-blue-600 mt-1" value={draft.confidence}
            onChange={e => set('confidence', parseInt(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Match Type</label>
          <select className={selectCls} value={draft.match_type} onChange={e => set('match_type', e.target.value as MatchType)}>
            {MATCH_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Transform (optional)</label>
          <input className={inputCls} value={draft.transform ?? ''} placeholder="e.g. multiply_100"
            onChange={e => set('transform', e.target.value || null)} />
        </div>
        <div>
          <label className={labelCls}>Bank Description</label>
          <input className={inputCls.replace('font-mono', '')} value={draft.bank_desc}
            onChange={e => set('bank_desc', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Transform Detail (optional)</label>
          <textarea rows={2} className={`${inputCls} resize-none`} value={draft.transform_detail ?? ''}
            placeholder="e.g. value * 100 (convert INR to paise)"
            onChange={e => set('transform_detail', e.target.value || null)} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Notes (optional)</label>
          <input className={inputCls.replace('font-mono', '')} value={draft.notes ?? ''}
            onChange={e => set('notes', e.target.value || null)} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(draft)} className="gap-1.5 bg-blue-600 hover:bg-blue-700 h-8 text-xs font-bold">
          <Check className="w-3.5 h-3.5" /> Save Changes
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="gap-1.5 h-8 text-xs">
          <X className="w-3.5 h-3.5" /> Cancel
        </Button>
      </div>
    </div>
  )
}

// ── Mapping Row ────────────────────────────────────────────────────────────────
function MappingRow({ m, idx, onUpdate, onRemove }: {
  m: FieldMapping
  idx: number
  onUpdate: (idx: number, updated: FieldMapping) => void
  onRemove: (idx: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const isManual = m.notes === 'Manually mapped'

  return (
    <div className={`group border-b border-border/40 last:border-0 ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/15'}`}>
      <div className="flex items-stretch">
        <button
          onClick={() => { if (!editing) setOpen(o => !o) }}
          className="flex-1 text-left px-5 py-3.5 hover:bg-muted/30 transition-colors focus:outline-none"
        >
          <div className="grid grid-cols-12 items-center gap-3 text-sm">
            {/* Maruti field */}
            <div className="col-span-3">
              <code className="font-mono font-bold text-[#003A8F] text-[13px] leading-none">{m.maruti_field}</code>
              <div className="mt-1.5"><TypeChip type={m.maruti_type} required={m.maruti_required} /></div>
            </div>
            {/* Arrow */}
            <div className="col-span-1 flex justify-center">
              <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
            </div>
            {/* Bank field */}
            <div className="col-span-3">
              <code className="font-mono font-bold text-indigo-600 text-[13px] leading-none">{m.bank_field}</code>
              <div className="mt-1.5"><TypeChip type={m.bank_type} required={m.bank_required} /></div>
            </div>
            {/* Confidence */}
            <div className="col-span-2 pr-2">
              <ConfidenceBar c={m.confidence} />
            </div>
            {/* Match + Transform */}
            <div className="col-span-2 flex flex-wrap gap-1.5">
              <MatchBadge type={isManual ? 'manual' : m.match_type} />
              {m.transform && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold bg-orange-50 text-orange-700 border-orange-200">
                  {m.transform}
                </span>
              )}
            </div>
            {/* Chevron */}
            <div className="col-span-1 flex justify-end text-muted-foreground/40">
              {open && !editing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </button>

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-1 px-3 border-l border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); setEditing(v => !v); setOpen(false) }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRemove(idx) }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Remove"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expand detail */}
      {open && !editing && (
        <div className="px-5 pb-5 pt-3 grid grid-cols-2 gap-5 text-sm border-t border-border/40 bg-muted/10">
          <div>
            <p className="text-[10px] font-bold text-[#003A8F] uppercase tracking-widest mb-2">Maruti Definition</p>
            <p className="text-muted-foreground leading-relaxed text-sm">{m.maruti_desc}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">Bank Definition</p>
            <p className="text-muted-foreground leading-relaxed text-sm">{m.bank_desc || '—'}</p>
          </div>
          {m.transform_detail && (
            <div className="col-span-2 bg-orange-50 rounded-xl p-4 border border-orange-100">
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest mb-2">Transform: {m.transform}</p>
              <code className="text-orange-900 text-xs block whitespace-pre-wrap font-mono">{m.transform_detail}</code>
            </div>
          )}
          {m.example && (
            <div className="col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Example Value</p>
              <code className="text-slate-700 text-xs font-mono">{m.example}</code>
            </div>
          )}
          {m.notes && (
            <div className="col-span-2 flex items-start gap-2.5 bg-amber-50 rounded-xl p-3 border border-amber-100 text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
              <span className="text-sm">{m.notes}</span>
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditMappingForm
          mapping={m}
          onSave={updated => { onUpdate(idx, updated); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}

// ── Add New Mapping Form ───────────────────────────────────────────────────────
function AddMappingForm({ unmappedMarutiFields, availableBankFields, onAdd, onCancel }: {
  unmappedMarutiFields: UnmappedMarutiField[]
  availableBankFields: string[]
  onAdd: (m: FieldMapping) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<FieldMapping>({
    maruti_field: '', maruti_type: 'string', maruti_required: false, maruti_desc: '',
    bank_field: '', bank_type: 'string', bank_required: false, bank_desc: '',
    confidence: 80, match_type: 'semantic', transform: null, transform_detail: null,
    example: null, notes: 'Manually added',
  })
  const set = (k: keyof FieldMapping, v: unknown) => setDraft(prev => ({ ...prev, [k]: v }))

  const selectMarutiField = (fieldName: string) => {
    const found = unmappedMarutiFields.find(f => f.field === fieldName)
    setDraft(prev => ({
      ...prev, maruti_field: fieldName,
      maruti_type: found?.type ?? prev.maruti_type,
      maruti_required: found?.required ?? prev.maruti_required,
      maruti_desc: found?.suggestion ?? prev.maruti_desc,
    }))
  }

  const valid = draft.maruti_field.trim() && draft.bank_field.trim()
  const bankListId = 'add-mapping-bank-fields'

  return (
    <div className="mx-5 my-4 p-5 border border-dashed border-blue-300 rounded-2xl bg-blue-50/40 space-y-4 animate-in fade-in duration-200">
      <p className="text-sm font-bold text-blue-700 flex items-center gap-2">
        <Plus className="w-4 h-4" /> Add New Mapping
      </p>
      <div className="grid grid-cols-3 gap-3.5">
        <div>
          <label className={labelCls}>
            Maruti Field *{unmappedMarutiFields.length > 0 && <span className="ml-1 normal-case font-normal text-blue-500">({unmappedMarutiFields.length} unmapped)</span>}
          </label>
          {unmappedMarutiFields.length > 0 ? (
            <select className={selectCls} value={draft.maruti_field} onChange={e => selectMarutiField(e.target.value)}>
              <option value="">— Select Maruti field —</option>
              {unmappedMarutiFields.map(f => (
                <option key={f.field} value={f.field}>{f.field} ({f.type}{f.required ? ', req' : ''})</option>
              ))}
            </select>
          ) : (
            <input className={inputCls} placeholder="e.g. applicant_id" value={draft.maruti_field}
              onChange={e => set('maruti_field', e.target.value)} />
          )}
        </div>
        <div>
          <label className={labelCls}>Maruti Type</label>
          <select className={selectCls} value={draft.maruti_type} onChange={e => set('maruti_type', e.target.value)}>
            {FIELD_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <label className={labelCls}>Required</label>
          <label className="flex items-center gap-2 cursor-pointer h-10">
            <input type="checkbox" className="accent-blue-600 w-4 h-4" checked={draft.maruti_required}
              onChange={e => set('maruti_required', e.target.checked)} />
            <span className="text-sm text-muted-foreground">Maruti required</span>
          </label>
        </div>
        <div>
          <label className={labelCls}>
            Bank Field *{availableBankFields.length > 0 && <span className="ml-1 normal-case font-normal text-indigo-500">({availableBankFields.length} available)</span>}
          </label>
          {availableBankFields.length > 0 ? (
            <>
              <select className={`${selectCls} mb-1.5`} value={draft.bank_field} onChange={e => set('bank_field', e.target.value)}>
                <option value="">— Select bank field —</option>
                {availableBankFields.map(bf => <option key={bf} value={bf}>{bf}</option>)}
              </select>
              <input list={bankListId} className={`${inputCls} text-xs`} placeholder="or type custom path…"
                value={draft.bank_field} onChange={e => set('bank_field', e.target.value)} />
              <datalist id={bankListId}>{availableBankFields.map(bf => <option key={bf} value={bf} />)}</datalist>
            </>
          ) : (
            <input className={inputCls} placeholder="e.g. Body.EligibilityRequest.cust_id"
              value={draft.bank_field} onChange={e => set('bank_field', e.target.value)} />
          )}
        </div>
        <div>
          <label className={labelCls}>Bank Type</label>
          <select className={selectCls} value={draft.bank_type} onChange={e => set('bank_type', e.target.value)}>
            {FIELD_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Match Type</label>
          <select className={selectCls} value={draft.match_type} onChange={e => set('match_type', e.target.value as MatchType)}>
            {MATCH_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Confidence ({draft.confidence}%)</label>
          <input type="range" min={1} max={100} className="w-full accent-blue-600 mt-1" value={draft.confidence}
            onChange={e => set('confidence', parseInt(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Transform (optional)</label>
          <input className={inputCls} placeholder="e.g. multiply_100" value={draft.transform ?? ''}
            onChange={e => set('transform', e.target.value || null)} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => valid && onAdd(draft)} disabled={!valid}
          className="gap-1.5 bg-blue-600 hover:bg-blue-700 h-8 text-xs font-bold">
          <Plus className="w-3.5 h-3.5" /> Add Mapping
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="gap-1.5 h-8 text-xs">
          <X className="w-3.5 h-3.5" /> Cancel
        </Button>
      </div>
    </div>
  )
}

// ── Manual Map Row ─────────────────────────────────────────────────────────────
function ManualMapRow({ f, availableBankFields, onMap }: {
  f: UnmappedMarutiField
  availableBankFields: string[]
  onMap: (bankField: string, matchType: MatchType, confidence: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [bankField, setBankField] = useState('')
  const [matchType, setMatchType] = useState<MatchType>('semantic')
  const [confidence, setConfidence] = useState(75)
  const listId = `bank-opts-${f.field}`

  return (
    <div className="border-b border-border/40 last:border-0">
      <div className="px-4 py-3.5 flex flex-col gap-2.5 text-sm hover:bg-muted/20 transition-colors">
        {/* Top row: field name + button */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <code className="font-mono text-[13px] text-red-600 font-bold leading-none break-all">{f.field}</code>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <TypeChip type={f.type} required={f.required} />
              <span className="text-[11px] text-red-500 font-medium">{f.reason}</span>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOpen(v => !v)}
            className="shrink-0 gap-1 border-blue-300 text-blue-600 hover:bg-blue-50 h-7 text-[11px] font-semibold px-2.5">
            <Pencil className="w-3 h-3" />
            Map
          </Button>
        </div>
        {/* Suggestion */}
        <div className="flex items-start gap-2 bg-muted/40 px-2.5 py-2 rounded-lg border border-border/40 min-w-0">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5 shrink-0">Tip:</span>
          <p className="text-foreground text-[11px] leading-relaxed min-w-0 break-words">{f.suggestion}</p>
        </div>
      </div>

      {open && (
        <div className="mx-4 mb-4 p-4 bg-blue-50/60 border border-blue-200/70 rounded-xl space-y-3 animate-in fade-in duration-200">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-widest truncate">
            Map: <code className="font-mono text-blue-600">{f.field}</code>
          </p>
          <div className="space-y-3">
            {/* Bank field — stacked, full width */}
            <div>
              <label className={labelCls}>
                Bank Field *{availableBankFields.length > 0 && (
                  <span className="ml-1 normal-case font-normal text-blue-500">({availableBankFields.length} available)</span>
                )}
              </label>
              {availableBankFields.length > 0 ? (
                <div className="space-y-1.5">
                  <select className={selectCls} value={bankField} onChange={e => setBankField(e.target.value)}>
                    <option value="">— Select bank field —</option>
                    {availableBankFields.map(bf => <option key={bf} value={bf}>{bf}</option>)}
                  </select>
                  <input list={listId} className={inputCls} placeholder="or type a custom path…"
                    value={bankField} onChange={e => setBankField(e.target.value)} />
                  <datalist id={listId}>{availableBankFields.map(bf => <option key={bf} value={bf} />)}</datalist>
                </div>
              ) : (
                <input className={inputCls} placeholder="e.g. Body.EligibilityRequest.pan_no"
                  value={bankField} onChange={e => setBankField(e.target.value)} />
              )}
            </div>
            {/* Match type + Confidence side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Match Type</label>
                <select className={selectCls} value={matchType} onChange={e => setMatchType(e.target.value as MatchType)}>
                  {MATCH_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Confidence ({confidence}%)</label>
                <input type="range" min={1} max={100} className="w-full accent-blue-600 mt-2"
                  value={confidence} onChange={e => setConfidence(parseInt(e.target.value))} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={!bankField.trim()}
              onClick={() => { onMap(bankField.trim(), matchType, confidence); setOpen(false) }}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 h-8 text-xs font-bold">
              <Check className="w-3.5 h-3.5" /> Confirm Mapping
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)} className="gap-1.5 h-8 text-xs">
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Unmapped Bank Table ────────────────────────────────────────────────────────
function UnmappedBankTable({ fields }: { fields: UnmappedBankField[] }) {
  if (!fields.length) return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-3 opacity-70" />
      <p className="text-sm font-medium">All bank fields have a source</p>
    </div>
  )
  return (
    <div className="divide-y divide-border/40">
      {fields.map((f, i) => (
        <div key={i} className="px-4 py-3.5 flex flex-col gap-2 text-sm hover:bg-muted/20 transition-colors min-w-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <code className="font-mono text-[13px] text-indigo-600 font-bold break-all">{f.field}</code>
            <TypeChip type={f.type} required={f.required} />
          </div>
          <div className="flex items-start gap-2 bg-muted/40 px-2.5 py-2 rounded-lg border border-border/40 min-w-0">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5 shrink-0">Source:</span>
            <p className="text-foreground text-[11px] leading-relaxed break-words min-w-0">{f.likely_source}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Master Data Flags ──────────────────────────────────────────────────────────
function MasterDataTable({ flags }: { flags: MasterDataFlag[] }) {
  if (!flags.length) return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-3 opacity-70" />
      <p className="text-sm font-medium">No master data conflicts detected</p>
    </div>
  )
  const sevCls: Record<string, string> = {
    HIGH:   'border-red-200 bg-red-50/50',
    MEDIUM: 'border-amber-200 bg-amber-50/50',
    LOW:    'border-border bg-muted/20',
  }
  const badgeCls: Record<string, string> = {
    HIGH:   'bg-red-100 text-red-700 border-red-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW:    'bg-slate-100 text-slate-600 border-slate-200',
  }
  return (
    <div className="space-y-4 p-5">
      {flags.map((f, i) => (
        <Card key={i} className={`shadow-none ${sevCls[f.severity]}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <code className="font-mono text-sm font-bold text-foreground">{f.field}</code>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${badgeCls[f.severity]}`}>{f.severity}</span>
            </div>
            <p className="text-sm text-foreground mb-4">{f.issue}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded-xl p-3 border shadow-sm">
                <p className="text-[10px] font-bold text-[#003A8F] uppercase tracking-widest mb-2">Maruti sends</p>
                <div className="flex flex-wrap gap-1.5">
                  {f.maruti_values.map((v, j) => (
                    <code key={j} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">{v}</code>
                  ))}
                </div>
              </div>
              <div className="bg-background rounded-xl p-3 border shadow-sm">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">Bank expects</p>
                <div className="flex flex-wrap gap-1.5">
                  {f.bank_values.map((v, j) => (
                    <code key={j} className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">{v}</code>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Summary Stats Bar ──────────────────────────────────────────────────────────
function SummaryBar({ result }: { result: MappingResult }) {
  const s = result.integration_summary
  const coverage = Math.round((s.mapped / s.total_maruti_fields) * 100)

  const stats = [
    { label: 'Maruti Fields', value: s.total_maruti_fields, icon: Activity, color: 'text-[#003A8F]', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Bank Fields',   value: s.total_bank_fields,   icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: 'Mapped',        value: s.mapped,               icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Unmapped',      value: s.unmapped_maruti,      icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { label: 'Transforms',    value: s.transforms_required,  icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Data Flags',    value: result.master_data_flags?.length ?? 0, icon: AlertTriangle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  ]

  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Top row */}
      <div className="px-6 py-4 flex items-center justify-between gap-4 border-b border-border/40">
        <div>
          <h3 className="font-black text-foreground text-[15px] tracking-tight">
            {s.bank}
            <span className="text-muted-foreground/40 font-light mx-2">·</span>
            <span className="text-muted-foreground font-normal capitalize">{s.stage.replace(/_/g, ' ')}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Integration analysis complete</p>
        </div>
        <RiskPill risk={s.integration_risk} reason={s.risk_reason} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-6 divide-x divide-border/40">
        {stats.map(st => {
          const Icon = st.icon
          return (
            <div key={st.label} className="px-5 py-4 flex flex-col gap-1">
              <div className={`w-7 h-7 rounded-lg ${st.bg} ${st.border} border flex items-center justify-center mb-1`}>
                <Icon className={`w-3.5 h-3.5 ${st.color}`} />
              </div>
              <p className={`text-2xl font-black ${st.color} leading-none`}>{st.value}</p>
              <p className="text-[11px] text-muted-foreground font-medium leading-none">{st.label}</p>
            </div>
          )
        })}
      </div>

      {/* Coverage bar */}
      <div className="px-6 py-4 bg-muted/20 border-t border-border/40">
        <div className="flex justify-between text-xs font-semibold mb-2">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Overall Coverage
          </span>
          <span className={`font-black ${coverage >= 90 ? 'text-emerald-600' : coverage >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
            {coverage}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#003A8F] via-blue-500 to-emerald-500 transition-all duration-1000"
            style={{ width: `${coverage}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Payload Preview ────────────────────────────────────────────────────────────
function flattenKeys(obj: unknown, prefix = ''): Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k
    out[key] = v
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.assign(out, flattenKeys(v, key))
    }
  }
  return out
}

function PayloadPreview({ marutiPayload, bankPayload, mappings }: {
  marutiPayload: string
  bankPayload: string
  mappings: FieldMapping[]
}) {
  const marutiToBankMap = new Map(mappings.map(m => [m.maruti_field, m.bank_field]))
  const bankToMarutiMap = new Map(mappings.map(m => [m.bank_field, m.maruti_field]))

  let marutiFields: { name: string; type: string; required: boolean; description: string }[] = []
  try {
    const parsed = JSON.parse(marutiPayload)
    if (Array.isArray(parsed.fields)) marutiFields = parsed.fields
  } catch { /* ignore */ }

  let bankFlat: Record<string, unknown> = {}
  try { bankFlat = flattenKeys(JSON.parse(bankPayload)) } catch { /* ignore */ }
  const bankKeys = Object.keys(bankFlat).filter(k => typeof bankFlat[k] !== 'object')

  return (
    <div className="grid grid-cols-2 gap-5 p-5">
      {/* Maruti side */}
      <div className="rounded-2xl border border-blue-200/70 overflow-hidden shadow-sm">
        <div className="bg-[#0D1117] px-4 py-2.5 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-white/80 font-semibold text-[11px] uppercase tracking-widest">Maruti Master Fields</span>
          <span className="ml-auto text-white/25 text-[10px] font-mono">{marutiFields.length} fields</span>
        </div>
        <div className="divide-y divide-border/40 bg-card max-h-[500px] overflow-y-auto">
          {marutiFields.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Could not parse Maruti fields — ensure valid JSON with a "fields" array.</p>
          ) : marutiFields.map((f, i) => {
            const mapped = marutiToBankMap.get(f.name)
            return (
              <div key={i} className={`px-4 py-2.5 flex items-center gap-3 text-sm ${mapped ? 'bg-card' : 'bg-red-50/40'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <code className="font-mono font-bold text-[#003A8F] text-[12px]">{f.name}</code>
                    <TypeChip type={f.type} required={f.required} />
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-0.5 truncate leading-none">{f.description}</p>
                </div>
                {mapped ? (
                  <div className="flex items-center gap-1.5 shrink-0 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold">
                    <ArrowRight className="w-3 h-3" />
                    <span className="max-w-[110px] truncate">{mapped}</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded shrink-0">unmapped</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bank side */}
      <div className="rounded-2xl border border-indigo-200/70 overflow-hidden shadow-sm">
        <div className="bg-[#0D1117] px-4 py-2.5 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-white/80 font-semibold text-[11px] uppercase tracking-widest">Bank API Fields</span>
          <span className="ml-auto text-white/25 text-[10px] font-mono">{bankKeys.length} fields</span>
        </div>
        <div className="divide-y divide-border/40 bg-card max-h-[500px] overflow-y-auto">
          {bankKeys.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Could not parse bank payload — ensure valid JSON.</p>
          ) : bankKeys.map((k, i) => {
            const mapped = bankToMarutiMap.get(k)
            return (
              <div key={i} className={`px-4 py-2.5 flex items-center gap-3 text-sm ${mapped ? 'bg-card' : 'bg-muted/20'}`}>
                <div className="flex-1 min-w-0">
                  <code className="font-mono font-bold text-indigo-600 text-[12px]">{k}</code>
                  <p className="text-muted-foreground text-[11px] mt-0.5 font-mono truncate leading-none">{String(bankFlat[k])}</p>
                </div>
                {mapped ? (
                  <div className="flex items-center gap-1.5 shrink-0 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold">
                    <ArrowRight className="w-3 h-3 rotate-180" />
                    <span className="max-w-[110px] truncate">{mapped}</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted/50 border border-border px-2 py-0.5 rounded shrink-0">no source</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Tab definitions ────────────────────────────────────────────────────────────
type TabKey = 'mapped' | 'unmapped' | 'flags' | 'preview'

// ── Main Results Panel ─────────────────────────────────────────────────────────
export function MappingResults({
  editedResult,
  onUpdateMapping,
  onAddMapping,
  onRemoveMapping,
  onMapUnmappedField,
  onSaveDraft,
  isDirty,
  isSaved,
  onExport,
  onDeploy,
  isSaving,
  marutiPayload,
  bankPayload,
}: MappingResultsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('mapped')
  const [showAddForm, setShowAddForm] = useState(false)
  const [copiedJSON, setCopiedJSON] = useState(false)

  const r = editedResult

  const mappedBankSet = new Set(r.mappings.map(m => m.bank_field))
  let availableBankFields: string[] = []
  try {
    availableBankFields = Object.entries(flattenKeys(JSON.parse(bankPayload)))
      .filter(([, v]) => typeof v !== 'object')
      .map(([k]) => k)
      .filter(k => !mappedBankSet.has(k))
  } catch { /* ignore */ }

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(r, null, 2))
    setCopiedJSON(true)
    setTimeout(() => setCopiedJSON(false), 1800)
  }

  const tabs: { key: TabKey; label: string; count: number | null; Icon: React.ElementType; color?: string }[] = [
    { key: 'mapped',   label: 'Mapped Fields', count: r.mappings.length, Icon: CheckCircle2 },
    { key: 'unmapped', label: 'Unmapped',       count: (r.unmapped_maruti_fields?.length ?? 0) + (r.unmapped_bank_fields?.length ?? 0), Icon: XCircle, color: 'text-red-500' },
    { key: 'flags',    label: 'Data Flags',     count: r.master_data_flags?.length ?? 0, Icon: AlertTriangle, color: 'text-amber-500' },
    { key: 'preview',  label: 'Payload Preview', count: null, Icon: Eye },
  ]

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-400">
      <SummaryBar result={r} />

      {/* ── Tab bar + Actions ── */}
      <div className="bg-card rounded-2xl border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
          {/* Tabs */}
          <div className="flex gap-0.5">
            {tabs.map(tab => {
              const Icon = tab.Icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-primary/8 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? '' : (tab.color || '')}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={copyJSON}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                copiedJSON
                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {copiedJSON ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedJSON ? 'Copied!' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {!isSaved ? (
              <button
                onClick={onSaveDraft}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isDirty
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                {isDirty ? 'Save Draft' : 'Mark Draft'}
              </button>
            ) : (
              <button
                onClick={onDeploy}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-60"
              >
                <Database className="w-3.5 h-3.5" />
                {isSaving ? 'Deploying…' : 'Deploy to DB'}
              </button>
            )}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="animate-in fade-in duration-200">

          {/* Mapped Fields */}
          {activeTab === 'mapped' && (
            <div>
              <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between bg-emerald-50/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="font-bold text-[15px] text-emerald-900">Mapped Fields</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {r.mappings.length}
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(v => !v)}
                  className="gap-1.5 border-blue-300 text-blue-600 hover:bg-blue-50 h-8 text-xs font-bold">
                  <Plus className="w-3.5 h-3.5" />
                  Add Mapping
                </Button>
              </div>

              {showAddForm && (
                <AddMappingForm
                  unmappedMarutiFields={r.unmapped_maruti_fields ?? []}
                  availableBankFields={availableBankFields}
                  onAdd={m => { onAddMapping(m); setShowAddForm(false) }}
                  onCancel={() => setShowAddForm(false)}
                />
              )}

              {/* Table header */}
              <div className="grid grid-cols-12 gap-3 px-5 py-2.5 bg-slate-900 text-slate-400 text-[10px] font-bold uppercase tracking-[0.12em]">
                <div className="col-span-3">Maruti Field</div>
                <div className="col-span-1" />
                <div className="col-span-3">Bank Field</div>
                <div className="col-span-2">Confidence</div>
                <div className="col-span-2">Match / Transform</div>
                <div className="col-span-1" />
              </div>

              <div className="divide-y divide-border/40">
                {r.mappings.map((m, i) => (
                  <MappingRow key={i} m={m} idx={i} onUpdate={onUpdateMapping} onRemove={onRemoveMapping} />
                ))}
                {r.mappings.length === 0 && (
                  <div className="p-10 text-center text-muted-foreground text-sm">
                    No mappings yet. Click <strong>Add Mapping</strong> above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Unmapped */}
          {activeTab === 'unmapped' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/40 overflow-hidden">
              {/* Unmapped Maruti */}
              <div className="min-w-0 overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2.5 bg-red-50/40 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="font-bold text-[14px] text-red-900 truncate">Unmapped Maruti Fields</span>
                  <span className="ml-auto shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                    {r.unmapped_maruti_fields?.length ?? 0}
                  </span>
                </div>
                <div className="divide-y divide-border/40 bg-card overflow-hidden">
                  {(r.unmapped_maruti_fields?.length ?? 0) === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-3 opacity-70" />
                      <p className="text-sm font-medium">All Maruti fields are mapped</p>
                    </div>
                  ) : r.unmapped_maruti_fields.map((f, i) => (
                    <ManualMapRow
                      key={i} f={f}
                      availableBankFields={availableBankFields}
                      onMap={(bankField, matchType, confidence) => onMapUnmappedField(f, bankField, matchType, confidence)}
                    />
                  ))}
                </div>
              </div>

              {/* Unmapped Bank */}
              <div className="min-w-0 overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2.5 bg-indigo-50/40 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                    <XCircle className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="font-bold text-[14px] text-indigo-900 truncate">Unmapped Bank Fields</span>
                  <span className="ml-auto shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                    {r.unmapped_bank_fields?.length ?? 0}
                  </span>
                </div>
                <div className="bg-card overflow-hidden">
                  <UnmappedBankTable fields={r.unmapped_bank_fields ?? []} />
                </div>
              </div>
            </div>
          )}

          {/* Data Flags */}
          {activeTab === 'flags' && (
            <div>
              <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2.5 bg-amber-50/40">
                <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <span className="font-bold text-[15px] text-amber-900">Master Data Flags</span>
                <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  {r.master_data_flags?.length ?? 0} flags
                </span>
              </div>
              <MasterDataTable flags={r.master_data_flags ?? []} />
            </div>
          )}

          {/* Payload Preview */}
          {activeTab === 'preview' && (
            <div>
              <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2.5 bg-muted/20">
                <div className="w-7 h-7 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="font-bold text-[15px] text-foreground">Payload Preview</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Maruti fields → bank targets · Bank fields ← Maruti sources. Unmapped highlighted.
                  </p>
                </div>
              </div>
              <PayloadPreview marutiPayload={marutiPayload} bankPayload={bankPayload} mappings={r.mappings} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
