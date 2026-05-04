import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { banksApi, rateGridsApi, type RateGridRecord } from '../../api/admin'
import { useState, useRef, useEffect } from 'react'
import {
  BANK_RATE_RULES, CIBIL_BANDS, TENURE_OPTIONS,
  calcEMI, rateToColor,
  type CibilBand, type TenureMonth, type FactorDef,
} from './rateRulesData'
import {
  Plus, ToggleLeft, ToggleRight, ChevronDown,
  Download, RotateCcw, Calculator, Percent, TrendingDown,
  Info, BadgeIndianRupee, X, Building2, Check, Sliders,
  Zap, Save, CloudUpload,
} from 'lucide-react'
import clsx from 'clsx'

// Convert DB grid (string keys) to typed RateGrid
function toTypedGrid(dbRates: Record<string, Record<string, number>>): Record<CibilBand, Record<TenureMonth, number>> {
  const result: Record<string, Record<number, number>> = {}
  for (const [band, tenures] of Object.entries(dbRates)) {
    result[band] = {}
    for (const [t, rate] of Object.entries(tenures)) {
      result[band][Number(t)] = rate
    }
  }
  return result as Record<CibilBand, Record<TenureMonth, number>>
}

// Convert typed grid back to DB format (string keys)
function toDbGrid(grid: Record<string, Record<number, number>>): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {}
  for (const [band, tenures] of Object.entries(grid)) {
    result[band] = {}
    for (const [t, rate] of Object.entries(tenures)) {
      result[band][t] = rate
    }
  }
  return result
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const INR = (n: number) => '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const pct = (n: number) => n.toFixed(2) + '%'

const BANK_TYPE_STYLE: Record<string, string> = {
  PRIVATE: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300',
  PSU:     'bg-blue-100   text-blue-700   border-blue-200   dark:bg-blue-950  dark:text-blue-300',
  NBFC:    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300',
  SFB:     'bg-cyan-100   text-cyan-700   border-cyan-200   dark:bg-cyan-950  dark:text-cyan-300',
}

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

// ── Animated Rate Value ───────────────────────────────────────────────────────
function AnimatedRate({ value, className }: { value: number; className?: string }) {
  const [flash, setFlash] = useState(false)
  const prev = useRef(value)
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 500)
      return () => clearTimeout(t)
    }
  }, [value])
  return (
    <span className={clsx(
      'inline-block transition-all duration-300',
      flash ? 'scale-110' : 'scale-100',
      className
    )}>
      {pct(value)}
    </span>
  )
}

// ── Rate Cell ─────────────────────────────────────────────────────────────────
function RateCell({
  base, eff, hasDiscount, isEditing, editValue,
  onDoubleClick, onEditChange, onEditBlur, onEditKey,
  isEdited, flash,
}: {
  base: number; eff: number; hasDiscount: boolean
  isEditing: boolean; editValue: string
  onDoubleClick: () => void
  onEditChange: (v: string) => void
  onEditBlur: () => void
  onEditKey: (e: React.KeyboardEvent) => void
  isEdited: boolean; flash: boolean
}) {
  const c = rateToColor(eff)
  if (isEditing) {
    return (
      <input
        autoFocus type="number" step="0.05" min="5" max="20"
        value={editValue}
        onChange={e => onEditChange(e.target.value)}
        onBlur={onEditBlur}
        onKeyDown={onEditKey}
        className="w-14 text-center text-sm font-bold border-2 border-primary rounded-lg px-1 py-0.5 bg-background focus:outline-none"
      />
    )
  }
  return (
    <div
      onDoubleClick={onDoubleClick}
      title="Double-click to edit base rate"
      className={clsx(
        'rounded-xl border cursor-pointer select-none',
        'transition-all duration-300',
        c.bg, c.border,
        flash && hasDiscount ? 'ring-2 ring-emerald-400/60 shadow-md shadow-emerald-200/50 scale-105' : 'hover:scale-105 hover:shadow-sm',
        isEdited && 'ring-2 ring-primary/30'
      )}
      style={{ padding: '6px 4px' }}
    >
      <div className={clsx('text-[13px] font-black leading-none transition-all duration-300', c.text)}>
        <AnimatedRate value={eff} />
      </div>
      {hasDiscount && (
        <div className="text-[9px] text-muted-foreground/50 line-through mt-0.5">{pct(base)}</div>
      )}
    </div>
  )
}

// ── Factor Row ────────────────────────────────────────────────────────────────
function FactorRow({ f, isOn, value, onToggle, onChange, emiSaving }: {
  f: FactorDef; isOn: boolean; value: number
  onToggle: () => void; onChange: (v: number) => void; emiSaving: number
}) {
  const [inputVal, setInputVal] = useState(String(value))
  useEffect(() => { setInputVal(String(value)) }, [value])

  const commit = () => {
    const v = parseFloat(inputVal)
    if (!isNaN(v) && v >= 0 && v <= f.maxValue) onChange(v)
    else setInputVal(String(value))
  }

  return (
    <div className={clsx(
      'rounded-xl border transition-all duration-200',
      isOn ? 'bg-emerald-50/80 border-emerald-200' : 'bg-muted/20 border-border/40'
    )}>
      <div className="flex items-center gap-2 px-2.5 py-2">
        <button onClick={onToggle} className="shrink-0">
          {isOn
            ? <ToggleRight className="w-5 h-5 text-emerald-600" />
            : <ToggleLeft className="w-5 h-5 text-muted-foreground/30" />}
        </button>
        <span className={clsx('text-[11px] font-semibold flex-1 truncate leading-tight',
          isOn ? 'text-foreground' : 'text-muted-foreground/70')}>
          {f.label}
        </span>
        <div className={clsx(
          'flex items-center gap-0.5 rounded-lg border px-1.5 py-0.5 transition-all',
          isOn ? 'border-emerald-300 bg-white/80' : 'border-border/30 bg-muted/20 opacity-40 pointer-events-none'
        )}>
          <span className="text-[9px] text-muted-foreground">−</span>
          <input
            type="number" step={f.step} min={0} max={f.maxValue}
            value={inputVal}
            onChange={e => {
              setInputVal(e.target.value)
              const v = parseFloat(e.target.value)
              if (!isNaN(v) && v >= 0 && v <= f.maxValue) onChange(v)
            }}
            onBlur={commit}
            onKeyDown={e => e.key === 'Enter' && commit()}
            className="w-9 text-[11px] font-black text-center bg-transparent focus:outline-none text-emerald-700"
          />
          <span className="text-[9px] text-muted-foreground">%</span>
        </div>
      </div>
      {isOn && (
        <div className="px-2.5 pb-2 space-y-1">
          <input
            type="range" min={0} max={f.maxValue} step={f.step} value={value}
            onChange={e => { const v = parseFloat(e.target.value); onChange(v); setInputVal(String(v)) }}
            className="w-full accent-emerald-600 h-1.5 cursor-pointer"
          />
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">0 → {pct(f.maxValue)}</span>
            {emiSaving > 0 && (
              <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                <TrendingDown className="w-2.5 h-2.5" />−{INR(emiSaving)}/mo
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Rate Matrix (3-panel) ─────────────────────────────────────────────────────
function RateMatrix({ bankCode, bankName, dbGrid, gridsLoading }: { bankCode: string; bankName: string; dbGrid?: RateGridRecord; gridsLoading?: boolean }) {
  const qc = useQueryClient()
  const hardcoded = findRateRule(bankCode, bankName)

  // Merge: DB grid takes priority for rates/factors/notes; fall back to hardcoded
  const rule = dbGrid
    ? {
        bank_code: dbGrid.bank_code,
        bank_name: dbGrid.bank_name,
        bank_type: (hardcoded?.bank_type ?? 'PRIVATE') as 'PSU' | 'PRIVATE' | 'NBFC' | 'SFB',
        base_rates: toTypedGrid(dbGrid.base_rates),
        factors: dbGrid.factors as FactorDef[],
        processing_fee_pct: dbGrid.processing_fee_pct,
        max_ltv_pct: dbGrid.max_ltv_pct,
        notes: dbGrid.notes,
      }
    : hardcoded

  const [activeFactors, setActiveFactors] = useState<Record<string, boolean>>({})
  const [factorValues, setFactorValues] = useState<Record<string, number>>(() =>
    Object.fromEntries((rule?.factors ?? []).map(f => [f.id, f.defaultValue]))
  )
  const [editedRates, setEditedRates] = useState<Partial<Record<string, Partial<Record<TenureMonth, number>>>>>({})
  const [loanAmount, setLoanAmount] = useState(600000)
  const [selectedBand, setSelectedBand] = useState<CibilBand>('800+')
  const [editingCell, setEditingCell] = useState<{ band: CibilBand; tenure: TenureMonth } | null>(null)
  const [editCellValue, setEditCellValue] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [gridFlash, setGridFlash] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const prevDiscount = useRef(0)

  const saveMut = useMutation({
    mutationFn: () => {
      if (!rule) throw new Error('No rule')
      // Build final grid with any edited cells merged in
      const finalRates: Record<string, Record<string, number>> = {}
      for (const band of CIBIL_BANDS) {
        finalRates[band] = {}
        for (const t of TENURE_OPTIONS) {
          finalRates[band][String(t)] = editedRates[band]?.[t] ?? rule.base_rates[band]?.[t] ?? 0
        }
      }
      return rateGridsApi.save(bankCode.toUpperCase(), {
        bank_name: rule.bank_name,
        base_rates: finalRates,
        factors: factorValues
          ? rule.factors.map(f => ({ ...f, defaultValue: factorValues[f.id] ?? f.defaultValue }))
          : rule.factors,
        processing_fee_pct: rule.processing_fee_pct,
        max_ltv_pct: rule.max_ltv_pct,
        notes: rule.notes,
      })
    },
    onSuccess: () => {
      setSaveStatus('saved')
      setEditedRates({})
      qc.invalidateQueries({ queryKey: ['rate-grids'] })
      qc.invalidateQueries({ queryKey: ['admin-banks'] })
      setTimeout(() => setSaveStatus('idle'), 2500)
    },
    onError: () => { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 2500) },
  })

  const totalDiscount = (rule?.factors ?? []).reduce((sum, f) => {
    if (!activeFactors[f.id]) return sum
    return sum + (factorValues[f.id] ?? f.defaultValue)
  }, 0)

  // Flash cells when discount changes
  useEffect(() => {
    if (prevDiscount.current !== totalDiscount) {
      prevDiscount.current = totalDiscount
      setGridFlash(true)
      const t = setTimeout(() => setGridFlash(false), 600)
      return () => clearTimeout(t)
    }
  }, [totalDiscount])

  if (gridsLoading) return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
      <p className="font-semibold text-sm">Loading rate grid…</p>
    </div>
  )

  if (!rule) return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Percent className="w-10 h-10 opacity-20 mb-3" />
      <p className="font-semibold">No rate matrix for this bank.</p>
    </div>
  )

  const getBase = (band: CibilBand, t: TenureMonth) => editedRates[band]?.[t] ?? rule.base_rates[band][t]
  const getEff = (band: CibilBand, t: TenureMonth) => Math.max(getBase(band, t) - totalDiscount, 5)

  const activeCount = rule.factors.filter(f => activeFactors[f.id]).length
  const bestEff = Math.min(...CIBIL_BANDS.flatMap(b => TENURE_OPTIONS.map(t => getEff(b, t))))
  const bestBase = Math.min(...CIBIL_BANDS.flatMap(b => TENURE_OPTIONS.map(t => getBase(b, t))))

  const emiAt = (band: CibilBand, t: TenureMonth) => calcEMI(loanAmount, getEff(band, t), t)
  const baseEmiAt = (band: CibilBand, t: TenureMonth) => calcEMI(loanAmount, getBase(band, t), t)

  const factorEmiSaving = (fid: string, fval: number) => {
    if (!activeFactors[fid] || fval === 0) return 0
    const effWithout = getEff(selectedBand, 60) + fval
    return calcEMI(loanAmount, effWithout, 60) - emiAt(selectedBand, 60)
  }

  const commitEdit = () => {
    if (!editingCell) return
    const val = parseFloat(editCellValue)
    if (!isNaN(val) && val > 0) {
      setEditedRates(p => ({ ...p, [editingCell.band]: { ...p[editingCell.band], [editingCell.tenure]: val } }))
    }
    setEditingCell(null)
  }

  const exportJSON = () => {
    const payload = {
      bank_code: rule.bank_code, bank_name: rule.bank_name,
      exported_at: new Date().toISOString(),
      total_discount_applied: totalDiscount,
      active_factors: rule.factors.filter(f => activeFactors[f.id])
        .map(f => ({ id: f.id, label: f.label, value: factorValues[f.id] ?? f.defaultValue })),
      rate_grid: Object.fromEntries(CIBIL_BANDS.map(b => [b, Object.fromEntries(
        TENURE_OPTIONS.map(t => [t, { base: getBase(b, t), effective: getEff(b, t) }])
      )]))
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `rate_rules_${rule.bank_code}.json`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="flex gap-4 h-[620px]">

      {/* ── LEFT: Factor Panel ── */}
      <div className="w-[230px] shrink-0 flex flex-col bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-3 py-3 border-b border-border/40 bg-muted/20 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#003A8F]" />
              <span className="font-bold text-[12px]">Rate Factors</span>
              {activeCount > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {activeCount}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {activeCount > 0 && (
                <button onClick={() => setActiveFactors({})}
                  className="text-[9px] text-muted-foreground hover:text-foreground px-1.5 py-1 rounded-lg hover:bg-muted/50 transition-colors font-semibold">
                  Clear
                </button>
              )}
              <button
                onClick={() => setActiveFactors(Object.fromEntries(rule.factors.map(f => [f.id, true])))}
                className="text-[9px] font-bold text-[#003A8F] px-1.5 py-1 rounded-lg hover:bg-blue-50 border border-[#003A8F]/20 transition-colors flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" />All
              </button>
            </div>
          </div>

          {/* Live effective rate summary */}
          <div className={clsx(
            'rounded-xl p-2.5 border transition-all duration-500',
            totalDiscount > 0
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-muted/30 border-border/40'
          )}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Effective Rate</span>
              {totalDiscount > 0 && (
                <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingDown className="w-2.5 h-2.5" />−{pct(totalDiscount)}
                </span>
              )}
            </div>
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className={clsx(
                  'text-[22px] font-black leading-none transition-all duration-300',
                  totalDiscount > 0 ? 'text-emerald-700' : 'text-foreground'
                )}>
                  <AnimatedRate value={bestEff} />
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">Best offer</div>
              </div>
              {totalDiscount > 0 && (
                <div className="text-right">
                  <div className="text-[12px] font-black text-muted-foreground/50 line-through leading-none">
                    {pct(bestBase)}
                  </div>
                  <div className="text-[9px] text-muted-foreground">was</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Factor list */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {rule.factors.map(f => (
            <FactorRow
              key={f.id}
              f={f}
              isOn={!!activeFactors[f.id]}
              value={factorValues[f.id] ?? f.defaultValue}
              onToggle={() => setActiveFactors(p => ({ ...p, [f.id]: !p[f.id] }))}
              onChange={v => setFactorValues(p => ({ ...p, [f.id]: v }))}
              emiSaving={factorEmiSaving(f.id, factorValues[f.id] ?? f.defaultValue)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border/40 px-3 py-2.5 bg-muted/10 shrink-0 space-y-1.5">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Effective @ 60m</p>
          {CIBIL_BANDS.map(band => {
            const eff = getEff(band, 60)
            const base = getBase(band, 60)
            const c = rateToColor(eff)
            return (
              <div key={band} className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{band}</span>
                <div className="flex items-center gap-1.5">
                  {totalDiscount > 0 && (
                    <span className="text-[9px] text-muted-foreground/40 line-through">{pct(base)}</span>
                  )}
                  <span className={clsx('text-[11px] font-black px-1.5 py-0.5 rounded-md transition-all duration-300', c.bg, c.text)}>
                    <AnimatedRate value={eff} />
                  </span>
                </div>
              </div>
            )
          })}
          <div className="pt-1.5 border-t border-border/40 space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Proc. Fee</span><span className="font-semibold">{pct(rule.processing_fee_pct)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Max LTV</span><span className="font-semibold">{rule.max_ltv_pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CENTER: Rate Grid ── */}
      <div className="flex-1 min-w-0 flex flex-col bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {/* Grid header */}
        <div className="px-4 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <Percent className="w-3.5 h-3.5 text-[#003A8F]" />
            <span className="font-bold text-[13px]">CIBIL × Tenure Grid</span>
            {totalDiscount > 0 && (
              <span className={clsx(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all duration-300',
                'bg-emerald-100 text-emerald-700 border-emerald-200'
              )}>
                <TrendingDown className="w-3 h-3" />−{pct(totalDiscount)} live
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {Object.keys(editedRates).length > 0 && (
              <button onClick={() => setEditedRates({})}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 text-[10px] font-bold hover:bg-amber-100 transition-colors">
                <RotateCcw className="w-2.5 h-2.5" />Reset
              </button>
            )}
            <button
              onClick={() => { setSaveStatus('saving'); saveMut.mutate() }}
              disabled={saveMut.isPending}
              className={clsx(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-colors',
                saveStatus === 'saved'  ? 'bg-emerald-50 border-emerald-300 text-emerald-700' :
                saveStatus === 'error'  ? 'bg-red-50 border-red-300 text-red-700' :
                'bg-[#003A8F]/5 border-[#003A8F]/30 text-[#003A8F] hover:bg-[#003A8F]/10'
              )}>
              <CloudUpload className="w-2.5 h-2.5" />
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Failed' : 'Save to DB'}
            </button>
            <button onClick={exportJSON}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-muted-foreground text-[10px] font-semibold hover:bg-muted/50 transition-colors">
              <Download className="w-2.5 h-2.5" />Export
            </button>
            {/* Legend */}
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
              {[
                { color: 'bg-emerald-100 border-emerald-300', label: '<9%' },
                { color: 'bg-lime-100 border-lime-300', label: '9–10%' },
                { color: 'bg-amber-100 border-amber-300', label: '10–11%' },
                { color: 'bg-red-100 border-red-300', label: '>11%' },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-0.5">
                  <span className={`w-2 h-2 rounded border inline-block ${l.color}`} />{l.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Double-click hint */}
        <div className="px-4 py-1 bg-muted/10 border-b border-border/20 shrink-0">
          <span className="text-[9px] text-muted-foreground/60">Double-click any cell to edit its base rate</span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-900">
                <th className="px-4 py-2 text-left text-[9px] font-bold text-slate-400 uppercase tracking-widest w-32 sticky left-0 z-30 bg-slate-900 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.25)]">
                  CIBIL
                </th>
                {TENURE_OPTIONS.map(t => (
                  <th key={t} className="px-1.5 py-2 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest min-w-[72px]">
                    {t}m
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {CIBIL_BANDS.map((band, bi) => (
                <tr key={band} className={bi % 2 === 0 ? 'bg-card' : 'bg-slate-50 dark:bg-slate-800/50'}>
                  <td className={clsx('px-4 py-2.5 sticky left-0 z-10 border-r border-border/20 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)]', bi % 2 === 0 ? 'bg-card' : 'bg-slate-50 dark:bg-slate-800/50')}>
                    <div className="font-black text-[12px] text-foreground leading-tight">{band}</div>
                    <div className="text-[9px] text-muted-foreground">
                      {band === '800+' ? 'Excellent' : band === '750–799' ? 'Very Good' : band === '700–749' ? 'Good' : 'Fair'}
                    </div>
                  </td>
                  {TENURE_OPTIONS.map(t => (
                    <td key={t} className="px-1 py-1.5 text-center">
                      <RateCell
                        base={getBase(band, t)}
                        eff={getEff(band, t)}
                        hasDiscount={totalDiscount > 0}
                        isEditing={editingCell?.band === band && editingCell?.tenure === t}
                        editValue={editCellValue}
                        onDoubleClick={() => { setEditingCell({ band, tenure: t }); setEditCellValue(String(getBase(band, t))) }}
                        onEditChange={setEditCellValue}
                        onEditBlur={commitEdit}
                        onEditKey={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingCell(null) }}
                        isEdited={!!editedRates[band]?.[t]}
                        flash={gridFlash}
                      />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Impact row */}
              {totalDiscount > 0 && (
                <tr className="bg-emerald-50/80 border-t-2 border-emerald-200">
                  <td className="px-4 py-2 sticky left-0 z-10 bg-emerald-50/80 border-r border-emerald-200 shadow-[4px_0_6px_-2px_rgba(16,185,129,0.15)]">
                    <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />Impact
                    </div>
                    <div className="text-[9px] text-muted-foreground">{activeCount} factor{activeCount !== 1 ? 's' : ''}</div>
                  </td>
                  {TENURE_OPTIONS.map(t => {
                    const saving = baseEmiAt(selectedBand, t) - emiAt(selectedBand, t)
                    return (
                      <td key={t} className="px-1 py-2 text-center">
                        <div className="text-[11px] font-black text-emerald-700">−{pct(totalDiscount)}</div>
                        <div className="text-[9px] text-emerald-600 font-semibold">−{INR(saving)}/mo</div>
                      </td>
                    )
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Notes */}
        <div className="border-t border-border/40 px-4 py-2 bg-muted/10 shrink-0">
          <button onClick={() => setShowNotes(n => !n)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground font-semibold transition-colors">
            <Info className="w-3 h-3" />
            {rule.notes.length} Bank Note{rule.notes.length !== 1 ? 's' : ''}
            <ChevronDown className={`w-3 h-3 transition-transform ${showNotes ? 'rotate-180' : ''}`} />
          </button>
          {showNotes && (
            <ul className="mt-1.5 space-y-0.5">
              {rule.notes.map((n, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-primary/40 mt-1.5 shrink-0" />{n}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── RIGHT: EMI Panel ── */}
      <div className="w-[240px] shrink-0 flex flex-col bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-3 py-3 border-b border-border/40 bg-muted/20 shrink-0">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Calculator className="w-3.5 h-3.5 text-[#003A8F]" />
            <span className="font-bold text-[12px]">EMI</span>
          </div>
          {/* Loan amount */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <BadgeIndianRupee className="w-2.5 h-2.5" />Loan Amount
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
              <input type="number" min={100000} max={10000000} step={50000}
                value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))}
                className="h-9 w-full border border-border/70 rounded-xl pl-6 pr-2 text-xs font-bold bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <input type="range" min={100000} max={5000000} step={50000}
              value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5 cursor-pointer" />
            <div className="flex justify-between text-[8px] text-muted-foreground">
              <span>₹1L</span><span className="font-bold text-foreground">{INR(loanAmount)}</span><span>₹50L</span>
            </div>
          </div>
        </div>

        {/* CIBIL selector */}
        <div className="px-3 py-2 border-b border-border/30 shrink-0">
          <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">CIBIL Band</label>
          <div className="grid grid-cols-2 gap-1">
            {CIBIL_BANDS.map(band => (
              <button key={band} onClick={() => setSelectedBand(band)}
                className={clsx(
                  'py-1.5 rounded-lg text-[10px] font-bold border transition-all',
                  selectedBand === band
                    ? 'bg-[#003A8F] text-white border-[#003A8F] shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted/70'
                )}>
                {band}
              </button>
            ))}
          </div>
        </div>

        {/* EMI list — all tenures for selected band */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {TENURE_OPTIONS.map(t => {
            const eff = getEff(selectedBand, t)
            const emi = emiAt(selectedBand, t)
            const baseEmi = baseEmiAt(selectedBand, t)
            const saving = baseEmi - emi
            const c = rateToColor(eff)
            return (
              <div key={t} className={clsx(
                'rounded-xl border px-3 py-2.5 transition-all duration-300',
                c.bg, c.border,
                gridFlash && totalDiscount > 0 ? 'ring-2 ring-emerald-400/50' : ''
              )}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground">{t} months</span>
                  <span className={clsx('text-[11px] font-black', c.text)}>
                    <AnimatedRate value={eff} />
                  </span>
                </div>
                <div className={clsx('text-[16px] font-black leading-none text-foreground transition-all duration-300')}>
                  {INR(emi)}
                  <span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                </div>
                {saving > 0 ? (
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground/50 line-through">{INR(baseEmi)}</span>
                    <span className="text-[9px] font-bold text-emerald-600">−{INR(saving)}/mo</span>
                  </div>
                ) : (
                  <div className="mt-1 text-[9px] text-muted-foreground/50">Total {INR(emi * t)}</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Savings summary */}
        {totalDiscount > 0 && (
          <div className="border-t border-border/40 px-3 py-2.5 bg-emerald-50/60 shrink-0">
            <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <TrendingDown className="w-2.5 h-2.5" />Total Savings — {selectedBand}
            </p>
            <div className="space-y-1">
              {([36, 60, 84] as TenureMonth[]).map(t => {
                const saved = (baseEmiAt(selectedBand, t) - emiAt(selectedBand, t)) * t
                return (
                  <div key={t} className="flex justify-between items-center">
                    <span className="text-[10px] text-emerald-600">{t}m tenure</span>
                    <span className="text-[11px] font-black text-emerald-700">{INR(saved)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Add Partner Form ──────────────────────────────────────────────────────────
function AddPartnerForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    code: '', name: '', bank_type: 'PRIVATE',
    base_rate: 9.0, best_rate: 7.5, min_cibil_score: 650,
    max_foir_pct: 50, min_income: 15000, processing_fee_pct: 0.5,
    ev_discount_pct: 0, is_baas_eligible: false,
  })
  const mut = useMutation({
    mutationFn: (d: typeof form) => banksApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-banks'] }); onSuccess() },
  })
  const fields = [
    { key: 'code', label: 'Bank Code', type: 'text' },
    { key: 'name', label: 'Bank Name', type: 'text' },
    { key: 'base_rate', label: 'Base Rate (%)', type: 'number' },
    { key: 'best_rate', label: 'Best Rate (%)', type: 'number' },
    { key: 'min_cibil_score', label: 'Min CIBIL', type: 'number' },
    { key: 'max_foir_pct', label: 'Max FOIR (%)', type: 'number' },
    { key: 'min_income', label: 'Min Income (₹)', type: 'number' },
    { key: 'processing_fee_pct', label: 'Proc. Fee (%)', type: 'number' },
    { key: 'ev_discount_pct', label: 'EV Discount (%)', type: 'number' },
  ]
  return (
    <div className="bg-card rounded-2xl border-2 border-primary/20 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/40 bg-primary/5 flex items-center justify-between">
        <span className="font-bold text-[14px]">New Grid Partner</span>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {fields.map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</label>
              <input className="w-full border border-border/70 rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                type={type} value={(form as Record<string, unknown>)[key] as string}
                onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Bank Type</label>
            <select className="w-full border border-border/70 rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={form.bank_type} onChange={e => setForm(f => ({ ...f, bank_type: e.target.value }))}>
              {['PSU', 'PRIVATE', 'COOPERATIVE', 'NBFC', 'RRB', 'SFB'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2 pb-0.5">
            <input type="checkbox" checked={form.is_baas_eligible}
              onChange={e => setForm(f => ({ ...f, is_baas_eligible: e.target.checked }))}
              className="w-4 h-4 accent-blue-600 shrink-0" />
            <label className="text-sm text-muted-foreground">BaaS Eligible</label>
          </div>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => mut.mutate(form)} disabled={mut.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[#003A8F] hover:bg-[#002d6e] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
            <Check className="w-3.5 h-3.5" />{mut.isPending ? 'Creating…' : 'Create Partner'}
          </button>
          <button onClick={onCancel} className="px-4 py-2 border border-border text-sm text-muted-foreground rounded-xl hover:bg-muted/50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function BankPartners() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-banks'], queryFn: banksApi.list })
  const { data: gridsData, isLoading: gridsLoading } = useQuery({ queryKey: ['rate-grids'], queryFn: rateGridsApi.list })
  const [showForm, setShowForm] = useState(false)
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null)
  const matrixRef = useRef<HTMLDivElement>(null)

  const toggleMut = useMutation({
    mutationFn: (id: string) => banksApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-banks'] }),
  })

  // Index grids by bank_code for O(1) lookup
  const gridsByCode: Record<string, RateGridRecord> = {}
  for (const g of gridsData ?? []) gridsByCode[g.bank_code] = g

  const apiBanks: Record<string, unknown>[] = data?.banks || []

  const displayBanks = apiBanks.length > 0
    ? apiBanks.filter(b => (b.name as string)?.trim().toUpperCase() !== 'AU')
    : BANK_RATE_RULES.map(r => ({
        id: r.bank_code, code: r.bank_code, name: r.bank_name,
        bank_type: r.bank_type, is_active: true, is_baas_eligible: false,
        base_rate: r.base_rates['800+'][60],
        best_rate: r.base_rates['800+'][12],
        processing_fee_pct: r.processing_fee_pct,
      }))

  const selectedBank = displayBanks.find(b => b.id === selectedBankId)

  // Get display rates for a bank card — prefer DB grid, fall back to DB scalars
  const cardRates = (b: Record<string, unknown>) => {
    const code = (b.code as string)?.toUpperCase()
    const dbGrid = gridsByCode[code]
    if (dbGrid) {
      const best800 = dbGrid.base_rates['800+'] ?? {}
      const std750  = dbGrid.base_rates['750–799'] ?? {}
      return {
        base: Number(std750['60'] ?? std750[60] ?? b.base_rate),
        best: Number(best800['12'] ?? best800[12] ?? b.best_rate),
      }
    }
    return { base: b.base_rate as number, best: b.best_rate as number }
  }

  const selectBank = (id: string) => {
    setSelectedBankId(prev => prev === id ? null : id)
    setTimeout(() => matrixRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
  }

  return (
    <div className="space-y-4 pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Grid <span className="text-[#003A8F]">Management</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {displayBanks.length} partners · select a bank to configure its rate matrix
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#003A8F] hover:bg-[#002d6e] text-white text-sm font-bold rounded-xl transition-all shadow-[0_2px_8px_rgba(0,58,143,0.25)] hover:shadow-[0_4px_16px_rgba(0,58,143,0.35)] active:scale-95">
          <Plus className="w-4 h-4" />Add Partner
        </button>
      </div>

      {showForm && <AddPartnerForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />}

      {/* ── Bank Cards ── */}
      <div className="grid grid-cols-4 gap-2.5">
        {isLoading && apiBanks.length === 0
          ? Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />)
          : displayBanks.map(b => {
              const isSelected = b.id === selectedBankId
              const typeStyle = BANK_TYPE_STYLE[b.bank_type as string] || BANK_TYPE_STYLE.PRIVATE
              return (
                <button key={b.id as string} onClick={() => selectBank(b.id as string)}
                  className={clsx(
                    'text-left px-3.5 py-3 rounded-2xl border-2 transition-all duration-200 hover:shadow-md active:scale-[0.98]',
                    isSelected
                      ? 'border-[#003A8F] bg-[#003A8F]/5 shadow-[0_0_0_3px_rgba(0,58,143,0.12)]'
                      : 'border-border/60 bg-card hover:border-border'
                  )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                      isSelected ? 'bg-[#003A8F] text-white' : 'bg-muted text-muted-foreground')}>
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${typeStyle}`}>
                      {b.bank_type as string}
                    </span>
                  </div>
                  <p className={clsx('text-[12px] font-bold leading-tight mb-1.5 truncate',
                    isSelected ? 'text-[#003A8F]' : 'text-foreground')}>
                    {(b.name as string).replace(' (State Bank of India)', '').replace('Small Finance Bank', 'SFB')}
                  </p>
                  {(() => {
                    const { base, best } = cardRates(b)
                    return (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[8px] text-muted-foreground uppercase">Std (750/60m)</p>
                          <p className="text-[12px] font-black text-foreground">{pct(base)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-muted-foreground uppercase">Best (800+/12m)</p>
                          <p className="text-[12px] font-black text-emerald-600">{pct(best)}</p>
                        </div>
                      </div>
                    )
                  })()}
                  {apiBanks.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-border/30 flex justify-between items-center">
                      <span className={clsx('text-[9px] font-bold', b.is_active ? 'text-emerald-600' : 'text-muted-foreground')}>
                        {b.is_active ? '● Active' : '○ Off'}
                      </span>
                      <button onClick={e => { e.stopPropagation(); toggleMut.mutate(b.id as string) }}
                        title="Toggle active">
                        {b.is_active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  )}
                  {isSelected && (
                    <div className="mt-1.5 text-center text-[9px] font-bold text-[#003A8F] flex items-center justify-center gap-0.5">
                      <ChevronDown className="w-2.5 h-2.5" />Open
                    </div>
                  )}
                </button>
              )
            })}
      </div>

      {/* ── Rate Matrix ── */}
      <div ref={matrixRef}>
        {selectedBank ? (
          <div className="space-y-2">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border/60" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/40">
                <Percent className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] font-bold text-muted-foreground">
                  {(selectedBank.name as string).replace(' (State Bank of India)', '')}
                </span>
                <span className="text-[10px] font-bold text-[#003A8F] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                  Rate Matrix
                </span>
              </div>
              <div className="h-px flex-1 bg-border/60" />
              <button onClick={() => setSelectedBankId(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <RateMatrix
              bankCode={selectedBank.code as string}
              bankName={selectedBank.name as string}
              dbGrid={gridsByCode[(selectedBank.code as string)?.toUpperCase()]}
              gridsLoading={gridsLoading}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-border/40 rounded-2xl">
            <Sliders className="w-8 h-8 opacity-20 mb-3" />
            <p className="font-semibold text-sm">Select a bank above to configure its rate matrix</p>
            <p className="text-xs mt-1 opacity-60">Toggle factors · adjust sliders · watch rates update live</p>
          </div>
        )}
      </div>
    </div>
  )
}
