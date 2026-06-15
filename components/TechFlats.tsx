'use client'

// GRACE static technical flats.
//
// These are fixed line-drawing schematics — they communicate HOW a garment is
// measured (where chest / length / sleeve / rise / inseam etc. are taken), not
// the actual graded values. They intentionally do not change with size or fit.
// One archetype per silhouette; garments without a dedicated drawing map to the
// closest appropriate one (see FLAT_FOR_GARMENT).

import type { GarmentType } from '@/lib/fitBlocks/types'

export type FlatKind = 'tee' | 'crewneck' | 'hoodie' | 'jacket' | 'pants' | 'shorts'

export const FLAT_FOR_GARMENT: Record<GarmentType, FlatKind> = {
  short_sleeve_tee: 'tee',
  long_sleeve_tee:  'crewneck',
  crewneck:         'crewneck',
  hoodie:           'hoodie',
  zip_hoodie:       'hoodie',
  track_jacket:     'jacket',
  windbreaker:      'jacket',
  sweatpants:       'pants',
  track_pants:      'pants',
  shorts:           'shorts',
}

const STROKE = '#1A1A1A'
const GUIDE  = '#9A9A9A'
const LABEL  = '#6B6B6B'

// ── Callout primitives ─────────────────────────────────────────────────────────

function HCallout({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g stroke={GUIDE} strokeWidth={1.3} fill="none">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <path d={`M${x1} ${y} l9 -4.5 M${x1} ${y} l9 4.5`} />
      <path d={`M${x2} ${y} l-9 -4.5 M${x2} ${y} l-9 4.5`} />
      <text x={(x1 + x2) / 2} y={y - 9} textAnchor="middle" fill={LABEL} stroke="none" fontSize="15" letterSpacing="1.2">{label}</text>
    </g>
  )
}

function VCallout({ x, y1, y2, lines, side = 'right' }: { x: number; y1: number; y2: number; lines: string[]; side?: 'left' | 'right' }) {
  const tx = side === 'right' ? x + 12 : x - 12
  const anchor = side === 'right' ? 'start' : 'end'
  const midY = (y1 + y2) / 2
  return (
    <g stroke={GUIDE} strokeWidth={1.3} fill="none">
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <path d={`M${x} ${y1} l-4.5 9 M${x} ${y1} l4.5 9`} />
      <path d={`M${x} ${y2} l-4.5 -9 M${x} ${y2} l4.5 -9`} />
      <text x={tx} y={midY} textAnchor={anchor} fill={LABEL} stroke="none" fontSize="15" letterSpacing="1.2" dominantBaseline="middle">
        {lines.map((ln, i) => (
          <tspan key={i} x={tx} dy={i === 0 ? (lines.length > 1 ? -8 : 0) : 17}>{ln}</tspan>
        ))}
      </text>
    </g>
  )
}

function DCallout({ x1, y1, x2, y2, lines }: { x1: number; y1: number; x2: number; y2: number; lines: string[] }) {
  const ang = Math.atan2(y2 - y1, x2 - x1)
  const ah = 11
  const a1 = ang + Math.PI / 7, a2 = ang - Math.PI / 7
  const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2
  return (
    <g stroke={GUIDE} strokeWidth={1.3} fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path d={`M${x1} ${y1} l${ah * Math.cos(a1)} ${ah * Math.sin(a1)} M${x1} ${y1} l${ah * Math.cos(a2)} ${ah * Math.sin(a2)}`} />
      <path d={`M${x2} ${y2} l${-ah * Math.cos(a1)} ${-ah * Math.sin(a1)} M${x2} ${y2} l${-ah * Math.cos(a2)} ${-ah * Math.sin(a2)}`} />
      <text x={midX - 30} y={midY - 6} textAnchor="end" fill={LABEL} stroke="none" fontSize="15" letterSpacing="1.2">
        {lines.map((ln, i) => (
          <tspan key={i} x={midX - 30} dy={i === 0 ? 0 : 17}>{ln}</tspan>
        ))}
      </text>
    </g>
  )
}

const bodyProps = { fill: '#FFFFFF', stroke: STROKE, strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
const detailProps = { fill: 'none', stroke: STROKE, strokeWidth: 1.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
const ribProps = { fill: 'none', stroke: STROKE, strokeWidth: 0.8, strokeLinecap: 'round' as const }

// ── Tee ─────────────────────────────────────────────────────────────────────────

function Tee({ front }: { front: boolean }) {
  return (
    <svg viewBox="0 0 480 470" width="100%" style={{ maxHeight: 360 }} fontFamily="Inter, sans-serif">
      <path {...bodyProps} d="M198 76 L176 84 L120 152 L150 182 L186 164 L186 404 L294 404 L294 164 L330 182 L360 152 L304 84 L282 76 C268 98 212 98 198 76 Z" />
      {/* neck rib */}
      <path {...detailProps} d={front ? 'M202 80 C214 100 266 100 278 80' : 'M204 80 C216 92 264 92 276 80'} />
      {/* sleeve hems */}
      <path {...ribProps} d="M132 168 L162 178" />
      <path {...ribProps} d="M318 178 L348 168" />
      {front && (
        <>
          <HCallout x1={176} x2={304} y={56} label="SHOULDER WIDTH" />
          <DCallout x1={176} y1={86} x2={134} y2={166} lines={['SLEEVE']} />
          <HCallout x1={186} x2={294} y={248} label="CHEST" />
          <VCallout x={326} y1={86} y2={404} lines={['LENGTH']} />
        </>
      )}
    </svg>
  )
}

// ── Crewneck (long sleeve) ──────────────────────────────────────────────────────

function longSleeveBody() {
  return 'M196 76 L174 86 L130 300 L176 318 L196 154 L196 406 L284 406 L284 154 L304 318 L350 300 L306 86 L284 76 C270 92 210 92 196 76 Z'
}

function Crewneck({ front }: { front: boolean }) {
  return (
    <svg viewBox="0 0 480 470" width="100%" style={{ maxHeight: 360 }} fontFamily="Inter, sans-serif">
      <path {...bodyProps} d={longSleeveBody()} />
      <path {...detailProps} d={front ? 'M200 82 C214 102 266 102 280 82' : 'M202 82 C216 94 264 94 278 82'} />
      {/* cuffs */}
      <path {...ribProps} d="M134 290 L172 306" />
      <path {...ribProps} d="M308 306 L346 290" />
      {/* hem rib */}
      <path {...ribProps} d="M196 396 L284 396" />
      {front && (
        <>
          <HCallout x1={174} x2={306} y={58} label="SHOULDER WIDTH" />
          <DCallout x1={174} y1={88} x2={138} y2={296} lines={['SLEEVE', 'LENGTH']} />
          <HCallout x1={196} x2={284} y={210} label="CHEST" />
          <VCallout x={322} y1={88} y2={406} lines={['FRONT', 'LENGTH']} />
        </>
      )}
    </svg>
  )
}

// ── Hoodie ───────────────────────────────────────────────────────────────────────

function Hoodie({ front }: { front: boolean }) {
  return (
    <svg viewBox="0 0 480 470" width="100%" style={{ maxHeight: 360 }} fontFamily="Inter, sans-serif">
      <path {...bodyProps} d={longSleeveBody()} />
      {/* hood */}
      <path {...bodyProps} d="M186 96 C150 42 330 42 294 96 C300 90 180 90 186 96 Z" />
      <path {...detailProps} d="M206 92 C214 70 266 70 274 92" />
      {front && <line x1={240} y1={70} x2={240} y2={94} {...detailProps} />}
      {/* kangaroo pocket */}
      {front && <path {...detailProps} d="M198 338 L282 338 L298 392 L182 392 Z" />}
      {/* cuffs + hem */}
      <path {...ribProps} d="M134 290 L172 306" />
      <path {...ribProps} d="M308 306 L346 290" />
      <path {...ribProps} d="M196 396 L284 396" />
      {front && (
        <>
          <HCallout x1={174} x2={306} y={50} label="SHOULDER WIDTH" />
          <DCallout x1={174} y1={92} x2={138} y2={296} lines={['SLEEVE', 'LENGTH']} />
          <HCallout x1={196} x2={284} y={214} label="CHEST" />
          <VCallout x={322} y1={92} y2={406} lines={['FRONT', 'LENGTH']} />
        </>
      )}
    </svg>
  )
}

// ── Jacket (track jacket / windbreaker) ──────────────────────────────────────────

function Jacket({ front }: { front: boolean }) {
  return (
    <svg viewBox="0 0 480 470" width="100%" style={{ maxHeight: 360 }} fontFamily="Inter, sans-serif">
      <path {...bodyProps} d={longSleeveBody()} />
      {/* stand collar */}
      <path {...bodyProps} d="M206 78 L210 52 L270 52 L274 78" />
      {/* center zip */}
      {front && <line x1={240} y1={56} x2={240} y2={406} {...detailProps} strokeDasharray="1 3" />}
      {front && <line x1={240} y1={56} x2={240} y2={406} stroke={STROKE} strokeWidth={1.2} />}
      {/* cuffs + hem */}
      <path {...ribProps} d="M134 290 L172 306" />
      <path {...ribProps} d="M308 306 L346 290" />
      <path {...ribProps} d="M196 398 L284 398" />
      {front && (
        <>
          <HCallout x1={174} x2={306} y={56} label="SHOULDER WIDTH" />
          <DCallout x1={174} y1={86} x2={138} y2={296} lines={['SLEEVE', 'LENGTH']} />
          <HCallout x1={196} x2={284} y={214} label="CHEST" />
          <VCallout x={322} y1={86} y2={406} lines={['FRONT', 'LENGTH']} />
        </>
      )}
    </svg>
  )
}

// ── Pants ─────────────────────────────────────────────────────────────────────────

function Pants({ front }: { front: boolean }) {
  return (
    <svg viewBox="0 0 440 560" width="100%" style={{ maxHeight: 380 }} fontFamily="Inter, sans-serif">
      <path {...bodyProps} d="M118 78 L322 78 L336 122 L300 510 L244 510 L220 240 L196 510 L140 510 L104 122 Z" />
      {/* waistband */}
      <line x1={108} y1={104} x2={332} y2={104} {...detailProps} />
      {front && <line x1={220} y1={78} x2={220} y2={104} {...detailProps} />}
      {front && (
        <>
          <HCallout x1={118} x2={322} y={58} label="WAIST" />
          <VCallout x={220} y1={106} y2={240} lines={['RISE']} />
          <HCallout x1={110} x2={220} y={262} label="THIGH" />
          <g stroke={GUIDE} strokeWidth={1.1} strokeDasharray="3 3" fill="none">
            <line x1={220} y1={240} x2={368} y2={240} />
            <line x1={300} y1={510} x2={368} y2={510} />
          </g>
          <VCallout x={368} y1={240} y2={510} lines={['INSEAM']} />
          <HCallout x1={140} x2={196} y={538} label="LEG OPENING" />
        </>
      )}
    </svg>
  )
}

// ── Shorts ───────────────────────────────────────────────────────────────────────

function Shorts({ front }: { front: boolean }) {
  return (
    <svg viewBox="0 0 440 420" width="100%" style={{ maxHeight: 360 }} fontFamily="Inter, sans-serif">
      <path {...bodyProps} d="M118 78 L322 78 L336 122 L302 332 L250 332 L220 214 L190 332 L138 332 L104 122 Z" />
      <line x1={108} y1={104} x2={332} y2={104} {...detailProps} />
      <path {...ribProps} d="M140 318 L248 318" />
      {front && <line x1={220} y1={78} x2={220} y2={104} {...detailProps} />}
      {front && (
        <>
          <HCallout x1={118} x2={322} y={58} label="WAIST" />
          <VCallout x={220} y1={106} y2={214} lines={['RISE']} />
          <HCallout x1={110} x2={220} y={236} label="THIGH" />
          <g stroke={GUIDE} strokeWidth={1.1} strokeDasharray="3 3" fill="none">
            <line x1={322} y1={92} x2={372} y2={92} />
            <line x1={302} y1={332} x2={372} y2={332} />
          </g>
          <VCallout x={372} y1={92} y2={332} lines={['OUTSEAM']} />
          <HCallout x1={140} x2={250} y={358} label="LEG OPENING" />
        </>
      )}
    </svg>
  )
}

// ── Dispatcher ─────────────────────────────────────────────────────────────────

export function TechFlat({ kind, view }: { kind: FlatKind; view: 'front' | 'back' }) {
  const front = view === 'front'
  switch (kind) {
    case 'tee':      return <Tee front={front} />
    case 'crewneck': return <Crewneck front={front} />
    case 'hoodie':   return <Hoodie front={front} />
    case 'jacket':   return <Jacket front={front} />
    case 'pants':    return <Pants front={front} />
    case 'shorts':   return <Shorts front={front} />
  }
}
