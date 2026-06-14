'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Loader2, Package } from 'lucide-react'
import SupplierDashboard from '@/components/supplier/SupplierDashboard'
import SupplierOrderDetail from '@/components/supplier/SupplierOrderDetail'
import SignIn from '@/components/SignIn'

export default function SupplierPortalPage() {
  const { user, loading, signOut } = useAuth()
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center">
            <Package size={18} className="text-white" />
          </div>
          <Loader2 size={20} className="animate-spin text-brand-green" />
        </div>
      </div>
    )
  }

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-brand-green flex items-center justify-center mx-auto mb-4">
              <Package size={22} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">GRACE Supplier Portal</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sign in with the email address your orders are assigned to.
            </p>
          </div>
          <SignIn />
        </div>
      </div>
    )
  }

  // Order detail view
  if (selectedOrderId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SupplierOrderDetail
          orderId={selectedOrderId}
          supplierEmail={user.email}
          onBack={() => setSelectedOrderId(null)}
        />
      </div>
    )
  }

  // Dashboard
  return (
    <SupplierDashboard
      supplierEmail={user.email}
      supplierName={user.name}
      onSelectOrder={setSelectedOrderId}
      onSignOut={signOut}
    />
  )
}
