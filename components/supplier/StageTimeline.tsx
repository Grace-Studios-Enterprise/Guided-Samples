'use client'

import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react'
import {
  HAPPY_PATH_SEQUENCE,
  STAGE_LABELS,
  stageProgress,
  type ProductionStage,
} from '@/types/productionStages'
import type { StageTransitionEvent } from '@/types/productionStages'

interface Props {
  currentStage: ProductionStage | null
  history:      StageTransitionEvent[]
}

type StepState = 'done' | 'current' | 'upcoming' | 'cancelled'

function stepState(
  step: ProductionStage,
  current: ProductionStage | null,
  history: StageTransitionEvent[],
): StepState {
  if (current === 'CANCELLED') return step === 'CANCELLED' ? 'cancelled' : 'upcoming'
  const visitedStages = new Set(history.map(e => e.to_stage))
  if (visitedStages.has(step) && step !== current) return 'done'
  if (step === current) return 'current'
  return 'upcoming'
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function eventForStage(stage: ProductionStage, history: StageTransitionEvent[]) {
  return history.find(e => e.to_stage === stage)
}

export default function StageTimeline({ currentStage, history }: Props) {
  const progress = stageProgress(currentStage ?? 'PRODUCTION_FILES_RECEIVED')

  const steps = currentStage === 'CANCELLED'
    ? [...HAPPY_PATH_SEQUENCE, 'CANCELLED' as ProductionStage]
    : HAPPY_PATH_SEQUENCE

  return (
    <div className="card">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-900">Production Progress</p>
        <span className="text-xs text-brand-green font-medium">
          {Math.round(progress * 100)}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-5">
        <div
          className="h-full bg-brand-green rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Stage steps */}
      <div className="space-y-0">
        {steps.map((step, idx) => {
          const state  = stepState(step, currentStage, history)
          const event  = eventForStage(step, history)
          const isLast = idx === steps.length - 1

          return (
            <div key={step} className="flex gap-3">
              {/* Icon + connector */}
              <div className="flex flex-col items-center">
                <div className="mt-0.5">
                  {state === 'done' && (
                    <CheckCircle2 size={16} className="text-brand-green" />
                  )}
                  {state === 'current' && (
                    <div className="w-4 h-4 rounded-full border-2 border-brand-green bg-brand-green/10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                    </div>
                  )}
                  {state === 'upcoming' && (
                    <Circle size={16} className="text-slate-200" />
                  )}
                  {state === 'cancelled' && (
                    <XCircle size={16} className="text-red-400" />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-px flex-1 my-1 ${state === 'done' ? 'bg-brand-green/30' : 'bg-slate-100'}`} />
                )}
              </div>

              {/* Label + timestamp */}
              <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                <p className={`text-xs font-medium leading-tight ${
                  state === 'current'   ? 'text-gray-900' :
                  state === 'done'      ? 'text-gray-600' :
                  state === 'cancelled' ? 'text-red-500' :
                  'text-gray-300'
                }`}>
                  {STAGE_LABELS[step]}
                </p>
                {event && (
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock size={9} />
                    {formatTs(event.transitioned_at)}
                  </p>
                )}
                {step === 'REVISION_REQUIRED' && !!event?.metadata?.['revision_notes'] && (
                  <p className="text-[10px] text-amber-600 mt-1 bg-amber-50 rounded px-2 py-1 max-w-xs">
                    &ldquo;{String(event!.metadata['revision_notes']).slice(0, 100)}&rdquo;
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
