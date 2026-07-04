<script setup lang="ts">
import AppToasts from '@/components/AppToasts.vue'
</script>

<template>
  <v-app>
    <v-main>
      <RouterView />
    </v-main>
    <AppToasts />
  </v-app>
</template>
