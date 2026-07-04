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
  align-items: center;
  background: #f8f6f0;
  display: flex;
  min-height: calc(100vh - 64px);
  padding: 48px 16px;
}

.auth-panel {
  background: #fffdf7;
  border: 1px solid rgba(53, 94, 59, 0.14);
  border-radius: 8px;
  box-shadow: 0 18px 44px rgba(20, 32, 19, 0.09);
  margin: 0 auto;
  max-width: 440px;
  padding: 32px;
  width: 100%;
}

.auth-heading {
  margin-bottom: 24px;
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
  margin: 10px 0 0;
}

.form-error {
  background: rgba(176, 44, 44, 0.09);
  border: 1px solid rgba(176, 44, 44, 0.26);
  border-radius: 6px;
  color: #7c2020;
  line-height: 1.5;
  margin-bottom: 18px;
  padding: 12px 14px;
}
</style>
