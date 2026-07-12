import makuriIslandsImageUrl from '@/assets/maps/makuri-islands.png'
import watopiaImageUrl from '@/assets/maps/watopia.png'
import type { MapProvider } from '@/services/rides'

type ZwiftMapProvider = Exclude<MapProvider, 'openstreetmap'>

interface ZwiftMapConfig {
  attribution: string
  backgroundColor: string
  bounds: [[number, number], [number, number]]
  imageUrl: string
  initialBounds: [[number, number], [number, number]]
}

export const zwiftMaps: Record<ZwiftMapProvider, ZwiftMapConfig> = {
  'makuri-islands': {
    attribution: '&copy; Zwift',
    backgroundColor: '#7d9a35',
    bounds: [
      [-10.73746, 165.76591],
      [-10.85234, 165.88222],
    ],
    imageUrl: makuriIslandsImageUrl,
    initialBounds: [
      [-10.74367, 165.799463],
      [-10.817209, 165.859244],
    ],
  },
  watopia: {
    attribution: '&copy; Zwift',
    backgroundColor: '#0884e2',
    bounds: [
      [-11.62597, 166.87747],
      [-11.74087, 167.03255],
    ],
    imageUrl: watopiaImageUrl,
    initialBounds: [
      [-11.635444, 166.93555],
      [-11.673613, 166.972511],
    ],
  },
}

export function zwiftMapForProvider(provider: MapProvider) {
  return provider === 'openstreetmap' ? null : zwiftMaps[provider]
}
