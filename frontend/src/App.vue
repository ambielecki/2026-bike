<script setup lang="ts">
import AppNavbar from '@/components/AppNavbar.vue'
import AppToasts from '@/components/AppToasts.vue'
import CookieAcknowledgementBanner from '@/components/CookieAcknowledgementBanner.vue'
</script>

<template>
  <v-app>
    <AppNavbar />
    <v-main>
      <RouterView />
    </v-main>
    <AppToasts />
    <CookieAcknowledgementBanner />
  </v-app>
</template>
