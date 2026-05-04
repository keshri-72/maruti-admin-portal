import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { applicationsApi } from '../../api/admin'
import { SearchIcon, ChevronDownIcon, ExternalLinkIcon } from 'lucide-react'
import clsx from 'clsx'
import type { LoanApplication, LoanStatus } from '../../types'

const STATUS_COLORS: Record<LoanStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  OFFERS_GENERATED: 'bg-cyan-100 text-cyan-700',
  OFFER_ACCEPTED: 'bg-indigo-100 text-indigo-700',
  KYC_PENDING: 'bg-yellow-100 text-yellow-700',
  DOCUMENTS_PENDING: 'bg-orange-100 text-orange-700',
  SUBMITTED_TO_BANK: 'bg-purple-100 text-purple-700',
  BANK_PROCESSING: 'bg-violet-100 text-violet-700',
  APPROVED: 'bg-green-100 text-green-700',
  CONDITIONALLY_APPROVED: 'bg-lime-100 text-lime-700',
  REJECTED: 'bg-red-100 text-red-700',
  DISBURSED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-gray-200 text-gray-500',
}

const ALL_STATUSES: LoanStatus[] = [
  'DRAFT', 'IN_PROGRESS', 'OFFERS_GENERATED', 'OFFER_ACCEPTED',
  'KYC_PENDING', 'DOCUMENTS_PENDING', 'SUBMITTED_TO_BANK', 'BANK_PROCESSING',
  'APPROVED', 'CONDITIONALLY_APPROVED', 'REJECTED', 'DISBURSED', 'CANCELLED',
]

interface ApplicationRow {
  id: string
  application_no: string
  customer_name: string
  customer_phone: string
  vehicle_model: string
  loan_amount: number
  status: LoanStatus
  current_step: number
  bank_name?: string
  created_at: string
}

interface ApplicationDetail extends ApplicationRow {
  email?: string
  cibil_score?: number
  employment_type?: string
  monthly_income?: number
  rate_of_interest?: number
  emi_amount?: number
  tenure_months?: number
  submission_status?: string
  external_ref_id?: string
}

function formatLakh(n: number) {
  return `₹${(n / 100000).toFixed(1)}L`
}

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}d ago`
  const hours = Math.floor(diff / 3600000)
  if (hours > 0) return `${hours}h ago`
  return 'Just now'
}

function DetailModal({
  app,
  onClose,
}: {
  app: ApplicationDetail
  onClose: () => void
}) {
  const infoRows = [
    ['Application No', app.application_no],
    ['Customer', app.customer_name],
    ['Phone', app.customer_phone],
    ['Email', app.email ?? '—'],
    ['Vehicle', app.vehicle_model],
    ['Loan Amount', formatLakh(app.loan_amount)],
    ['Status', app.status],
    ['Current Step', `Step ${app.current_step}`],
    ['CIBIL Score', app.cibil_score?.toString() ?? '—'],
    ['Employment', app.employment_type ?? '—'],
    ['Monthly Income', app.monthly_income ? `₹${app.monthly_income.toLocaleString()}` : '—'],
    ['Rate', app.rate_of_interest ? `${app.rate_of_interest.toFixed(2)}%` : '—'],
    ['EMI', app.emi_amount ? `₹${app.emi_amount.toLocaleString()}` : '—'],
    ['Tenure', app.tenure_months ? `${app.tenure_months} months` : '—'],
    ['Bank', app.bank_name ?? '—'],
    ['Bank Ref', app.external_ref_id ?? '—'],
    ['Submission Status', app.submission_status ?? '—'],
    ['Applied', new Date(app.created_at).toLocaleString('en-IN')],
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900">Application Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5">
          <div className="space-y-2">
            {infoRows.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className={clsx(
                  'font-medium',
                  label === 'Status' && value in STATUS_COLORS
                    ? `px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[value as LoanStatus]}`
                    : 'text-gray-800'
                )}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Applications() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LoanStatus | ''>('')
  const [page, setPage] = useState(1)
  const [selectedApp, setSelectedApp] = useState<ApplicationDetail | null>(null)
  const PAGE_SIZE = 20

  const { data, isLoading } = useQuery({
    queryKey: ['admin-applications', page, search, statusFilter],
    queryFn: () =>
      applicationsApi.list({
        page,
        size: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const applications: ApplicationRow[] = data?.items ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 w-full"
            placeholder="Search by app no, customer name, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="relative">
          <select
            className="input appearance-none pr-8 min-w-[180px]"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as LoanStatus | ''); setPage(1) }}
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['App No', 'Customer', 'Vehicle', 'Loan', 'Status', 'Step', 'Bank', 'Applied', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">No applications found</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">{app.application_no}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 whitespace-nowrap">{app.customer_name}</p>
                      <p className="text-xs text-gray-500">{app.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{app.vehicle_model}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{formatLakh(app.loan_amount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[app.status])}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{app.current_step}/12</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{app.bank_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{timeSince(app.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedApp(app as ApplicationDetail)}
                        className="text-blue-600 hover:text-blue-700"
                        title="View details"
                      >
                        <ExternalLinkIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedApp && (
        <DetailModal app={selectedApp} onClose={() => setSelectedApp(null)} />
      )}
    </div>
  )
}
