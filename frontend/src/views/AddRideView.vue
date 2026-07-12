<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AuthTextField from '@/components/auth/AuthTextField.vue'
import AppFileField from '@/components/form/AppFileField.vue'
import AppSelect from '@/components/form/AppSelect.vue'
import AppTextarea from '@/components/form/AppTextarea.vue'
import { ApiError } from '@/services/api'
import {
  createLocation,
  createRide,
  getLocations,
  type Location,
} from '@/services/rides'
import { useToastStore } from '@/stores/toasts'

const router = useRouter()
const toastStore = useToastStore()

const locations = ref<Location[]>([])
const name = ref('')
const description = ref('')
const locationId = ref('')
const fitFile = ref<File | null>(null)
const nameError = ref('')
const locationError = ref('')
const fitFileError = ref('')
const formError = ref('')
const isLoadingLocations = ref(false)
const isSubmitting = ref(false)

const isLocationModalOpen = ref(false)
const newLocationName = ref('')
const newLocationLatitude = ref('')
const newLocationLongitude = ref('')
const newLocationNameError = ref('')
const newLocationLatitudeError = ref('')
const newLocationLongitudeError = ref('')
const newLocationFormError = ref('')
const isCreatingLocation = ref(false)

const locationOptions = computed(() =>
  locations.value.map((location) => ({
    label: location.name,
    value: String(location.id),
  })),
)

onMounted(() => {
  void loadLocations()
})

async function loadLocations() {
  isLoadingLocations.value = true
  formError.value = ''

  try {
    locations.value = await getLocations()
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'Unable to load locations.'
  } finally {
    isLoadingLocations.value = false
  }
}

async function submitRide() {
  formError.value = ''

  if (![validateName(), validateLocation(), validateFitFile()].every(Boolean) || !fitFile.value) {
    return
  }

  isSubmitting.value = true

  try {
    await createRide({
      name: name.value.trim(),
      description: description.value.trim(),
      locationId: Number(locationId.value),
      fitFile: fitFile.value,
    })
    toastStore.success('Ride added to ShowMyRides')
    await router.push({ name: 'rides' })
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'Unable to add ride.'
  } finally {
    isSubmitting.value = false
  }
}

function validateName() {
  if (!name.value.trim()) {
    nameError.value = 'Name is required.'
    return false
  }

  nameError.value = ''
  return true
}

function validateLocation() {
  if (!locationId.value) {
    locationError.value = 'Location is required.'
    return false
  }

  locationError.value = ''
  return true
}

function validateFitFile() {
  if (!fitFile.value) {
    fitFileError.value = 'FIT file is required.'
    return false
  }

  if (!fitFile.value.name.toLowerCase().endsWith('.fit')) {
    fitFileError.value = 'Choose a .fit file.'
    return false
  }

  fitFileError.value = ''
  return true
}

function openLocationModal() {
  resetLocationModal()
  isLocationModalOpen.value = true
}

function closeLocationModal() {
  isLocationModalOpen.value = false
}

async function submitLocation() {
  newLocationFormError.value = ''

  const isValid = [
    validateNewLocationName(),
    validateCoordinate(newLocationLatitude, newLocationLatitudeError, 'Latitude', -90, 90),
    validateCoordinate(newLocationLongitude, newLocationLongitudeError, 'Longitude', -180, 180),
  ].every(Boolean)

  if (!isValid) {
    return
  }

  isCreatingLocation.value = true

  try {
    const location = await createLocation({
      name: newLocationName.value.trim(),
      latitude: newLocationLatitude.value.trim(),
      longitude: newLocationLongitude.value.trim(),
    })

    await loadLocations()
    locationId.value = String(location.id)
    locationError.value = ''
    closeLocationModal()
  } catch (error) {
    newLocationFormError.value = error instanceof ApiError ? error.message : 'Unable to create location.'
  } finally {
    isCreatingLocation.value = false
  }
}

function validateNewLocationName() {
  if (!newLocationName.value.trim()) {
    newLocationNameError.value = 'Name is required.'
    return false
  }

  newLocationNameError.value = ''
  return true
}

function validateCoordinate(
  value: typeof newLocationLatitude,
  error: typeof newLocationLatitudeError,
  label: string,
  min: number,
  max: number,
) {
  const trimmedValue = String(value.value).trim()

  if (!trimmedValue) {
    error.value = `${label} is required.`
    return false
  }

  const numberValue = Number(trimmedValue)

  if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max) {
    error.value = `${label} must be between ${min} and ${max}.`
    return false
  }

  error.value = ''
  return true
}

function resetLocationModal() {
  newLocationName.value = ''
  newLocationLatitude.value = ''
  newLocationLongitude.value = ''
  newLocationNameError.value = ''
  newLocationLatitudeError.value = ''
  newLocationLongitudeError.value = ''
  newLocationFormError.value = ''
}
</script>

<template>
  <main class="add-ride-page">
    <section class="page-header">
      <h1>Add Ride</h1>
    </section>

    <section class="form-panel" aria-labelledby="add-ride-title">
      <div class="panel-heading">
        <h2 id="add-ride-title">Ride Details</h2>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      </div>

      <form class="ride-form" novalidate @submit.prevent="submitRide">
        <AuthTextField id="ride-name" v-model="name" :error="nameError" label="Name" />

        <AppTextarea id="ride-description" v-model="description" label="Description" />

        <div class="location-row">
          <AppSelect
            id="ride-location"
            v-model="locationId"
            :error="locationError"
            label="Location"
            :options="locationOptions"
            :placeholder="isLoadingLocations ? 'Loading locations...' : 'Select a location'"
          />
          <button class="secondary-action" type="button" @click="openLocationModal">
            New Location
          </button>
        </div>

        <AppFileField
          id="ride-fit-file"
          accept=".fit"
          :error="fitFileError"
          label="FIT file"
          @change="fitFile = $event"
        />

        <button class="primary-action" :disabled="isSubmitting" type="submit">
          {{ isSubmitting ? 'Adding ride...' : 'Add Ride' }}
        </button>
      </form>
    </section>

    <div v-if="isLocationModalOpen" class="modal-layer" role="presentation">
      <button class="modal-backdrop" type="button" aria-label="Close location form" @click="closeLocationModal"></button>

      <section
        class="modal-panel"
        aria-labelledby="new-location-title"
        aria-modal="true"
        role="dialog"
      >
        <div class="modal-header">
          <h2 id="new-location-title">New Location</h2>
          <button class="close-button" type="button" aria-label="Close location form" @click="closeLocationModal">
            ×
          </button>
        </div>

        <p v-if="newLocationFormError" class="form-error" role="alert">
          {{ newLocationFormError }}
        </p>

        <form class="location-form" novalidate @submit.prevent="submitLocation">
          <AuthTextField
            id="new-location-name"
            v-model="newLocationName"
            :error="newLocationNameError"
            label="Name"
          />
          <AuthTextField
            id="new-location-latitude"
            v-model="newLocationLatitude"
            :error="newLocationLatitudeError"
            label="Latitude"
            inputmode="decimal"
          />
          <AuthTextField
            id="new-location-longitude"
            v-model="newLocationLongitude"
            :error="newLocationLongitudeError"
            label="Longitude"
            inputmode="decimal"
          />

          <div class="modal-actions">
            <button class="secondary-action" type="button" @click="closeLocationModal">
              Cancel
            </button>
            <button class="primary-action" :disabled="isCreatingLocation" type="submit">
              {{ isCreatingLocation ? 'Saving...' : 'Save Location' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.add-ride-page {
  background: #f8f6f0;
  min-height: calc(100vh - 4rem);
  padding: 2rem clamp(1rem, 4vw, 3rem) 3rem;
}

.page-header,
.form-panel {
  margin: 0 auto;
  max-width: 52rem;
}

.page-header {
  margin-bottom: 1.25rem;
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

h2 {
  color: #142013;
  font-size: 1.25rem;
  line-height: 1.3;
}

.form-panel,
.modal-panel {
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2rem rgba(20, 32, 19, 0.08);
}

.form-panel {
  padding: clamp(1.25rem, 4vw, 2rem);
}

.panel-heading {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.ride-form,
.location-form {
  display: grid;
  gap: 1.125rem;
}

.location-row {
  align-items: end;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(0, 1fr) auto;
}

.primary-action,
.secondary-action {
  border-radius: 0.375rem;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  min-height: 2.875rem;
  padding: 0 1rem;
}

.primary-action {
  background: #355e3b;
  border: 0;
  color: #ffffff;
}

.primary-action:disabled {
  cursor: wait;
  opacity: 0.72;
}

.primary-action:hover:not(:disabled) {
  background: #29492e;
}

.secondary-action {
  background: #ffffff;
  border: 0.0625rem solid rgba(53, 94, 59, 0.32);
  color: #29492e;
}

.primary-action:focus-visible,
.secondary-action:focus-visible,
.close-button:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.28);
  outline-offset: 0.125rem;
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

@media (max-width: 40rem) {
  .location-row {
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .modal-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
}
</style>
