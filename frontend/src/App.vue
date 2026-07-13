<script setup lang="ts">
import AppFooter from '@/components/AppFooter.vue'
import AppNavbar from '@/components/AppNavbar.vue'
import AppToasts from '@/components/AppToasts.vue'
import CookieAcknowledgementBanner from '@/components/CookieAcknowledgementBanner.vue'
</script>

<template>
  <v-app>
    <AppNavbar />
    <div class="app-content">
      <v-main class="app-main">
        <RouterView />
      </v-main>
      <AppFooter />
    </div>
    <AppToasts />
    <CookieAcknowledgementBanner />
  </v-app>
</template>

<style scoped>
.app-content {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 4rem);
}

.app-main {
  flex: 1 0 auto;
}
</style>
