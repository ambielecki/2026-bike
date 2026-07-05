<script setup lang="ts">
import 'leaflet/dist/leaflet.css'

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { latLng, layerGroup, map as createMap, marker, polyline, tileLayer, type LayerGroup, type Map } from 'leaflet'

import type { RoutePoint } from '@/services/rides'

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
    routes: MapRoute[]
  }>(),
  {
    center: null,
    opacity: 0.75,
  },
)

const mapElement = ref<HTMLElement | null>(null)
const hasVisibleRoutes = computed(() =>
  props.routes.some((route) => route.visible && route.points.length > 0),
)
let map: Map | null = null
let routeLayerGroup: LayerGroup | null = null

onMounted(async () => {
  await nextTick()

  if (!mapElement.value) {
    return
  }

  map = createMap(mapElement.value, {
    scrollWheelZoom: true,
  }).setView([39.5, -98.35], 12)

  tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  routeLayerGroup = layerGroup().addTo(map)
  renderRoutes()
  setTimeout(() => map?.invalidateSize(), 0)
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  routeLayerGroup = null
})

watch(
  () => [props.routes, props.opacity, props.center] as const,
  () => {
    renderRoutes()
  },
  {
    deep: true,
  },
)

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

  const center = props.center ?? firstVisibleRoutePoint()

  if (center) {
    map.setView([center.latitude, center.longitude], 13)
  }
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
</script>

<template>
  <div class="map-shell">
    <div ref="mapElement" class="map-canvas" aria-label="Ride route map"></div>
    <p v-if="!hasVisibleRoutes" class="map-empty">No route data available.</p>
  </div>
</template>

<style scoped>
.map-shell {
  background: #e7ece2;
  border: 0.0625rem solid rgba(53, 94, 59, 0.16);
  border-radius: 0.5rem;
  min-height: 35rem;
  overflow: hidden;
  position: relative;
}

.map-canvas {
  height: 100%;
  min-height: 24rem;
  width: 100%;
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
