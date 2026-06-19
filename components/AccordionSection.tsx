'use client'

import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  icon?: ReactNode
  defaultOpen?: boolean
  // Controlled mode — pass isOpen + onToggle to let the parent manage which section is open
  isOpen?: boolean
  onToggle?: () => void
  children: ReactNode
  badge?: string | number
}

export default function AccordionSection({
  title,
  icon,
  defaultOpen = false,
  isOpen,
  onToggle,
  children,
  badge,
}: Props) {
  // Controlled: use isOpen/onToggle. Uncontrolled: manage internal state via defaultOpen.
  const controlled = isOpen !== undefined

  return (
    <div className={`overflow-hidden bg-white ${controlled ? '' : 'border border-slate-200 rounded-xl'}`}>
      <button
        type="button"
        onClick={controlled ? onToggle : undefined}
        className={`w-full flex items-center justify-between text-left transition-colors ${
          controlled
            ? 'px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100'
            : 'px-4 py-3'
        }`}
      >
        <span className="flex items-center gap-3">
          {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
          <span className={`font-semibold text-gray-800 flex items-center gap-2 ${controlled ? 'text-sm' : 'text-xs uppercase tracking-wider'}`}>
            {title}
            {badge !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full bg-grace-ink text-white text-[9px] font-bold">{badge}</span>
            )}
          </span>
        </span>
        <ChevronDown
          size={15}
          className={`text-gray-400 transition-transform duration-200 shrink-0 ${(controlled ? isOpen : defaultOpen) ? 'rotate-180' : ''}`}
        />
      </button>
      {(controlled ? isOpen : defaultOpen) && (
        <div className={`border-t border-slate-100 ${controlled ? 'px-4 pb-4 pt-3' : 'px-3 pb-3 pt-2'}`}>
          {children}
        </div>
      )}
    </div>
  )
}
