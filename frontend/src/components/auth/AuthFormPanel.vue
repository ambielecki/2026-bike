<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  error?: string
}>()
</script>

<template>
  <section class="auth-page">
    <div class="auth-panel">
      <div class="auth-heading">
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>

      <div v-if="error" class="form-error" role="alert">
        {{ error }}
      </div>

      <slot />
    </div>
  </section>
</template>

<style scoped>
.auth-page {
  background: #f8f6f0;
  min-height: calc(100vh - 4rem);
  padding: 3rem 1rem;
}

.auth-panel {
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  box-shadow: 0 1.125rem 2.75rem rgba(20, 32, 19, 0.09);
  margin: 0 auto;
  max-width: 27.5rem;
  padding: 2rem;
  width: 100%;
}

.auth-heading {
  margin-bottom: 1.5rem;
}

h1 {
  color: #142013;
  font-size: 2rem;
  line-height: 1.2;
  margin: 0;
}

p {
  color: rgba(20, 32, 19, 0.72);
  line-height: 1.6;
  margin: 0.625rem 0 0;
}

.form-error {
  background: rgba(176, 44, 44, 0.09);
  border: 0.0625rem solid rgba(176, 44, 44, 0.26);
  border-radius: 0.375rem;
  color: #7c2020;
  line-height: 1.5;
  margin-bottom: 1.125rem;
  padding: 0.75rem 0.875rem;
}
</style>
