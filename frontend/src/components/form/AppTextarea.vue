<script setup lang="ts">
const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    error?: string
    id: string
    label: string
    rows?: number
  }>(),
  {
    error: '',
    rows: 4,
  },
)
</script>

<template>
  <div class="field">
    <label :for="props.id">{{ props.label }}</label>
    <textarea
      :id="props.id"
      v-model="model"
      :aria-describedby="props.error ? `${props.id}-error` : undefined"
      :aria-invalid="props.error ? 'true' : 'false'"
      :rows="props.rows"
    ></textarea>
    <p v-if="props.error" :id="`${props.id}-error`" class="field-error">
      {{ props.error }}
    </p>
  </div>
</template>

<style scoped>
.field {
  display: grid;
  gap: 0.5rem;
}

label {
  color: #142013;
  font-size: 0.95rem;
  font-weight: 700;
}

textarea {
  background: #ffffff;
  border: 0.0625rem solid rgba(53, 94, 59, 0.22);
  border-radius: 0.375rem;
  color: #142013;
  font: inherit;
  min-height: 7.5rem;
  padding: 0.75rem;
  resize: vertical;
  width: 100%;
}

textarea:focus {
  border-color: #355e3b;
  outline: 0.1875rem solid rgba(53, 94, 59, 0.18);
}

textarea[aria-invalid='true'] {
  border-color: #b02c2c;
}

.field-error {
  color: #7c2020;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
}
</style>
