// GRACE blank garment library — curated static assets in public/grace-garments.
// These act as a built-in starting point for the Photoshop-lite editor when a
// user does not upload or generate their own blank garment. Each entry lists the
// views available as public asset paths (front/back/side where provided).

export type GarmentView = 'front' | 'back' | 'side'

export interface LibraryGarment {
  /** Stable id used for selection state. */
  id: string
  /** Display name. */
  name: string
  /** Public asset path per available view. */
  views: Partial<Record<GarmentView, string>>
}

const asset = (file: string) => `/grace-garments/${file}`

export const GARMENT_LIBRARY: LibraryGarment[] = [
  {
    id: 'crew-neck',
    name: 'Crew Neck',
    views: {
      front: asset('Crew Neck Front.png'),
      back: asset('Crew Neck Back.png'),
      side: asset('Crew Neck Side.png'),
    },
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    views: {
      side: asset('Hoodie Side.png'),
    },
  },
  {
    id: 'long-sleeve-tee',
    name: 'Long Sleeve T-Shirt',
    views: {
      front: asset('Long Sleeve T Shirt Front.png'),
      back: asset('Long Sleeve T Shirt Back.png'),
      side: asset('Long Sleeve T Shirt Side.png'),
    },
  },
  {
    id: 't-shirt',
    name: 'T-Shirt',
    views: {
      side: asset('T Shirt Side.png'),
    },
  },
  {
    id: 'sweats',
    name: 'Sweats',
    views: {
      front: asset('Sweats Front.png'),
      back: asset('Sweats Back.png'),
      side: asset('Sweats Side.png'),
    },
  },
  {
    id: 'sweats-open-bottom',
    name: 'Sweats (Open Bottom)',
    views: {
      front: asset('Sweats Open Bottom Front.png'),
      back: asset('Sweats Open Bottom Back.png'),
      side: asset('Sweats Open Bottom Side.png'),
    },
  },
  {
    id: 'track-jacket',
    name: 'Track Jacket',
    views: {
      front: asset('Track Jacket Front.png'),
      back: asset('Track Jacket Back.png'),
      side: asset('Track Jacket Side.png'),
    },
  },
  {
    id: 'zip-up-hoodie',
    name: 'Zip-Up Hoodie',
    views: {
      front: asset('Zip Up Hoodie Front.png'),
      side: asset('Zip Up Hoodie Side.png'),
    },
  },
]
