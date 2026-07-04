<script setup lang="ts">
import { onMounted } from 'vue'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  void authStore.loadCurrentUser()
})

async function logOut() {
  await authStore.logout()
}
</script>

<template>
  <header class="app-navbar">
    <RouterLink class="brand-link" :to="{ name: 'home' }">BikeMap</RouterLink>

    <nav class="nav-links" aria-label="Primary navigation">
      <template v-if="authStore.isAuthenticated">
        <RouterLink class="nav-link" :to="{ name: 'rides' }">Rides</RouterLink>
        <RouterLink class="nav-link" :to="{ name: 'add-ride' }">Add Ride</RouterLink>
      </template>

      <template v-if="authStore.isAdmin">
        <RouterLink class="nav-link admin-link" :to="{ name: 'admin-tools' }">
          Admin Tools
        </RouterLink>
      </template>
    </nav>

    <nav class="account-links" aria-label="Account navigation">
      <template v-if="authStore.isAuthenticated">
        <RouterLink class="nav-link" :to="{ name: 'settings' }">Settings</RouterLink>
        <button class="nav-button" type="button" @click="logOut">Log Out</button>
      </template>

      <template v-else>
        <RouterLink class="nav-link" :to="{ name: 'register' }">Register</RouterLink>
        <RouterLink class="nav-link" :to="{ name: 'login' }">Log In</RouterLink>
      </template>
    </nav>
  </header>
</template>

<style scoped>
.app-navbar {
  align-items: center;
  background: rgba(253, 251, 246, 0.94);
  border-bottom: 1px solid rgba(53, 94, 59, 0.14);
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  justify-content: space-between;
  min-height: 64px;
  padding: 12px clamp(16px, 4vw, 48px);
  position: sticky;
  top: 0;
  z-index: 20;
}

.brand-link,
.nav-link,
.nav-button {
  align-items: center;
  border-radius: 6px;
  color: #142013;
  display: inline-flex;
  font-size: 0.95rem;
  min-height: 40px;
  padding: 0 12px;
  text-decoration: none;
}

.brand-link {
  color: #1f3523;
  font-size: 1.15rem;
  font-weight: 800;
  padding-left: 0;
}

.nav-links,
.account-links {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.account-links {
  margin-left: auto;
}

.nav-link.router-link-active {
  background: rgba(53, 94, 59, 0.1);
  color: #1f3523;
  font-weight: 700;
}

.admin-link {
  color: #604200;
}

.nav-button {
  background: transparent;
  border: 0;
  cursor: pointer;
  font: inherit;
}

.brand-link:focus-visible,
.nav-link:focus-visible,
.nav-button:focus-visible {
  outline: 3px solid rgba(53, 94, 59, 0.34);
  outline-offset: 2px;
}

.brand-link:hover,
.nav-link:hover,
.nav-button:hover {
  background: rgba(53, 94, 59, 0.08);
}

@media (max-width: 720px) {
  .app-navbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .account-links {
    margin-left: 0;
  }
}
</style>
