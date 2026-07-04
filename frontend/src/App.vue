<script setup lang="ts">
import AppNavbar from '@/components/AppNavbar.vue'
import AppToasts from '@/components/AppToasts.vue'
</script>

<template>
  <v-app>
    <AppNavbar />
    <v-main>
      <RouterView />
    </v-main>
    <AppToasts />
  </v-app>
</template>
