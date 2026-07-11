<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AuthTextField from '@/components/auth/AuthTextField.vue'
import AppTextarea from '@/components/form/AppTextarea.vue'
import RideRouteMap from '@/components/map/RideRouteMap.vue'
import { ApiError } from '@/services/api'
import {
  deleteRide,
  getRide,
  type MapProvider,
  updateRide,
  type RideDetails,
  type RoutePoint,
} from '@/services/rides'
import { useToastStore } from '@/stores/toasts'

interface MapRoute {
  id: string
  name: string
  color: string
  points: RoutePoint[]
  visible: boolean
}

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const ride = ref<RideDetails | null>(null)
const formError = ref('')
const isLoading = ref(false)
const routeColor = ref('#1f7a4d')
const routeOpacity = ref(0.75)
const routeVisible = ref(true)
const isEditModalOpen = ref(false)
const editName = ref('')
const editDescription = ref('')
const editNameError = ref('')
const editFormError = ref('')
const isSaving = ref(false)
const isDeleteModalOpen = ref(false)
const deleteFormError = ref('')
const isDeleting = ref(false)

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
  const locationLongitude = ride.value?.location
    ? Number(ride.value.location.longitude)
    : Number.NaN

  if (Number.isFinite(locationLatitude) && Number.isFinite(locationLongitude)) {
    return {
      latitude: locationLatitude,
      longitude: locationLongitude,
    }
  }

  return ride.value?.route_data[0] ?? null
})

const mapProvider = computed<MapProvider>(() => ride.value?.location?.map_provider ?? 'openstreetmap')

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

function openEditModal() {
  if (!ride.value) {
    return
  }

  editName.value = ride.value.name
  editDescription.value = ride.value.description ?? ''
  editNameError.value = ''
  editFormError.value = ''
  isEditModalOpen.value = true
}

function closeEditModal() {
  if (isSaving.value) {
    return
  }

  isEditModalOpen.value = false
}

async function submitEdit() {
  editFormError.value = ''

  if (!validateEditName() || !ride.value) {
    return
  }

  isSaving.value = true

  try {
    ride.value = await updateRide(ride.value.id, {
      name: editName.value.trim(),
      description: editDescription.value.trim() || null,
    })
    isEditModalOpen.value = false
    toastStore.success('Ride updated')
  } catch (error) {
    editFormError.value = error instanceof ApiError ? error.message : 'Unable to update ride.'
  } finally {
    isSaving.value = false
  }
}

function validateEditName() {
  if (!editName.value.trim()) {
    editNameError.value = 'Name is required.'
    return false
  }

  editNameError.value = ''
  return true
}

function openDeleteModal() {
  deleteFormError.value = ''
  isDeleteModalOpen.value = true
}

function closeDeleteModal() {
  if (isDeleting.value) {
    return
  }

  isDeleteModalOpen.value = false
}

async function confirmDelete() {
  if (!ride.value) {
    return
  }

  deleteFormError.value = ''
  isDeleting.value = true

  try {
    await deleteRide(ride.value.id)
    toastStore.success('Ride deleted')
    await router.push({ name: 'rides' })
  } catch (error) {
    deleteFormError.value = error instanceof ApiError ? error.message : 'Unable to delete ride.'
  } finally {
    isDeleting.value = false
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
        <div class="title-row">
          <h1>{{ ride.name }}</h1>
          <div class="header-actions" aria-label="Ride actions">
            <button class="secondary-action" type="button" @click="openEditModal">Edit</button>
            <button class="danger-action" type="button" @click="openDeleteModal">Delete</button>
          </div>
        </div>
      </section>

      <section class="details-layout">
        <div class="map-column">
          <RideRouteMap
            :center="mapCenter"
            :map-provider="mapProvider"
            :opacity="routeOpacity"
            :routes="mapRoutes"
          />

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

      <div v-if="isEditModalOpen" class="modal-layer" role="presentation">
        <button
          class="modal-backdrop"
          type="button"
          aria-label="Close edit form"
          @click="closeEditModal"
        ></button>

        <section
          class="modal-panel"
          aria-labelledby="edit-ride-title"
          aria-modal="true"
          role="dialog"
        >
          <div class="modal-header">
            <h2 id="edit-ride-title">Edit Ride</h2>
            <button
              class="close-button"
              type="button"
              aria-label="Close edit form"
              @click="closeEditModal"
            >
              ×
            </button>
          </div>

          <p v-if="editFormError" class="form-error" role="alert">
            {{ editFormError }}
          </p>

          <form class="modal-form" novalidate @submit.prevent="submitEdit">
            <AuthTextField
              id="edit-ride-name"
              v-model="editName"
              :error="editNameError"
              label="Name"
            />
            <AppTextarea
              id="edit-ride-description"
              v-model="editDescription"
              label="Description"
              :rows="5"
            />

            <div class="modal-actions">
              <button class="secondary-action" type="button" @click="closeEditModal">Cancel</button>
              <button class="primary-action" :disabled="isSaving" type="submit">
                {{ isSaving ? 'Saving...' : 'Save Ride' }}
              </button>
            </div>
          </form>
        </section>
      </div>

      <div v-if="isDeleteModalOpen" class="modal-layer" role="presentation">
        <button
          class="modal-backdrop"
          type="button"
          aria-label="Close delete confirmation"
          @click="closeDeleteModal"
        ></button>

        <section
          class="modal-panel"
          aria-labelledby="delete-ride-title"
          aria-modal="true"
          role="dialog"
        >
          <div class="modal-header">
            <h2 id="delete-ride-title">Delete Ride</h2>
            <button
              class="close-button"
              type="button"
              aria-label="Close delete confirmation"
              @click="closeDeleteModal"
            >
              ×
            </button>
          </div>

          <p class="confirm-text">Delete {{ ride.name }}? This cannot be undone.</p>

          <p v-if="deleteFormError" class="form-error" role="alert">
            {{ deleteFormError }}
          </p>

          <div class="modal-actions">
            <button class="secondary-action" type="button" @click="closeDeleteModal">Cancel</button>
            <button
              class="danger-action"
              :disabled="isDeleting"
              type="button"
              @click="confirmDelete"
            >
              {{ isDeleting ? 'Deleting...' : 'Delete Ride' }}
            </button>
          </div>
        </section>
      </div>
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
h2,
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

h2 {
  color: #142013;
  font-size: 1.25rem;
  line-height: 1.3;
}

.back-link {
  color: #355e3b;
  font-weight: 800;
  justify-self: start;
  text-decoration: none;
}

.title-row {
  align-items: start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
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

.primary-action,
.secondary-action,
.danger-action {
  border-radius: 0.375rem;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  min-height: 2.75rem;
  padding: 0 1rem;
}

.primary-action {
  background: #355e3b;
  border: 0;
  color: #ffffff;
}

.primary-action:hover:not(:disabled) {
  background: #29492e;
}

.secondary-action {
  background: #ffffff;
  border: 0.0625rem solid rgba(53, 94, 59, 0.32);
  color: #29492e;
}

.danger-action {
  background: #9f2d2d;
  border: 0;
  color: #ffffff;
}

.danger-action:hover:not(:disabled) {
  background: #7c2020;
}

.primary-action:disabled,
.danger-action:disabled {
  cursor: wait;
  opacity: 0.72;
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

.modal-layer {
  align-items: center;
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 50;
}

.modal-backdrop {
  background: rgba(20, 32, 19, 0.42);
  border: 0;
  inset: 0;
  position: fixed;
}

.modal-panel {
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2rem rgba(20, 32, 19, 0.08);
  display: grid;
  gap: 1.125rem;
  max-width: 32rem;
  padding: 1.25rem;
  position: relative;
  width: min(100%, 32rem);
}

.modal-header,
.modal-actions {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.close-button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 0.375rem;
  color: #142013;
  cursor: pointer;
  display: inline-flex;
  font-size: 1.75rem;
  height: 2.5rem;
  justify-content: center;
  line-height: 1;
  padding: 0;
  width: 2.5rem;
}

.modal-form {
  display: grid;
  gap: 1.125rem;
}

.modal-actions {
  justify-content: flex-end;
}

.confirm-text {
  color: #142013;
  line-height: 1.5;
}

.back-link:focus-visible,
.primary-action:focus-visible,
.secondary-action:focus-visible,
.danger-action:focus-visible,
.close-button:focus-visible,
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

  .title-row {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 40rem) {
  .modal-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
}
</style>
