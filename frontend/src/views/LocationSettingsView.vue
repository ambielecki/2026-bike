<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AuthTextField from '@/components/auth/AuthTextField.vue'
import { ApiError } from '@/services/api'
import {
  getPaginatedLocations,
  updateLocation,
  type Location,
  type PaginationMeta,
} from '@/services/rides'
import { useToastStore } from '@/stores/toasts'

const toastStore = useToastStore()

const locations = ref<Location[]>([])
const pagination = ref<PaginationMeta | null>(null)
const currentPage = ref(1)
const perPage = ref<10 | 25 | 50>(10)
const formError = ref('')
const isLoading = ref(false)
const isEditModalOpen = ref(false)
const selectedLocation = ref<Location | null>(null)
const editName = ref('')
const editLatitude = ref('')
const editLongitude = ref('')
const editNameError = ref('')
const editLatitudeError = ref('')
const editLongitudeError = ref('')
const editFormError = ref('')
const isSaving = ref(false)

const canGoPrevious = computed(() => currentPage.value > 1)
const canGoNext = computed(() => currentPage.value < (pagination.value?.last_page ?? 1))
const resultSummary = computed(() => {
  if (!pagination.value || pagination.value.total === 0) {
    return 'No locations found.'
  }

  return `Showing ${pagination.value.from} to ${pagination.value.to} of ${pagination.value.total} locations.`
})

onMounted(() => {
  void loadLocations()
})

async function loadLocations(page = currentPage.value) {
  isLoading.value = true
  formError.value = ''

  try {
    const response = await getPaginatedLocations({
      page,
      perPage: perPage.value,
    })

    locations.value = response.data
    pagination.value = response.meta
    currentPage.value = response.meta.current_page
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'Unable to load locations.'
  } finally {
    isLoading.value = false
  }
}

function openEditModal(location: Location) {
  selectedLocation.value = location
  editName.value = location.name
  editLatitude.value = location.latitude
  editLongitude.value = location.longitude
  editNameError.value = ''
  editLatitudeError.value = ''
  editLongitudeError.value = ''
  editFormError.value = ''
  isEditModalOpen.value = true
}

function closeEditModal() {
  if (isSaving.value) {
    return
  }

  isEditModalOpen.value = false
}

async function submitLocation() {
  editFormError.value = ''

  if (
    ![validateName(), validateLatitude(), validateLongitude()].every(Boolean) ||
    !selectedLocation.value
  ) {
    return
  }

  isSaving.value = true

  try {
    const updatedLocation = await updateLocation(selectedLocation.value.id, {
      name: editName.value.trim(),
      latitude: editLatitude.value.trim(),
      longitude: editLongitude.value.trim(),
    })

    locations.value = locations.value.map((location) =>
      location.id === updatedLocation.id ? updatedLocation : location,
    )
    isEditModalOpen.value = false
    toastStore.success('Location updated')
  } catch (error) {
    editFormError.value = error instanceof ApiError ? error.message : 'Unable to update location.'
  } finally {
    isSaving.value = false
  }
}

function validateName() {
  if (!editName.value.trim()) {
    editNameError.value = 'Name is required.'
    return false
  }

  editNameError.value = ''
  return true
}

function validateLatitude() {
  const value = Number(editLatitude.value)

  if (!editLatitude.value.trim()) {
    editLatitudeError.value = 'Latitude is required.'
    return false
  }

  if (!Number.isFinite(value) || value < -90 || value > 90) {
    editLatitudeError.value = 'Latitude must be between -90 and 90.'
    return false
  }

  editLatitudeError.value = ''
  return true
}

function validateLongitude() {
  const value = Number(editLongitude.value)

  if (!editLongitude.value.trim()) {
    editLongitudeError.value = 'Longitude is required.'
    return false
  }

  if (!Number.isFinite(value) || value < -180 || value > 180) {
    editLongitudeError.value = 'Longitude must be between -180 and 180.'
    return false
  }

  editLongitudeError.value = ''
  return true
}
</script>

<template>
  <main class="location-settings-page">
    <section class="page-header">
      <RouterLink class="back-link" :to="{ name: 'settings' }">Back to settings</RouterLink>
      <h1>Locations</h1>
    </section>

    <section class="settings-panel" aria-labelledby="locations-title">
      <div class="panel-heading">
        <h2 id="locations-title">Location Management</h2>
        <p>{{ resultSummary }}</p>
      </div>

      <p v-if="isLoading" class="status-text">Loading locations...</p>

      <p v-else-if="formError" class="form-error" role="alert">
        {{ formError }}
      </p>

      <ul v-else-if="locations.length" class="location-list">
        <li v-for="location in locations" :key="location.id" class="location-item">
          <div class="location-details">
            <h3>{{ location.name }}</h3>
            <p>{{ location.latitude }}, {{ location.longitude }}</p>
          </div>

          <button class="secondary-action" type="button" @click="openEditModal(location)">
            Edit
          </button>
        </li>
      </ul>

      <nav class="pagination-controls" aria-label="Location pagination">
        <button
          class="secondary-action"
          :disabled="!canGoPrevious || isLoading"
          type="button"
          @click="loadLocations(currentPage - 1)"
        >
          Previous
        </button>
        <span>Page {{ currentPage }} of {{ pagination?.last_page ?? 1 }}</span>
        <button
          class="secondary-action"
          :disabled="!canGoNext || isLoading"
          type="button"
          @click="loadLocations(currentPage + 1)"
        >
          Next
        </button>
      </nav>
    </section>

    <div v-if="isEditModalOpen" class="modal-layer" role="presentation">
      <button
        class="modal-backdrop"
        type="button"
        aria-label="Close location form"
        @click="closeEditModal"
      ></button>

      <section
        class="modal-panel"
        aria-labelledby="edit-location-title"
        aria-modal="true"
        role="dialog"
      >
        <div class="modal-header">
          <h2 id="edit-location-title">Edit Location</h2>
          <button
            class="close-button"
            type="button"
            aria-label="Close location form"
            @click="closeEditModal"
          >
            ×
          </button>
        </div>

        <p v-if="editFormError" class="form-error" role="alert">
          {{ editFormError }}
        </p>

        <form class="location-form" novalidate @submit.prevent="submitLocation">
          <AuthTextField
            id="edit-location-name"
            v-model="editName"
            :error="editNameError"
            label="Name"
          />
          <AuthTextField
            id="edit-location-latitude"
            v-model="editLatitude"
            :error="editLatitudeError"
            inputmode="decimal"
            label="Latitude"
          />
          <AuthTextField
            id="edit-location-longitude"
            v-model="editLongitude"
            :error="editLongitudeError"
            inputmode="decimal"
            label="Longitude"
          />

          <div class="modal-actions">
            <button class="secondary-action" type="button" @click="closeEditModal">Cancel</button>
            <button class="primary-action" :disabled="isSaving" type="submit">
              {{ isSaving ? 'Saving...' : 'Save Location' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.location-settings-page {
  background: #f8f6f0;
  min-height: calc(100vh - 4rem);
  padding: 2rem clamp(1rem, 4vw, 3rem) 3rem;
}

.page-header,
.settings-panel {
  margin-left: auto;
  margin-right: auto;
  max-width: 52rem;
}

.page-header {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  color: #142013;
  font-size: 2rem;
  line-height: 1.2;
}

h2 {
  color: #142013;
  font-size: 1.25rem;
  line-height: 1.3;
}

h3 {
  color: #142013;
  font-size: 1rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

p {
  color: #52614f;
  line-height: 1.5;
}

.back-link {
  color: #355e3b;
  font-weight: 800;
  justify-self: start;
  text-decoration: none;
}

.settings-panel {
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2rem rgba(20, 32, 19, 0.08);
  display: grid;
  gap: 0.75rem;
  padding: clamp(1.25rem, 4vw, 2rem);
}

.panel-heading,
.location-details,
.location-form {
  display: grid;
  gap: 0.5rem;
}

.location-list {
  display: grid;
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.location-item {
  align-items: center;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 1rem;
}

.primary-action,
.secondary-action {
  align-items: center;
  border-radius: 0.375rem;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-weight: 700;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0 1rem;
  text-decoration: none;
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

.primary-action:disabled,
.secondary-action:disabled {
  cursor: wait;
  opacity: 0.6;
}

.pagination-controls {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
}

.pagination-controls span {
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
  max-width: 30rem;
  padding: 1.25rem;
  position: relative;
  width: min(100%, 30rem);
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

.modal-actions {
  justify-content: flex-end;
}

.back-link:focus-visible,
.primary-action:focus-visible,
.secondary-action:focus-visible,
.close-button:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.28);
  outline-offset: 0.125rem;
}

@media (max-width: 40rem) {
  .location-item {
    align-items: stretch;
    flex-direction: column;
  }

  .modal-actions,
  .pagination-controls {
    align-items: stretch;
    flex-direction: column-reverse;
  }
}
</style>
