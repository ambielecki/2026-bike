<script setup lang="ts">
const model = defineModel<boolean>({ required: true })

const props = defineProps<{
  id: string
  label: string
}>()
</script>

<template>
  <label class="checkbox-field" :for="props.id">
    <input :id="props.id" v-model="model" type="checkbox" />
    <span>{{ props.label }}</span>
  </label>
</template>

<style scoped>
.checkbox-field {
  align-items: center;
  color: #142013;
  cursor: pointer;
  display: inline-flex;
  gap: 0.625rem;
  line-height: 1.4;
}

input {
  accent-color: #355e3b;
  height: 1.125rem;
  width: 1.125rem;
}

input:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.28);
  outline-offset: 0.125rem;
}
</style>
