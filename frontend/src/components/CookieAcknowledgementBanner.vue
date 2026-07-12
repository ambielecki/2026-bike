<script setup lang="ts">
import { onMounted, ref } from 'vue'

const ACKNOWLEDGEMENT_STORAGE_KEY = 'showMyRidesCookieAcknowledgedUntil'
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000

const isVisible = ref(false)

function getStoredExpiry() {
  let storedExpiry: string | null = null

  try {
    storedExpiry = window.localStorage.getItem(ACKNOWLEDGEMENT_STORAGE_KEY)
  } catch {
    return null
  }

  if (!storedExpiry) {
    return null
  }

  const expiry = Number.parseInt(storedExpiry, 10)

  return Number.isNaN(expiry) ? null : expiry
}

onMounted(() => {
  const expiry = getStoredExpiry()

  isVisible.value = !expiry || expiry <= Date.now()
})

function acknowledgeCookies() {
  const expiry = Date.now() + THIRTY_DAYS_IN_MS

  try {
    window.localStorage.setItem(ACKNOWLEDGEMENT_STORAGE_KEY, expiry.toString())
  } catch {
    // The current acknowledgement should still hide the banner for this page view.
  }

  isVisible.value = false
}
</script>

<template>
  <section
    v-if="isVisible"
    class="cookie-banner"
    aria-label="Cookie acknowledgement"
  >
    <p class="cookie-banner-text">
      ShowMyRides uses required cookies to keep you signed in and protect your session.
    </p>
    <button class="cookie-banner-button" type="button" @click="acknowledgeCookies">
      Got it
    </button>
  </section>
</template>

<style scoped>
.cookie-banner {
  align-items: center;
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.2);
  border-radius: 0.5rem;
  bottom: 1rem;
  box-shadow: 0 1rem 2.5rem rgba(20, 32, 19, 0.16);
  color: #142013;
  display: flex;
  gap: 1rem;
  left: 50%;
  max-width: min(44rem, calc(100vw - 2rem));
  padding: 1rem;
  position: fixed;
  transform: translateX(-50%);
  width: max-content;
  z-index: 1900;
}

.cookie-banner-text {
  line-height: 1.5;
  margin: 0;
}

.cookie-banner-button {
  background: #355e3b;
  border: 0;
  border-radius: 0.375rem;
  color: #ffffff;
  cursor: pointer;
  flex: 0 0 auto;
  font: inherit;
  font-weight: 700;
  min-height: 2.5rem;
  padding: 0 1rem;
}

.cookie-banner-button:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.34);
  outline-offset: 0.125rem;
}

.cookie-banner-button:hover {
  background: #294c2f;
}

@media (max-width: 37.5rem) {
  .cookie-banner {
    align-items: stretch;
    flex-direction: column;
    width: calc(100vw - 2rem);
  }
}
</style>
