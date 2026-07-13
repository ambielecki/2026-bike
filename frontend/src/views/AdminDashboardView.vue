<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { getAdminStats, type AdminStats } from '@/services/admin'
import { ApiError } from '@/services/api'

const stats = ref<AdminStats | null>(null)
const isLoadingStats = ref(false)
const statsError = ref('')

const statCards = computed(() => [
  {
    label: 'Total Users',
    value: stats.value?.total_users ?? 0,
  },
  {
    label: 'New Users This Week',
    value: stats.value?.new_users_last_7_days ?? 0,
  },
  {
    label: 'Total Routes Logged',
    value: stats.value?.total_routes_logged ?? 0,
  },
  {
    label: 'Routes Logged This Week',
    value: stats.value?.routes_logged_last_7_days ?? 0,
  },
])

onMounted(() => {
  void loadStats()
})

async function loadStats() {
  isLoadingStats.value = true
  statsError.value = ''

  try {
    stats.value = await getAdminStats()
  } catch (error) {
    statsError.value = error instanceof ApiError ? error.message : 'Unable to load admin stats.'
  } finally {
    isLoadingStats.value = false
  }
}

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value)
}
</script>

<template>
  <main class="admin-page">
    <section class="page-header">
      <h1>Admin Tools</h1>
    </section>

    <section class="stats-section" aria-labelledby="admin-stats-title">
      <div class="section-heading">
        <h2 id="admin-stats-title">Overview</h2>
      </div>

      <p v-if="statsError" class="stats-error" role="alert">{{ statsError }}</p>
      <div v-else class="stats-grid" :aria-busy="isLoadingStats">
        <article v-for="card in statCards" :key="card.label" class="stat-card">
          <span class="stat-label">{{ card.label }}</span>
          <strong class="stat-value">
            {{ isLoadingStats && !stats ? '...' : formatCount(card.value) }}
          </strong>
        </article>
      </div>
    </section>

    <section class="admin-panel" aria-labelledby="homepage-admin-title">
      <div>
        <h2 id="homepage-admin-title">Homepage</h2>
        <p>Edit the public homepage text, highlights, and image carousel.</p>
      </div>

      <RouterLink class="primary-action" :to="{ name: 'admin-homepage' }">
        Edit Homepage
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.admin-page {
  background: #f8f6f0;
  min-height: calc(100vh - 4rem);
  padding: 2rem clamp(1rem, 4vw, 3rem) 3rem;
}

.page-header,
.stats-section,
.admin-panel {
  margin-left: auto;
  margin-right: auto;
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

p {
  color: #52614f;
  line-height: 1.5;
  margin-top: 0.5rem;
}

.stats-section {
  margin-bottom: 1.25rem;
}

.section-heading {
  margin-bottom: 0.75rem;
}

.stats-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.stat-card {
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  box-shadow: 0 0.75rem 1.5rem rgba(20, 32, 19, 0.06);
  display: grid;
  gap: 0.625rem;
  min-height: 7rem;
  padding: 1rem;
}

.stat-label {
  color: #52614f;
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.3;
}

.stat-value {
  align-self: end;
  color: #142013;
  font-size: 2rem;
  line-height: 1;
}

.stats-error {
  background: #fff7ed;
  border: 0.0625rem solid #fed7aa;
  border-radius: 0.5rem;
  color: #9a3412;
  margin: 0;
  padding: 1rem;
}

.admin-panel {
  align-items: center;
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2rem rgba(20, 32, 19, 0.08);
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: clamp(1.25rem, 4vw, 2rem);
}

.primary-action {
  align-items: center;
  background: #355e3b;
  border-radius: 0.375rem;
  color: #ffffff;
  display: inline-flex;
  font-weight: 700;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0 1rem;
  text-decoration: none;
  white-space: nowrap;
}

.primary-action:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.28);
  outline-offset: 0.125rem;
}

@media (max-width: 40rem) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .admin-panel {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (min-width: 40.001rem) and (max-width: 56rem) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
