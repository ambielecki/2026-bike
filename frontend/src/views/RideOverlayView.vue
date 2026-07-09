<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import AppSelect from '@/components/form/AppSelect.vue'
import RideRouteMap from '@/components/map/RideRouteMap.vue'
import { ApiError } from '@/services/api'
import {
  getLocations,
  getRide,
  getRides,
  type Location,
  type MapProvider,
  type PaginationMeta,
  type RideDetails,
  type RideListItem,
  type RoutePoint,
} from '@/services/rides'

interface SelectedRoute {
  color: string
  ride: RideDetails
}

interface MapRoute {
  id: string
  name: string
  color: string
  points: RoutePoint[]
  visible: boolean
}

const fallbackRouteColor = '#1f7a4d'
const defaultRouteColors = [fallbackRouteColor, '#255f85', '#9a4c1e', '#6f3f91', '#ad2f45', '#627100']

const locations = ref<Location[]>([])
const rides = ref<RideListItem[]>([])
const selectedRoutes = ref<SelectedRoute[]>([])
const locationId = ref('')
const startDate = ref('')
const endDate = ref('')
const routeOpacity = ref(0.75)
const globalColor = ref('#1f7a4d')
const useGlobalColor = ref(false)
const page = ref(1)
const isLoadingLocations = ref(false)
const isLoadingRides = ref(false)
const loadingRouteIds = ref<number[]>([])
const formError = ref('')
const meta = ref<PaginationMeta>({
  current_page: 1,
  from: null,
  last_page: 1,
  per_page: 50,
  to: null,
  total: 0,
})

const locationOptions = computed(() =>
  locations.value.map((location) => ({
    label: location.name,
    value: String(location.id),
  })),
)

const selectedLocation = computed(() =>
  locations.value.find((location) => String(location.id) === locationId.value) ?? null,
)
const mapProvider = computed<MapProvider>(() => selectedLocation.value?.map_provider ?? 'openstreetmap')

const hasMoreRides = computed(() => meta.value.current_page < meta.value.last_page)

const mapRoutes = computed<MapRoute[]>(() =>
  selectedRoutes.value.map((selectedRoute) => ({
    id: String(selectedRoute.ride.id),
    name: selectedRoute.ride.name,
    color: useGlobalColor.value ? globalColor.value : selectedRoute.color,
    points: selectedRoute.ride.route_data,
    visible: true,
  })),
)

const mapCenter = computed(() => {
  const latitude = selectedLocation.value ? Number(selectedLocation.value.latitude) : Number.NaN
  const longitude = selectedLocation.value ? Number(selectedLocation.value.longitude) : Number.NaN

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return {
      latitude,
      longitude,
    }
  }

  return selectedRoutes.value[0]?.ride.route_data[0] ?? null
})

onMounted(async () => {
  await loadLocations()
})

watch([locationId, startDate, endDate], () => {
  selectedRoutes.value = []
  page.value = 1
  void loadRides({ append: false })
})

async function loadLocations() {
  isLoadingLocations.value = true

  try {
    locations.value = await getLocations()
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'Unable to load locations.'
  } finally {
    isLoadingLocations.value = false
  }
}

async function loadRides({ append }: { append: boolean }) {
  if (!selectedLocation.value) {
    rides.value = []
    meta.value = emptyMeta()
    return
  }

  isLoadingRides.value = true
  formError.value = ''

  try {
    const response = await getRides({
      endDate: endDate.value,
      locationId: String(selectedLocation.value.id),
      page: page.value,
      perPage: 50,
      startDate: startDate.value,
    })

    rides.value = append ? [...rides.value, ...response.data] : response.data
    meta.value = response.meta
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'Unable to load rides.'
  } finally {
    isLoadingRides.value = false
  }
}

async function loadMoreRides() {
  if (!hasMoreRides.value || isLoadingRides.value) {
    return
  }

  page.value += 1
  await loadRides({ append: true })
}

function isRouteSelected(rideId: number) {
  return selectedRouteForRide(rideId) !== null
}

function isRouteLoading(rideId: number) {
  return loadingRouteIds.value.includes(rideId)
}

function selectedRouteForRide(rideId: number) {
  return selectedRoutes.value.find((selectedRoute) => selectedRoute.ride.id === rideId) ?? null
}

async function addRoute(ride: RideListItem) {
  if (isRouteSelected(ride.id) || isRouteLoading(ride.id)) {
    return
  }

  loadingRouteIds.value = [...loadingRouteIds.value, ride.id]
  formError.value = ''

  try {
    const rideDetails = await getRide(ride.id)
    selectedRoutes.value = [
      ...selectedRoutes.value,
      {
        color: defaultRouteColors[selectedRoutes.value.length % defaultRouteColors.length] ?? fallbackRouteColor,
        ride: rideDetails,
      },
    ]
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'Unable to add route.'
  } finally {
    loadingRouteIds.value = loadingRouteIds.value.filter((id) => id !== ride.id)
  }
}

function removeRoute(rideId: number) {
  selectedRoutes.value = selectedRoutes.value.filter((selectedRoute) => selectedRoute.ride.id !== rideId)
}

function updateRouteColor(rideId: number, event: Event) {
  const color = event.target instanceof HTMLInputElement ? event.target.value : ''
  const selectedRoute = selectedRouteForRide(rideId)

  if (!selectedRoute || !color) {
    return
  }

  selectedRoute.color = color
}

function formatRideDate(value: string | null) {
  if (!value) {
    return 'Date pending'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function formatDistance(value: string | null) {
  if (value === null) {
    return 'Distance pending'
  }

  return `${Number(value).toFixed(2)} mi`
}

function emptyMeta(): PaginationMeta {
  return {
    current_page: 1,
    from: null,
    last_page: 1,
    per_page: 50,
    to: null,
    total: 0,
  }
}
</script>

<template>
  <main class="ride-overlay-page">
    <section class="page-header">
      <h1>Ride Overlay</h1>
    </section>

    <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

    <section class="overlay-layout">
      <div class="map-column">
        <RideRouteMap
          :center="mapCenter"
          :map-provider="mapProvider"
          :opacity="routeOpacity"
          :routes="mapRoutes"
          :show-markers="false"
        />

        <section class="map-controls" aria-label="Map overlay controls">
          <label class="control-field" for="overlay-opacity">
            <span>Route opacity</span>
            <input
              id="overlay-opacity"
              v-model.number="routeOpacity"
              max="1"
              min="0.1"
              step="0.05"
              type="range"
            />
          </label>

          <label class="toggle-field" for="overlay-use-global-color">
            <input id="overlay-use-global-color" v-model="useGlobalColor" type="checkbox" />
            <span>Override route colors</span>
          </label>

          <label class="control-field compact-control" for="overlay-global-color">
            <span>Override color</span>
            <input id="overlay-global-color" v-model="globalColor" :disabled="!useGlobalColor" type="color" />
          </label>
        </section>

      </div>

      <aside class="ride-panel" aria-label="Overlay ride list">
        <section class="filters" aria-label="Ride overlay filters">
          <AppSelect
            id="overlay-location"
            v-model="locationId"
            label="Location"
            :options="locationOptions"
            :placeholder="isLoadingLocations ? 'Loading locations' : 'Select a location'"
          />

          <label class="date-field" for="overlay-start-date">
            <span>Start date</span>
            <input id="overlay-start-date" v-model="startDate" type="date" />
          </label>

          <label class="date-field" for="overlay-end-date">
            <span>End date</span>
            <input id="overlay-end-date" v-model="endDate" type="date" />
          </label>
        </section>

        <section class="condensed-list" aria-live="polite">
          <p v-if="isLoadingRides && rides.length === 0" class="status-text">Loading rides...</p>
          <p v-else-if="!selectedLocation" class="status-text">Select a location to load rides.</p>
          <p v-else-if="rides.length === 0" class="status-text">No rides match these filters.</p>

          <article v-for="ride in rides" v-else :key="ride.id" class="condensed-ride">
            <div>
              <h2>{{ ride.name }}</h2>
              <p>
                <span>{{ formatRideDate(ride.datetime) }}</span>
                <span>{{ formatDistance(ride.distance) }}</span>
                <span>{{ ride.location?.name ?? 'Location pending' }}</span>
              </p>
            </div>

            <template v-if="selectedRouteForRide(ride.id)">
              <label class="route-color-field" :for="`route-color-${ride.id}`">
                <span>Color</span>
                <input
                  :id="`route-color-${ride.id}`"
                  :disabled="useGlobalColor"
                  :value="selectedRouteForRide(ride.id)?.color"
                  type="color"
                  @input="updateRouteColor(ride.id, $event)"
                />
              </label>

              <button class="secondary-action" type="button" @click="removeRoute(ride.id)">
                Remove
              </button>
            </template>
            <button
              v-else
              class="primary-action"
              :disabled="isRouteLoading(ride.id)"
              type="button"
              @click="addRoute(ride)"
            >
              {{ isRouteLoading(ride.id) ? 'Adding...' : 'Add' }}
            </button>
          </article>
        </section>

        <button
          v-if="hasMoreRides"
          class="load-more"
          :disabled="isLoadingRides"
          type="button"
          @click="loadMoreRides"
        >
          {{ isLoadingRides ? 'Loading...' : 'Load more' }}
        </button>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.ride-overlay-page {
  background: #f8f6f0;
  min-height: calc(100vh - 4rem);
  padding: 2rem clamp(1rem, 4vw, 3rem) 3rem;
}

.page-header,
.overlay-layout,
.form-error {
  margin-left: auto;
  margin-right: auto;
  max-width: 84rem;
}

.page-header {
  margin-bottom: 1.25rem;
}

.overlay-layout {
  align-items: start;
  display: grid;
  gap: 1.5rem;
  grid-template-columns: minmax(0, 1.45fr) minmax(20rem, 0.75fr);
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  color: #142013;
  font-size: 2rem;
  line-height: 1.2;
}

.map-column,
.ride-panel {
  display: grid;
  gap: 1rem;
}

.map-controls,
.filters,
.condensed-ride {
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
}

.map-controls {
  align-items: end;
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(12rem, 1fr) minmax(12rem, auto) minmax(10rem, auto);
  padding: 1rem;
}

.control-field,
.date-field,
.route-color-field,
.toggle-field {
  color: #142013;
  display: grid;
  font-size: 0.95rem;
  font-weight: 700;
  gap: 0.5rem;
}

.toggle-field {
  align-items: center;
  display: flex;
  min-height: 2.875rem;
}

.compact-control {
  max-width: 10rem;
}

input[type='date'] {
  background: #ffffff;
  border: 0.0625rem solid rgba(53, 94, 59, 0.22);
  border-radius: 0.375rem;
  color: #142013;
  font: inherit;
  min-height: 2.875rem;
  padding: 0 0.75rem;
  width: 100%;
}

input[type='color'] {
  background: transparent;
  border: 0;
  cursor: pointer;
  height: 2.875rem;
  padding: 0;
  width: 4rem;
}

input[type='color']:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

input[type='range'] {
  accent-color: #355e3b;
  width: 100%;
}

input[type='checkbox'] {
  accent-color: #355e3b;
  height: 1rem;
  width: 1rem;
}

input:focus-visible,
button:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.34);
  outline-offset: 0.125rem;
}

.condensed-list,
.filters {
  display: grid;
  gap: 0.75rem;
}

.filters {
  padding: 1rem;
}

.condensed-ride {
  align-items: center;
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr) auto auto;
  padding: 1rem;
}

.condensed-ride h2 {
  color: #142013;
  font-size: 1rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.condensed-ride p {
  color: #52614f;
  font-size: 0.9rem;
  line-height: 1.45;
}

.condensed-ride p {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem 0.75rem;
}

.primary-action,
.secondary-action,
.load-more {
  align-items: center;
  border-radius: 0.375rem;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-weight: 800;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0 1rem;
  text-decoration: none;
}

.primary-action {
  background: #355e3b;
  border: 0.0625rem solid #355e3b;
  color: #ffffff;
}

.secondary-action,
.load-more {
  background: transparent;
  border: 0.0625rem solid rgba(53, 94, 59, 0.28);
  color: #355e3b;
}

.primary-action:disabled,
.secondary-action:disabled,
.load-more:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.load-more {
  width: 100%;
}

.status-text,
.form-error {
  background: rgba(255, 253, 247, 0.86);
  border-radius: 0.5rem;
  color: #52614f;
  font-weight: 700;
  padding: 1rem;
  text-align: center;
}

.form-error {
  border: 0.0625rem solid rgba(176, 44, 44, 0.22);
  color: #7c2020;
  margin-bottom: 1rem;
  text-align: left;
}

@media (max-width: 58rem) {
  .overlay-layout,
  .map-controls,
  .condensed-ride {
    grid-template-columns: 1fr;
  }

  .compact-control {
    max-width: none;
  }
}
</style>
