<script setup lang="ts">
import { api } from '@/services/api'
import { useToastStore } from '@/stores/toasts'

const toastStore = useToastStore()

async function runHealthcheck() {
  try {
    await api.get<{ status: string }>('/api/health')
    toastStore.success('The backend API responded successfully.', 'API healthy')
  } catch {
    return
  }
}

async function triggerNotFound() {
  try {
    await api.get('/api/test-errors/not-found')
  } catch {
    return
  }
}

async function triggerValidationError() {
  try {
    await api.get('/api/test-errors/validation')
  } catch {
    return
  }
}

async function triggerSessionPost() {
  try {
    const response = await api.post<{ status: string; count: number }>('/api/test-session', {})

    toastStore.success(`POST test succeeded. Session count is now ${response.count}.`, 'POST succeeded')
  } catch {
    return
  }
}

async function triggerServerError() {
  try {
    await api.get('/api/test-errors/server-error')
  } catch {
    return
  }
}
</script>

<template>
  <section class="hero">
    <v-container class="fill-height">
      <v-row align="center" class="hero-row" justify="space-between">
        <v-col cols="12" md="6">
          <div class="eyebrow">BikeMap</div>
          <h1 class="headline">Track every mountain bike route worth riding twice.</h1>
          <p class="intro">
            Keep a clean record of the trails you ride, remember the lines you liked, and build a
            personal map of every loop, climb, and descent.
          </p>
          <div class="actions">
            <v-btn color="primary" href="#highlights" rounded="pill" size="x-large">
              See what BikeMap tracks
            </v-btn>
            <v-btn href="#welcome-card" rounded="pill" size="x-large" variant="text">
              Why riders use it
            </v-btn>
          </div>
          <div class="toast-demo">
            <v-btn color="success" rounded="pill" variant="flat" @click="runHealthcheck">
              Check API
            </v-btn>
            <v-btn color="warning" rounded="pill" variant="flat" @click="triggerNotFound">
              Test 404
            </v-btn>
            <v-btn color="warning" rounded="pill" variant="flat" @click="triggerValidationError">
              Test validation
            </v-btn>
            <v-btn color="success" rounded="pill" variant="flat" @click="triggerSessionPost">
              Test POST
            </v-btn>
            <v-btn color="error" rounded="pill" variant="flat" @click="triggerServerError">
              Test server error
            </v-btn>
          </div>
        </v-col>

        <v-col cols="12" md="5">
          <v-card id="welcome-card" class="trail-card" elevation="10" rounded="xl">
            <div class="card-label">Ride Log</div>
            <div class="card-title">Your trail history, organized for the next ride.</div>
            <div class="card-copy">
              BikeMap is built for riders who want more than a pile of GPX files. Save routes,
              remember trail conditions, and return to the runs that earned another lap.
            </div>

            <v-divider class="my-6" />

            <div class="metric-list">
              <v-sheet class="metric" color="surface" rounded="lg">
                <div class="metric-value">Routes</div>
                <div class="metric-text">Store each ride as a route you can find again fast.</div>
              </v-sheet>
              <v-sheet class="metric" color="surface" rounded="lg">
                <div class="metric-value">Notes</div>
                <div class="metric-text">
                  Keep track of terrain, weather, and the sections worth repeating.
                </div>
              </v-sheet>
              <v-sheet class="metric" color="surface" rounded="lg">
                <div class="metric-value">Recall</div>
                <div class="metric-text">
                  Build a riding memory that stays useful all season.
                </div>
              </v-sheet>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </section>

  <section id="highlights" class="highlights">
    <v-container>
      <v-row>
        <v-col cols="12" md="4">
          <v-card class="feature-card" height="100%" rounded="xl" variant="tonal">
            <div class="feature-title">Save routes that matter</div>
            <p class="feature-copy">
              Keep your favorite climbs, descents, and loops in one place instead of digging through
              old ride files.
            </p>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="feature-card" height="100%" rounded="xl" variant="tonal">
            <div class="feature-title">Add context to each ride</div>
            <p class="feature-copy">
              Capture conditions, difficulty, and trail notes so the next outing starts with better
              information.
            </p>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="feature-card" height="100%" rounded="xl" variant="tonal">
            <div class="feature-title">Build your own trail map</div>
            <p class="feature-copy">
              Turn repeated rides into a personal map of where you have been and where you want to
              ride next.
            </p>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<style scoped>
.hero {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(163, 214, 181, 0.28), transparent 38%),
    linear-gradient(160deg, #f5f1e8 0%, #dce7d4 48%, #f8f6f0 100%);
}

.hero-row {
  min-height: 100vh;
  padding: 3rem 0;
}

.eyebrow {
  color: #355e3b;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.headline {
  color: #142013;
  font-size: clamp(2.8rem, 6vw, 5.2rem);
  line-height: 1;
  margin: 0 0 1.5rem;
  max-width: 11ch;
}

.intro {
  color: rgba(20, 32, 19, 0.82);
  font-size: 1.1rem;
  line-height: 1.7;
  margin: 0;
  max-width: 34rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
}

.toast-demo {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.trail-card {
  background: rgba(253, 251, 246, 0.88);
  backdrop-filter: blur(0.75rem);
  padding: 1.75rem;
}

.card-label {
  color: #355e3b;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
}

.card-title {
  color: #142013;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 0.75rem;
}

.card-copy {
  color: rgba(20, 32, 19, 0.76);
  font-size: 1rem;
  line-height: 1.7;
}

.metric-list {
  display: grid;
  gap: 0.875rem;
}

.metric {
  border: 0.0625rem solid rgba(53, 94, 59, 0.12);
  padding: 1rem;
}

.metric-value {
  color: #1f3523;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.375rem;
}

.metric-text {
  color: rgba(20, 32, 19, 0.72);
  line-height: 1.5;
}

.highlights {
  background: #f8f6f0;
  padding: 2rem 0 4rem;
}

.feature-card {
  background: #eef3e8;
  padding: 1.5rem;
}

.feature-title {
  color: #1f3523;
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.feature-copy {
  color: rgba(20, 32, 19, 0.75);
  line-height: 1.65;
  margin: 0;
}

@media (max-width: 59.9375rem) {
  .hero-row {
    min-height: auto;
    padding: 2rem 0 3rem;
  }

  .headline {
    max-width: 100%;
  }
}
</style>
