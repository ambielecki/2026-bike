<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'

const authStore = useAuthStore()
const router = useRouter()
const toastStore = useToastStore()
const isMobileMenuOpen = ref(false)

onMounted(() => {
  void authStore.loadCurrentUser()
})

async function logOut() {
  await authStore.logout()
  toastStore.success('Successfully Logged Out')
  closeMobileMenu()
  await router.push({ name: 'home' })
}

function openMobileMenu() {
  isMobileMenuOpen.value = true
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <header class="app-navbar">
    <RouterLink class="brand-link" :to="{ name: 'home' }">BikeMap</RouterLink>

    <button
      class="menu-button"
      type="button"
      aria-controls="mobile-navigation"
      :aria-expanded="isMobileMenuOpen ? 'true' : 'false'"
      aria-label="Open navigation"
      @click="openMobileMenu"
    >
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </button>

    <nav class="nav-links desktop-links" aria-label="Primary navigation">
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

    <nav class="account-links desktop-links" aria-label="Account navigation">
      <template v-if="authStore.isAuthenticated">
        <RouterLink class="nav-link" :to="{ name: 'settings' }">Settings</RouterLink>
        <button class="nav-button" type="button" @click="logOut">Log Out</button>
      </template>

      <template v-else>
        <RouterLink class="nav-link" :to="{ name: 'register' }">Register</RouterLink>
        <RouterLink class="nav-link" :to="{ name: 'login' }">Log In</RouterLink>
      </template>
    </nav>

    <template v-if="isMobileMenuOpen">
      <button
        class="drawer-backdrop"
        type="button"
        aria-label="Close navigation"
        @click="closeMobileMenu"
      ></button>

      <aside id="mobile-navigation" class="mobile-drawer" aria-label="Mobile navigation">
        <div class="drawer-header">
          <RouterLink class="brand-link" :to="{ name: 'home' }" @click="closeMobileMenu">
            BikeMap
          </RouterLink>
          <button class="drawer-close" type="button" aria-label="Close navigation" @click="closeMobileMenu">
            ×
          </button>
        </div>

        <nav class="drawer-links" aria-label="Mobile primary navigation">
          <template v-if="authStore.isAuthenticated">
            <RouterLink class="drawer-link" :to="{ name: 'rides' }" @click="closeMobileMenu">
              Rides
            </RouterLink>
            <RouterLink class="drawer-link" :to="{ name: 'add-ride' }" @click="closeMobileMenu">
              Add Ride
            </RouterLink>
          </template>

          <template v-if="authStore.isAdmin">
            <RouterLink
              class="drawer-link admin-link"
              :to="{ name: 'admin-tools' }"
              @click="closeMobileMenu"
            >
              Admin Tools
            </RouterLink>
          </template>

          <template v-if="authStore.isAuthenticated">
            <RouterLink class="drawer-link" :to="{ name: 'settings' }" @click="closeMobileMenu">
              Settings
            </RouterLink>
            <button class="drawer-button" type="button" @click="logOut">Log Out</button>
          </template>

          <template v-else>
            <RouterLink class="drawer-link" :to="{ name: 'register' }" @click="closeMobileMenu">
              Register
            </RouterLink>
            <RouterLink class="drawer-link" :to="{ name: 'login' }" @click="closeMobileMenu">
              Log In
            </RouterLink>
          </template>
        </nav>
      </aside>
    </template>
  </header>
</template>

<style scoped>
.app-navbar {
  align-items: center;
  background: rgba(253, 251, 246, 0.94);
  border-bottom: 0.0625rem solid rgba(53, 94, 59, 0.14);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  justify-content: space-between;
  min-height: 4rem;
  padding: 0.75rem clamp(1rem, 4vw, 3rem);
  position: sticky;
  top: 0;
  z-index: 20;
}

.brand-link,
.nav-link,
.nav-button {
  align-items: center;
  border-radius: 0.375rem;
  color: #142013;
  display: inline-flex;
  font-size: 0.95rem;
  min-height: 2.5rem;
  padding: 0 0.75rem;
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
  gap: 0.25rem;
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

.menu-button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 0.375rem;
  cursor: pointer;
  display: none;
  flex-direction: column;
  gap: 0.3125rem;
  height: 2.5rem;
  justify-content: center;
  margin-left: auto;
  padding: 0;
  width: 2.5rem;
}

.menu-button span {
  background: #142013;
  border-radius: 999rem;
  display: block;
  height: 0.125rem;
  width: 1.375rem;
}

.drawer-backdrop {
  background: rgba(20, 32, 19, 0.34);
  border: 0;
  inset: 0;
  position: fixed;
  z-index: 30;
}

.mobile-drawer {
  background: #fffdf7;
  border-right: 0.0625rem solid rgba(53, 94, 59, 0.14);
  box-shadow: 1.125rem 0 2.625rem rgba(20, 32, 19, 0.16);
  height: 100vh;
  left: 0;
  max-width: 20rem;
  padding: 0 1.125rem 1.125rem;
  position: fixed;
  top: 0;
  width: min(82vw, 20rem);
  z-index: 40;
}

.drawer-header {
  align-items: center;
  display: flex;
  min-height: 4rem;
  justify-content: space-between;
}

.drawer-close {
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
  width: 2.5rem;
}

.drawer-links {
  align-content: start;
  display: grid;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.drawer-link,
.drawer-button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 0.375rem;
  color: #142013;
  cursor: pointer;
  display: flex;
  font: inherit;
  justify-content: flex-start;
  min-height: 2.75rem;
  padding: 0 0.75rem;
  text-align: left;
  text-decoration: none;
  width: 100%;
}

.drawer-link.router-link-active {
  background: rgba(53, 94, 59, 0.1);
  color: #1f3523;
  font-weight: 700;
}

.brand-link:focus-visible,
.nav-link:focus-visible,
.nav-button:focus-visible,
.menu-button:focus-visible,
.drawer-close:focus-visible,
.drawer-link:focus-visible,
.drawer-button:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.34);
  outline-offset: 0.125rem;
}

.brand-link:hover,
.nav-link:hover,
.nav-button:hover,
.menu-button:hover,
.drawer-close:hover,
.drawer-link:hover,
.drawer-button:hover {
  background: rgba(53, 94, 59, 0.08);
}

@media (max-width: 45rem) {
  .app-navbar {
    flex-wrap: nowrap;
  }

  .desktop-links {
    display: none;
  }

  .menu-button {
    display: inline-flex;
  }
}
</style>
