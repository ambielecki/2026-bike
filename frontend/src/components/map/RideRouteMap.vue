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
    opacity?: number
    mapProvider?: MapProvider
    routes: MapRoute[]
    showMarkers?: boolean
  }>(),
  {
    center: null,
    mapProvider: 'openstreetmap',
    opacity: 0.75,
    showMarkers: true,
  },
)

const mapElement = ref<HTMLElement | null>(null)
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

  baseLayer = props.mapProvider === 'watopia'
    ? imageOverlay(watopiaMap.imageUrl, watopiaMap.bounds, {
        attribution: watopiaMap.attribution,
      })
    : tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
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
</script>

<template>
  <div class="map-shell" :class="`map-shell-${mapProvider}`">
    <div ref="mapElement" class="map-canvas" aria-label="Ride route map"></div>
    <p v-if="!hasVisibleRoutes" class="map-empty">No route data available.</p>
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
</style>
