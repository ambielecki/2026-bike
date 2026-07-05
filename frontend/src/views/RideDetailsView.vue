<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import RideRouteMap from '@/components/map/RideRouteMap.vue'
import { ApiError } from '@/services/api'
import { getRide, type RideDetails, type RoutePoint } from '@/services/rides'

interface MapRoute {
  id: string
  name: string
  color: string
  points: RoutePoint[]
  visible: boolean
}

const route = useRoute()

const ride = ref<RideDetails | null>(null)
const formError = ref('')
const isLoading = ref(false)
const routeColor = ref('#1f7a4d')
const routeOpacity = ref(0.75)
const routeVisible = ref(true)

const mapRoutes = computed<MapRoute[]>(() => {
  if (!ride.value) {
    return []
  }

  return [
    {
      id: String(ride.value.id),
      name: ride.value.name,
      color: routeColor.value,
      points: ride.value.route_data,
      visible: routeVisible.value,
    },
  ]
})

const mapCenter = computed(() => {
  const locationLatitude = ride.value?.location ? Number(ride.value.location.latitude) : Number.NaN
  const locationLongitude = ride.value?.location ? Number(ride.value.location.longitude) : Number.NaN

  if (Number.isFinite(locationLatitude) && Number.isFinite(locationLongitude)) {
    return {
      latitude: locationLatitude,
      longitude: locationLongitude,
    }
  }

  return ride.value?.route_data[0] ?? null
})

onMounted(() => {
  void loadRide()
})

async function loadRide() {
  isLoading.value = true
  formError.value = ''

  try {
    ride.value = await getRide(String(route.params.id))
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'Unable to load ride.'
  } finally {
    isLoading.value = false
  }
}

function formatRideDate(value: string | null) {
  if (!value) {
    return 'Date pending'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDistance(value: string | null) {
  if (value === null) {
    return 'Distance pending'
  }

  return `${Number(value).toFixed(2)} mi`
}

function formatSpeed(value: string | null) {
  if (value === null) {
    return 'Pending'
  }

  return `${Number(value).toFixed(2)} mph`
}

function formatDuration(value: string | null) {
  if (value === null) {
    return 'Pending'
  }

  const totalSeconds = Math.max(0, Math.round(Number(value)))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }

  return `${seconds}s`
}
</script>

<template>
  <main class="ride-details-page">
    <p v-if="isLoading" class="status-text">Loading ride...</p>

    <p v-else-if="formError" class="form-error" role="alert">{{ formError }}</p>

    <template v-else-if="ride">
      <section class="page-header">
        <RouterLink class="back-link" :to="{ name: 'rides' }">Back to rides</RouterLink>
        <h1>{{ ride.name }}</h1>
      </section>

      <section class="details-layout">
        <div class="map-column">
          <RideRouteMap :center="mapCenter" :opacity="routeOpacity" :routes="mapRoutes" />

          <section class="route-controls" aria-label="Route display controls">
            <label class="control-field" for="route-color">
              <span>Route color</span>
              <input id="route-color" v-model="routeColor" type="color" />
            </label>

            <label class="control-field" for="route-opacity">
              <span>Route opacity</span>
              <input
                id="route-opacity"
                v-model.number="routeOpacity"
                max="1"
                min="0.1"
                step="0.05"
                type="range"
              />
            </label>

            <label class="toggle-field" for="route-visible">
              <input id="route-visible" v-model="routeVisible" type="checkbox" />
              <span>Show route</span>
            </label>
          </section>
        </div>

        <aside class="details-panel" aria-label="Ride details">
          <p v-if="ride.description" class="description">{{ ride.description }}</p>

          <dl class="metrics">
            <div>
              <dt>Date</dt>
              <dd>{{ formatRideDate(ride.datetime) }}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{{ ride.location?.name ?? 'Location pending' }}</dd>
            </div>
            <div>
              <dt>Distance</dt>
              <dd>{{ formatDistance(ride.distance) }}</dd>
            </div>
            <div>
              <dt>Total time</dt>
              <dd>{{ formatDuration(ride.total_time) }}</dd>
            </div>
            <div>
              <dt>Moving time</dt>
              <dd>{{ formatDuration(ride.moving_time) }}</dd>
            </div>
            <div>
              <dt>Average speed</dt>
              <dd>{{ formatSpeed(ride.average_speed) }}</dd>
            </div>
            <div>
              <dt>Max speed</dt>
              <dd>{{ formatSpeed(ride.max_speed) }}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </template>
  </main>
</template>

<style scoped>
.ride-details-page {
  background: #f8f6f0;
  min-height: calc(100vh - 4rem);
  padding: 2rem clamp(1rem, 4vw, 3rem) 3rem;
}

.page-header,
.details-layout,
.status-text,
.form-error {
  margin-left: auto;
  margin-right: auto;
  max-width: 72rem;
}

.page-header {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

h1,
p,
dl,
dd {
  margin: 0;
}

h1 {
  color: #142013;
  font-size: 2rem;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.back-link {
  color: #355e3b;
  font-weight: 800;
  justify-self: start;
  text-decoration: none;
}

.details-layout {
  align-items: start;
  display: grid;
  gap: 1.25rem;
  grid-template-columns: minmax(0, 1.5fr) minmax(20rem, 0.8fr);
}

.map-column {
  display: grid;
  gap: 1rem;
}

.route-controls,
.details-panel {
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2rem rgba(20, 32, 19, 0.08);
}

.route-controls {
  align-items: center;
  display: grid;
  gap: 1rem;
  grid-template-columns: auto minmax(10rem, 1fr) auto;
  padding: 1rem;
}

.control-field,
.toggle-field {
  align-items: center;
  color: #142013;
  display: flex;
  font-weight: 700;
  gap: 0.75rem;
}

.control-field {
  flex-wrap: wrap;
}

.control-field input[type='color'] {
  border: 0.0625rem solid rgba(53, 94, 59, 0.24);
  border-radius: 0.375rem;
  height: 2.5rem;
  padding: 0.125rem;
  width: 3rem;
}

.control-field input[type='range'] {
  accent-color: #355e3b;
  width: min(100%, 18rem);
}

.details-panel {
  display: grid;
  gap: 1.25rem;
  padding: 1.25rem;
}

.description {
  color: #142013;
  line-height: 1.6;
}

.metrics {
  display: grid;
  gap: 0.875rem;
}

.metrics div {
  border-bottom: 0.0625rem solid rgba(53, 94, 59, 0.12);
  display: grid;
  gap: 0.25rem;
  padding-bottom: 0.875rem;
}

.metrics div:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

dt {
  color: #52614f;
  font-size: 0.9rem;
  font-weight: 800;
}

dd {
  color: #142013;
  font-weight: 700;
}

.status-text {
  color: #52614f;
  line-height: 1.5;
}

.form-error {
  background: rgba(176, 44, 44, 0.08);
  border: 0.0625rem solid rgba(176, 44, 44, 0.22);
  border-radius: 0.375rem;
  color: #7c2020;
  line-height: 1.5;
  padding: 0.75rem;
}

.back-link:focus-visible,
.control-field input:focus-visible,
.toggle-field input:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.28);
  outline-offset: 0.125rem;
}

@media (max-width: 56rem) {
  .details-layout,
  .route-controls {
    grid-template-columns: 1fr;
  }
}
</style>
