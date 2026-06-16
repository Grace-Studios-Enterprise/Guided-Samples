'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { FREE_GENERATION_LIMIT, type UserCredits } from '@/lib/aiCredits'
import { useAuth } from '@/lib/auth'

const ANON_STORAGE_KEY = 'grace_ai_free_used'

type AICreditsContextType = {
  /** How many of the free generations have been consumed. */
  freeUsed: number
  /** Total free generations allowed. */
  freeLimit: number
  /** Remaining paid AI credit balance. */
  creditBalance: number
  /** Cumulative dollars (cents) spent on credit packs — used for activation offset. */
  spendCents: number
  /** Whether the paywall modal is open. */
  isPaywallOpen: boolean
  openPaywall: () => void
  closePaywall: () => void
  /** Returns true if the user may trigger another AI generation. */
  canGenerate: () => boolean
  /**
   * Returns headers to attach to generation API requests.
   * Includes the Bearer token for authenticated users, or the free-used
   * count header for anonymous users so the server can enforce limits.
   */
  getGenerationHeaders: () => Promise<Record<string, string>>
  /** Call after a successful generation to sync local state. */
  onGenerationComplete: () => void
  /** Manually re-fetch credits from Supabase (e.g. after returning from Stripe). */
  refreshCredits: () => void
}

const AICreditsContext = createContext<AICreditsContextType | null>(null)

export function AICreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [freeUsed, setFreeUsed] = useState(0)
  const [creditBalance, setCreditBalance] = useState(0)
  const [spendCents, setSpendCents] = useState(0)
  const [isPaywallOpen, setIsPaywallOpen] = useState(false)

  // Load from localStorage for anonymous users
  const loadAnon = () => {
    try {
      const raw = localStorage.getItem(ANON_STORAGE_KEY)
      setFreeUsed(parseInt(raw ?? '0', 10) || 0)
    } catch {}
  }

  // Fetch from Supabase for authenticated users
  const loadFromDB = useCallback(async () => {
    if (!user) return
    const sb = createClient()
    if (!sb) return
    const { data } = await sb
      .from('user_credits')
      .select('free_generations_used, ai_credit_balance, ai_spend_cents')
      .eq('user_id', user.id)
      .single()
    if (data) {
      const c = data as Pick<UserCredits, 'free_generations_used' | 'ai_credit_balance' | 'ai_spend_cents'>
      setFreeUsed(c.free_generations_used)
      setCreditBalance(c.ai_credit_balance)
      setSpendCents(c.ai_spend_cents)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadFromDB()
    } else {
      loadAnon()
      setCreditBalance(0)
      setSpendCents(0)
    }
  }, [user, loadFromDB])

  const canGenerate = (): boolean => {
    if (freeUsed < FREE_GENERATION_LIMIT) return true
    if (creditBalance > 0) return true
    return false
  }

  const getGenerationHeaders = async (): Promise<Record<string, string>> => {
    if (user) {
      const sb = createClient()
      if (sb) {
        const { data: { session } } = await sb.auth.getSession()
        if (session?.access_token) {
          return { Authorization: `Bearer ${session.access_token}` }
        }
      }
      return {}
    }
    // Anonymous — send local count so the server can gate
    return { 'X-AI-Free-Used': String(freeUsed) }
  }

  const onGenerationComplete = useCallback(() => {
    if (user) {
      // Re-fetch from DB; the server already consumed one credit
      loadFromDB()
    } else {
      const next = freeUsed + 1
      setFreeUsed(next)
      try { localStorage.setItem(ANON_STORAGE_KEY, String(next)) } catch {}
    }
  }, [user, freeUsed, loadFromDB])

  const refreshCredits = () => {
    if (user) loadFromDB()
    else loadAnon()
  }

  return (
    <AICreditsContext.Provider value={{
      freeUsed,
      freeLimit: FREE_GENERATION_LIMIT,
      creditBalance,
      spendCents,
      isPaywallOpen,
      openPaywall: () => setIsPaywallOpen(true),
      closePaywall: () => setIsPaywallOpen(false),
      canGenerate,
      getGenerationHeaders,
      onGenerationComplete,
      refreshCredits,
    }}>
      {children}
    </AICreditsContext.Provider>
  )
}

export function useAICredits(): AICreditsContextType {
  const ctx = useContext(AICreditsContext)
  if (!ctx) throw new Error('useAICredits must be used within AICreditsProvider')
  return ctx
}
