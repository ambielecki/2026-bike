<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import 'leaflet.fullscreen'
import 'leaflet.fullscreen/dist/Control.FullScreen.css'

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  imageOverlay,
  latLng,
  layerGroup,
  map as createMap,
  marker,
  polyline,
  tileLayer,
  type Layer,
  type LayerGroup,
  type Map,
} from 'leaflet'

import { watopiaMap } from '@/components/map/watopiaMap'
import type { MapProvider, RoutePoint } from '@/services/rides'

interface MapCenter {
  latitude: number
  longitude: number
}

interface MapRoute {
  id: string
  name: string
  color: string
  points: RoutePoint[]
  visible: boolean
}

const props = withDefaults(
  defineProps<{
    center?: MapCenter | null
    downloadFilenameBase?: string
    opacity?: number
    mapProvider?: MapProvider
    routes: MapRoute[]
    showDownload?: boolean
    showMarkers?: boolean
  }>(),
  {
    center: null,
    downloadFilenameBase: 'ride-map',
    mapProvider: 'openstreetmap',
    opacity: 0.75,
    showDownload: true,
    showMarkers: true,
  },
)

const mapElement = ref<HTMLElement | null>(null)
const isDownloading = ref(false)
const downloadError = ref('')
const hasVisibleRoutes = computed(() =>
  props.routes.some((route) => route.visible && route.points.length > 0),
)
let map: Map | null = null
let routeLayerGroup: LayerGroup | null = null
let baseLayer: Layer | null = null

onMounted(async () => {
  await nextTick()

  if (!mapElement.value) {
    return
  }

  map = createMap(mapElement.value, {
    fullscreenControl: true,
    scrollWheelZoom: true,
  }).setView([39.5, -98.35], 12)

  renderBaseLayer()

  routeLayerGroup = layerGroup().addTo(map)
  renderRoutes()
  centerMap()
  setTimeout(() => map?.invalidateSize(), 0)
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  baseLayer = null
  routeLayerGroup = null
})

watch(
  () => [props.routes, props.opacity, props.showMarkers] as const,
  () => {
    renderRoutes()
  },
  {
    deep: true,
  },
)

watch(
  () => props.center,
  () => {
    centerMap()
  },
  {
    deep: true,
  },
)

watch(
  () => props.mapProvider,
  () => {
    renderBaseLayer()
    centerMap()
  },
)

function renderBaseLayer() {
  if (!map) {
    return
  }

  if (baseLayer) {
    map.removeLayer(baseLayer)
  }

  baseLayer =
    props.mapProvider === 'watopia'
      ? imageOverlay(watopiaMap.imageUrl, watopiaMap.bounds, {
          attribution: watopiaMap.attribution,
        })
      : tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          crossOrigin: true,
          maxZoom: 19,
        })

  baseLayer.addTo(map)
}

function renderRoutes() {
  if (!map || !routeLayerGroup) {
    return
  }

  routeLayerGroup.clearLayers()

  props.routes
    .filter((route) => route.visible && route.points.length > 0)
    .forEach((route) => {
      const latLngs = route.points.map((point) => latLng(point.latitude, point.longitude))

      polyline(latLngs, {
        color: route.color,
        opacity: props.opacity,
        weight: 4,
      }).addTo(routeLayerGroup as LayerGroup)

      if (!props.showMarkers) {
        return
      }

      const firstPoint = latLngs[0]
      const lastPoint = latLngs[latLngs.length - 1]

      if (firstPoint) {
        marker(firstPoint, {
          title: `${route.name} start`,
        }).addTo(routeLayerGroup as LayerGroup)
      }

      if (lastPoint && lastPoint !== firstPoint) {
        marker(lastPoint, {
          title: `${route.name} end`,
        }).addTo(routeLayerGroup as LayerGroup)
      }
    })
}

function firstVisibleRoutePoint(): MapCenter | null {
  const point = props.routes.find((route) => route.visible && route.points.length > 0)?.points[0]

  if (!point) {
    return null
  }

  return {
    latitude: point.latitude,
    longitude: point.longitude,
  }
}

function centerMap() {
  if (!map) {
    return
  }

  const center = props.center ?? firstVisibleRoutePoint()

  if (center) {
    map.setView([center.latitude, center.longitude], 13)
    return
  }

  if (props.mapProvider === 'watopia') {
    map.fitBounds(watopiaMap.initialBounds)
  }
}

async function downloadMapImage() {
  if (!map || !mapElement.value || isDownloading.value) {
    return
  }

  isDownloading.value = true
  downloadError.value = ''

  try {
    const canvas = await renderMapCanvas()
    const blob = await canvasToBlob(canvas)
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = objectUrl
    anchor.download = `${downloadFilenameSlug()}-${new Date().toISOString().slice(0, 10)}.png`
    anchor.click()

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
  } catch {
    downloadError.value = 'Unable to download this map image.'
  } finally {
    isDownloading.value = false
  }
}

function downloadFilenameSlug() {
  const slug = props.downloadFilenameBase
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'ride-map'
}

async function renderMapCanvas() {
  if (!map || !mapElement.value) {
    throw new Error('Map is not ready.')
  }

  await waitForMapImages()

  const size = map.getSize()
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas is not available.')
  }

  canvas.width = size.x
  canvas.height = size.y

  context.fillStyle = props.mapProvider === 'watopia' ? '#0884e2' : '#e7ece2'
  context.fillRect(0, 0, size.x, size.y)
  drawMapImages(context)
  drawRouteOverlay(context)

  return canvas
}

function drawMapImages(context: CanvasRenderingContext2D) {
  if (!mapElement.value) {
    return
  }

  const mapBounds = mapElement.value.getBoundingClientRect()
  const images = Array.from(
    mapElement.value.querySelectorAll<HTMLImageElement>(
      '.leaflet-tile-pane img, .leaflet-image-layer',
    ),
  )

  images.forEach((image) => {
    const imageBounds = image.getBoundingClientRect()
    const left = imageBounds.left - mapBounds.left
    const top = imageBounds.top - mapBounds.top

    if (
      imageBounds.right <= mapBounds.left ||
      imageBounds.left >= mapBounds.right ||
      imageBounds.bottom <= mapBounds.top ||
      imageBounds.top >= mapBounds.bottom
    ) {
      return
    }

    context.drawImage(image, left, top, imageBounds.width, imageBounds.height)
  })
}

function drawRouteOverlay(context: CanvasRenderingContext2D) {
  if (!map) {
    return
  }

  props.routes
    .filter((route) => route.visible && route.points.length > 0)
    .forEach((route) => {
      const points = route.points.map((point) =>
        map?.latLngToContainerPoint(latLng(point.latitude, point.longitude)),
      )

      context.save()
      context.globalAlpha = props.opacity
      context.strokeStyle = route.color
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.lineWidth = 4
      context.beginPath()

      points.forEach((point, index) => {
        if (!point) {
          return
        }

        if (index === 0) {
          context.moveTo(point.x, point.y)
          return
        }

        context.lineTo(point.x, point.y)
      })

      context.stroke()
      context.restore()

      if (!props.showMarkers) {
        return
      }

      const firstPoint = points[0]
      const lastPoint = points[points.length - 1]

      if (firstPoint) {
        drawRouteMarker(context, firstPoint.x, firstPoint.y, route.color)
      }

      if (lastPoint && lastPoint !== firstPoint) {
        drawRouteMarker(context, lastPoint.x, lastPoint.y, route.color)
      }
    })
}

function drawRouteMarker(context: CanvasRenderingContext2D, x: number, y: number, color: string) {
  context.save()
  context.fillStyle = '#ffffff'
  context.strokeStyle = color
  context.lineWidth = 3
  context.beginPath()
  context.arc(x, y, 6, 0, Math.PI * 2)
  context.fill()
  context.stroke()
  context.restore()
}

function waitForMapImages() {
  if (!mapElement.value) {
    return Promise.resolve()
  }

  const images = Array.from(
    mapElement.value.querySelectorAll<HTMLImageElement>(
      '.leaflet-tile-pane img, .leaflet-image-layer',
    ),
  )

  return Promise.all(
    images.map((image) => {
      if (image.complete) {
        return Promise.resolve()
      }

      return new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true })
        image.addEventListener('error', () => resolve(), { once: true })
      })
    }),
  )
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to create map image.'))
        return
      }

      resolve(blob)
    }, 'image/png')
  })
}
</script>

<template>
  <div class="map-shell" :class="`map-shell-${mapProvider}`">
    <div ref="mapElement" class="map-canvas" aria-label="Ride route map"></div>
    <button
      v-if="showDownload"
      class="map-download"
      :disabled="isDownloading"
      type="button"
      aria-label="Download map image"
      @click="downloadMapImage"
    >
      {{ isDownloading ? 'Saving...' : 'Download image' }}
    </button>
    <p v-if="!hasVisibleRoutes" class="map-empty">No route data available.</p>
    <p v-if="downloadError" class="map-download-error" role="alert">{{ downloadError }}</p>
  </div>
</template>

<style scoped>
.map-shell {
  background: #e7ece2;
  border: 0.0625rem solid rgba(53, 94, 59, 0.16);
  border-radius: 0.5rem;
  isolation: isolate;
  min-height: 35rem;
  overflow: hidden;
  position: relative;
  z-index: 0;
}

.map-shell-watopia {
  background: #0884e2;
}

.map-canvas {
  height: 100%;
  min-height: 24rem;
  position: relative;
  width: 100%;
  z-index: 0;
}

.map-empty {
  align-items: center;
  background: rgba(248, 246, 240, 0.9);
  color: #52614f;
  display: flex;
  font-weight: 700;
  inset: 0;
  justify-content: center;
  margin: 0;
  padding: 1rem;
  position: absolute;
  text-align: center;
}

.map-download {
  background: #ffffff;
  border: 0.0625rem solid rgba(20, 32, 19, 0.18);
  border-radius: 0.375rem;
  box-shadow: 0 0.25rem 0.75rem rgba(20, 32, 19, 0.12);
  color: #142013;
  cursor: pointer;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.2;
  min-height: 2.5rem;
  padding: 0.55rem 0.8rem;
  position: absolute;
  right: 0.75rem;
  top: 0.75rem;
  z-index: 500;
}

.map-download:hover:not(:disabled) {
  background: #f8f6f0;
}

.map-download:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.map-download:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.34);
  outline-offset: 0.125rem;
}

.map-download-error {
  background: rgba(127, 29, 29, 0.94);
  border-radius: 0.375rem;
  bottom: 0.75rem;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 700;
  left: 0.75rem;
  margin: 0;
  max-width: calc(100% - 1.5rem);
  padding: 0.55rem 0.75rem;
  position: absolute;
  z-index: 500;
}

@media (max-width: 40rem) {
  .map-download {
    max-width: calc(100% - 1.5rem);
    overflow-wrap: anywhere;
  }
}
</style>
