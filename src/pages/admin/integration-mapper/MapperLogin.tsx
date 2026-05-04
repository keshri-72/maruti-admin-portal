import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../../api/admin'
import { useAdminAuthStore } from '../../../store/adminAuthStore'
import { Car, LayoutGrid, Workflow, Loader2, ArrowRight, Shield } from 'lucide-react'

const FEATURES = [
  { icon: LayoutGrid, label: 'Grid Management',    desc: 'Bank rate grids & partner config' },
  { icon: Workflow,   label: 'Integration Mapper', desc: 'AI-powered API field mapping'     },
]

export function MapperLogin() {
  const [email, setEmail] = useState('admin@maruti.co.in')
  const [password, setPassword] = useState('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { setAuth } = useAdminAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(email, password)
      setAuth(res.admin_id, res.access_token, res.refresh_token)
      navigate('/admin/banks')
    } catch {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-[#111113] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">

          {/* Header band */}
          <div className="bg-gradient-to-r from-[#003A8F] to-[#0055CC] px-8 py-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight tracking-tight">Maruti Finance</p>
              <p className="text-blue-200 text-xs mt-0.5 font-medium">Admin Console</p>
            </div>
          </div>

          {/* Feature pills */}
          <div className="px-8 pt-6 pb-2 flex gap-2.5">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-xl p-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-[11px] font-bold text-white/80 leading-none">{label}</span>
                </div>
                <p className="text-[10px] text-white/35 leading-tight">{desc}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="px-8 pt-4 pb-8">
            <p className="text-white/50 text-xs mb-5">Sign in to access the admin console.</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#1A1A1D] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all text-sm"
                  placeholder="admin@maruti.co.in"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#1A1A1D] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#003A8F] hover:bg-[#002d6e] text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_12px_rgba(0,58,143,0.40)] hover:shadow-[0_4px_20px_rgba(0,58,143,0.55)] active:scale-[0.99] mt-1"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</>
                ) : (
                  <>Sign In to Admin Console <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[11px] text-white/20 mt-5 flex items-center justify-center gap-1.5">
          <Shield className="w-3 h-3" /> Authorized personnel only
        </p>
      </div>
    </div>
  )
}
