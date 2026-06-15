'use client'

import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import SignIn from '@/components/SignIn'
import AdminDashboard from '@/components/admin/AdminDashboard'
import AdminOrderDetail from '@/components/admin/AdminOrderDetail'

type View = 'loading' | 'signedout' | 'denied' | 'dashboard' | 'detail'

export default function AdminPage() {
  const [view,            setView]            = useState<View>('loading')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  useEffect(() => {
    const sb = createClient()
    if (!sb) { setView('denied'); return }

    function applySession(session: Session | null) {
      if (!session?.user) { setView('signedout'); return }
      const role = session.user.app_metadata?.role
      setView(role === 'admin' ? 'dashboard' : 'denied')
    }

    sb.auth.getSession().then((res: { data: { session: Session | null } }) => applySession(res.data.session))

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event: unknown, session: Session | null) => applySession(session))

    return () => subscription.unsubscribe()
  }, [])

  function handleSelectOrder(id: string) {
    setSelectedOrderId(id)
    setView('detail')
  }

  function handleBack() {
    setSelectedOrderId(null)
    setView('dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <h1 className="text-sm font-semibold text-[#0A0A0A] tracking-tight">GRACE Admin</h1>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#0A0A0A]/10 text-[#0A0A0A] uppercase tracking-widest">
            Internal
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {view === 'loading' && (
          <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
            Checking access…
          </div>
        )}

        {view === 'signedout' && (
          <div className="max-w-sm mx-auto py-16">
            <div className="text-center mb-8">
              <p className="text-lg font-semibold text-gray-700">GRACE Admin</p>
              <p className="text-sm text-gray-400 mt-1">Sign in with your admin account to continue.</p>
            </div>
            <SignIn />
          </div>
        )}

        {view === 'denied' && (
          <div className="text-center py-24 space-y-3">
            <p className="text-lg font-semibold text-gray-700">Access Denied</p>
            <p className="text-sm text-gray-400">
              This account doesn’t have admin access. Ask an administrator to grant your account the admin role.
            </p>
          </div>
        )}

        {view === 'dashboard' && (
          <AdminDashboard onSelectOrder={handleSelectOrder} />
        )}

        {view === 'detail' && selectedOrderId && (
          <AdminOrderDetail orderId={selectedOrderId} onBack={handleBack} />
        )}
      </main>
    </div>
  )
}
