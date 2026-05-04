/**
 * Admin Portal — standalone API layer
 * All admin-specific calls live here. No dependency on customer journey APIs.
 * Base URL configured via VITE_ADMIN_API_URL in .env
 */

import axios from 'axios'

// Use relative URL so all requests go through Vite's proxy — avoids CORS entirely
export const adminClient = axios.create({
  baseURL: `/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
})

// Attach JWT from localStorage
adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
adminClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status: number = error.response?.status
    if (status === 401) {
      const refresh = localStorage.getItem('admin_refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`/api/v1/auth/admin/refresh`, {
            refresh_token: refresh,
          })
          localStorage.setItem('admin_access_token', data.access_token)
          error.config.headers.Authorization = `Bearer ${data.access_token}`
          return adminClient(error.config)
        } catch {
          localStorage.removeItem('admin_access_token')
          localStorage.removeItem('admin_refresh_token')
          window.location.href = '/login'
          return Promise.reject(error)
        }
      }
      localStorage.removeItem('admin_access_token')
      localStorage.removeItem('admin_refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    adminClient.post('/auth/admin/login', { email, password }).then((r) => r.data),
}

// ── Banks ─────────────────────────────────────────────────────────────────────
export const banksApi = {
  list: () => adminClient.get('/admin/banks').then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    adminClient.post('/admin/banks', data).then((r) => r.data),
  toggle: (id: string) =>
    adminClient.patch(`/admin/banks/${id}/toggle-active`).then((r) => r.data),
  testConnection: (id: string) =>
    adminClient.get(`/admin/banks/${id}/test-connection`).then((r) => r.data),
}

// ── Rate Grids (bank rate grids stored in DB) ─────────────────────────────────
export const rateGridsApi = {
  list: () => adminClient.get('/admin/rate-grids').then((r) => r.data as RateGridRecord[]),
  get: (bankCode: string) => adminClient.get(`/admin/rate-grids/${bankCode}`).then((r) => r.data as RateGridRecord),
  save: (bankCode: string, data: Omit<RateGridRecord, 'bank_code' | 'updated_at'>) =>
    adminClient.put(`/admin/rate-grids/${bankCode}`, data).then((r) => r.data as RateGridRecord),
}

export type RateGridRecord = {
  bank_code: string
  bank_name: string
  base_rates: Record<string, Record<string, number>>
  factors: Array<{
    id: string; label: string; description: string
    defaultValue: number; maxValue: number; step: number
  }>
  processing_fee_pct: number
  max_ltv_pct: number
  notes: string[]
  updated_at?: string
}

// ── Integration Mapper ────────────────────────────────────────────────────────
export const mapperApi = {
  /** Run field mapping for a bank + stage */
  runMapping: (bankName: string, stage: string, schema: Record<string, unknown>) =>
    adminClient
      .post('/admin/integration-mapper/map', { bank_name: bankName, stage, schema })
      .then((r) => r.data),
}

// ── Applications ──────────────────────────────────────────────────────────────
export const applicationsApi = {
  list: (params?: Record<string, unknown>) =>
    adminClient.get('/admin/applications', { params }).then((r) => r.data),
  get: (id: string) =>
    adminClient.get(`/admin/applications/${id}`).then((r) => r.data),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  funnel: () => adminClient.get('/admin/analytics/funnel').then((r) => r.data),
  agents: () => adminClient.get('/admin/analytics/agents').then((r) => r.data),
}
