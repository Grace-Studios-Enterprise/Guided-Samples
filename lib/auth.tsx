'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from './supabase'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

export type User = {
  id: string
  email: string
  name: string
  brandName?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (name: string, email: string, password: string) => Promise<string | null>
  signOut: () => void
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

function toUser(su: SupabaseUser): User {
  return {
    id: su.id,
    email: su.email ?? '',
    name: su.user_metadata?.name ?? su.email?.split('@')[0] ?? 'User',
    brandName: su.user_metadata?.brand_name ?? 'GRACE',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? toUser(session.user) : null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toUser(session.user) : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  const signUp = async (name: string, email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, brand_name: 'GRACE' } },
    })
    return error?.message ?? null
  }

  const signOut = () => supabase.auth.signOut()

  const updateUser = async (updates: Partial<User>) => {
    const meta: Record<string, string> = {}
    if (updates.name) meta.name = updates.name
    if (updates.brandName) meta.brand_name = updates.brandName
    await supabase.auth.updateUser({ data: meta })
    setUser(u => u ? { ...u, ...updates } : u)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
