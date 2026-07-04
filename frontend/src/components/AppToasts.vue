<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useToastStore } from '@/stores/toasts'

const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)

function toastClass(variant: string) {
  return `toast-${variant}`
}
</script>

<template>
  <div class="toast-region" aria-live="polite" aria-relevant="additions text">
    <TransitionGroup name="toast-list" tag="div" class="toast-list">
      <v-card
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast-card', toastClass(toast.variant)]"
        elevation="12"
        rounded="lg"
      >
        <div class="toast-content">
          <div class="toast-text">
            <div class="toast-title">{{ toast.title }}</div>
            <p class="toast-message">{{ toast.message }}</p>
          </div>
          <v-btn
            class="toast-dismiss"
            size="small"
            variant="text"
            @click="toastStore.removeToast(toast.id)"
          >
            Dismiss
          </v-btn>
        </div>
      </v-card>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-region {
  bottom: 1.25rem;
  pointer-events: none;
  position: fixed;
  right: 1.25rem;
  width: min(22.5rem, calc(100vw - 2rem));
  z-index: 2000;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.toast-card {
  border-left: 0.375rem solid transparent;
  pointer-events: auto;
}

.toast-content {
  align-items: flex-start;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  padding: 1rem;
}

.toast-text {
  min-width: 0;
}

.toast-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.toast-message {
  line-height: 1.5;
  margin: 0;
}

.toast-dismiss {
  flex: 0 0 auto;
  min-width: 0;
}

.toast-success {
  background: #edf8ef;
  border-left-color: #2e7d32;
  color: #16351a;
}

.toast-warning {
  background: #fff7df;
  border-left-color: #d4a514;
  color: #5f4700;
}

.toast-error {
  background: #fdecec;
  border-left-color: #c62828;
  color: #5a1616;
}

.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.22s ease;
}

.toast-list-enter-from,
.toast-list-leave-to {
  opacity: 0;
  transform: translateY(0.625rem);
}

.toast-list-move {
  transition: transform 0.22s ease;
}

@media (max-width: 37.5rem) {
  .toast-region {
    bottom: 1rem;
    right: 1rem;
  }
}
</style>
