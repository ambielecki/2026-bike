<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import AppSelect from '@/components/form/AppSelect.vue'
import { ApiError } from '@/services/api'
import {
  getLocations,
  getRides,
  type Location,
  type PaginationMeta,
  type RideListItem,
} from '@/services/rides'

const locations = ref<Location[]>([])
const rides = ref<RideListItem[]>([])
const locationId = ref('')
const dateRange = ref('')
const perPage = ref('10')
const page = ref(1)
const isLoading = ref(false)
const formError = ref('')
const meta = ref<PaginationMeta>({
  current_page: 1,
  from: null,
  last_page: 1,
  per_page: 10,
  to: null,
  total: 0,
})

const locationOptions = computed(() =>
  locations.value.map((location) => ({
    label: location.name,
    value: String(location.id),
  })),
)

const dateRangeOptions = [
  {
    label: 'Last week',
    value: 'last_week',
  },
  {
    label: 'Last month',
    value: 'last_month',
  },
  {
    label: 'Last year',
    value: 'last_year',
  },
]

const perPageOptions = [
  {
    label: '10',
    value: '10',
  },
  {
    label: '25',
    value: '25',
  },
  {
    label: '50',
    value: '50',
  },
]

const pageStatus = computed(() => {
  if (meta.value.total === 0) {
    return 'No rides'
  }

  return `${meta.value.from}-${meta.value.to} of ${meta.value.total}`
})

onMounted(async () => {
  await loadLocations()
  await loadRides()
})

watch([locationId, dateRange, perPage], () => {
  page.value = 1
  void loadRides()
})

async function loadLocations() {
  try {
    locations.value = await getLocations()
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'Unable to load locations.'
  }
}

async function loadRides() {
  isLoading.value = true
  formError.value = ''

  try {
    const response = await getRides({
      dateRange: dateRange.value as '' | 'last_week' | 'last_month' | 'last_year',
      locationId: locationId.value,
      page: page.value,
      perPage: Number(perPage.value) as 10 | 25 | 50,
    })

    rides.value = response.data
    meta.value = response.meta
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'Unable to load rides.'
  } finally {
    isLoading.value = false
  }
}

function previousPage() {
  if (page.value <= 1) {
    return
  }

  page.value -= 1
  void loadRides()
}

function nextPage() {
  if (page.value >= meta.value.last_page) {
    return
  }

  page.value += 1
  void loadRides()
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

function formatTotalTime(value: string | null) {
  if (value === null) {
    return 'Time pending'
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
  <main class="ride-list-page">
    <section class="page-header">
      <h1>Rides</h1>
      <RouterLink class="primary-link" :to="{ name: 'add-ride' }">Add Ride</RouterLink>
    </section>

    <section class="filters" aria-label="Ride filters">
      <AppSelect
        id="ride-list-location"
        v-model="locationId"
        label="Location"
        :options="locationOptions"
        placeholder="All locations"
      />
      <AppSelect
        id="ride-list-date-range"
        v-model="dateRange"
        label="Date range"
        :options="dateRangeOptions"
        placeholder="All dates"
      />
      <AppSelect
        id="ride-list-per-page"
        v-model="perPage"
        label="Page size"
        :options="perPageOptions"
        placeholder="10"
      />
    </section>

    <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

    <section class="ride-list" aria-live="polite">
      <p v-if="isLoading" class="status-text">Loading rides...</p>

      <p v-else-if="rides.length === 0" class="status-text">No rides match these filters.</p>

      <article v-for="ride in rides" v-else :key="ride.id" class="ride-row">
        <div class="ride-summary">
          <RouterLink class="ride-title" :to="{ name: 'ride-details', params: { id: ride.id } }">
            {{ ride.name }}
          </RouterLink>
          <div class="ride-meta">
            <span>{{ formatRideDate(ride.datetime) }}</span>
            <span>{{ formatDistance(ride.distance) }}</span>
            <span>{{ formatTotalTime(ride.total_time) }}</span>
            <span v-if="ride.location">{{ ride.location.name }}</span>
          </div>
        </div>
      </article>
    </section>

    <nav class="pagination" aria-label="Ride pages">
      <button class="secondary-action" :disabled="page <= 1 || isLoading" type="button" @click="previousPage">
        Previous
      </button>
      <span>{{ pageStatus }}</span>
      <button
        class="secondary-action"
        :disabled="page >= meta.last_page || isLoading"
        type="button"
        @click="nextPage"
      >
        Next
      </button>
    </nav>
  </main>
</template>

<style scoped>
.ride-list-page {
  background: #f8f6f0;
  min-height: calc(100vh - 4rem);
  padding: 2rem clamp(1rem, 4vw, 3rem) 3rem;
}

.page-header,
.filters,
.form-error,
.ride-list,
.pagination {
  margin-left: auto;
  margin-right: auto;
  max-width: 64rem;
}

.page-header {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

h1,
p {
  margin: 0;
}

h1 {
  color: #142013;
  font-size: 2rem;
  line-height: 1.2;
}

.primary-link,
.secondary-action {
  align-items: center;
  border-radius: 0.375rem;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-weight: 700;
  justify-content: center;
  min-height: 2.875rem;
  padding: 0 1rem;
  text-decoration: none;
}

.primary-link {
  background: #355e3b;
  color: #ffffff;
}

.filters {
  align-items: end;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 1.25rem;
}

.form-error {
  background: rgba(176, 44, 44, 0.08);
  border: 0.0625rem solid rgba(176, 44, 44, 0.22);
  border-radius: 0.375rem;
  color: #7c2020;
  line-height: 1.5;
  margin-bottom: 1.25rem;
  padding: 0.75rem;
}

.ride-list {
  display: grid;
  gap: 0.75rem;
}

.ride-row {
  align-items: center;
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  min-height: 6rem;
  padding: 1rem;
}

.ride-summary {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
}

.ride-title {
  color: #142013;
  font-size: 1.1rem;
  font-weight: 800;
  overflow-wrap: anywhere;
  text-decoration: none;
}

.ride-title:hover {
  color: #355e3b;
}

.ride-meta {
  color: #52614f;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  line-height: 1.4;
}

.pagination {
  align-items: center;
  color: #52614f;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.25rem;
}

.secondary-action {
  background: #ffffff;
  border: 0.0625rem solid rgba(53, 94, 59, 0.32);
  color: #29492e;
}

.secondary-action:disabled {
  cursor: not-allowed;
  opacity: 0.56;
}

.primary-link:focus-visible,
.secondary-action:focus-visible,
.ride-title:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.28);
  outline-offset: 0.125rem;
}

.status-text {
  color: #52614f;
  line-height: 1.5;
  padding: 1rem 0;
}

@media (max-width: 48rem) {
  .filters {
    grid-template-columns: 1fr;
  }

  .page-header,
  .pagination {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
