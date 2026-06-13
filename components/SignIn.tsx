'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/auth'

interface Props {
  onSuccess?: () => void
}

export default function SignIn({ onSuccess }: Props) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')

    let err: string | null = null
    if (mode === 'signin') {
      err = await signIn(email, password)
    } else {
      if (!name.trim()) { setError('Name is required.'); setLoading(false); return }
      err = await signUp(name.trim(), email, password)
      if (!err) {
        setNotice('Account created! Check your email to confirm, then sign in.')
        setMode('signin')
        setLoading(false)
        return
      }
    }

    if (err) {
      setError(err)
    } else {
      onSuccess?.()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-green flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl font-bold">G</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">GRACE Enterprise</h1>
          <p className="text-sm text-gray-500 mt-1">AI-Powered Fashion Design Studio</p>
        </div>

        <div className="card">
          <div className="flex bg-slate-100 rounded-lg p-0.5 mb-6">
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setNotice('') }}
                className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
                  mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Full Name</label>
                <input type="text" className="input-field text-sm" placeholder="Your name"
                  value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="text-[11px] text-gray-500 mb-1 block">Email</label>
              <input type="email" className="input-field text-sm" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-[11px] text-gray-500 mb-1 block">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input-field text-sm pr-10"
                  placeholder="Min. 6 characters" value={password}
                  onChange={e => setPassword(e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            {error  && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            {notice && <p className="text-xs text-brand-green bg-green-50 rounded-lg px-3 py-2">{notice}</p>}
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-1">
              {loading
                ? <><Loader2 size={14} className="animate-spin"/> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
                : <><Sparkles size={14}/> {mode === 'signin' ? 'Sign In' : 'Create Account'}</>}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-4">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setNotice('') }}
            className="text-brand-green hover:underline font-medium">
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
