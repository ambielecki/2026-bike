<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <main class="placeholder-page">
    <v-container>
      <h1>{{ title }}</h1>
    </v-container>
  </main>
</template>

<style scoped>
.placeholder-page {
  background: #f8f6f0;
  min-height: calc(100vh - 4rem);
  padding: 4rem 0;
}

h1 {
  color: #142013;
  font-size: 2rem;
  line-height: 1.2;
  margin: 0;
}
</style>
