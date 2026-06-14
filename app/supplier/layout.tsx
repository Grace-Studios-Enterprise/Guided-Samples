'use client'

/**
 * Supplier portal layout.
 * Wraps /supplier/* routes with the AuthProvider so useAuth() works.
 * Kept separate from the main app layout so supplier routing is independent.
 */

import { AuthProvider } from '@/lib/auth'

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
