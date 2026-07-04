<script setup lang="ts">
const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    autocomplete?: string
    error?: string
    id: string
    label: string
    readonly?: boolean
    type?: string
  }>(),
  {
    autocomplete: undefined,
    error: '',
    readonly: false,
    type: 'text',
  },
)
</script>

<template>
  <div class="field">
    <label :for="props.id">{{ props.label }}</label>
    <input
      :id="props.id"
      v-model="model"
      :aria-describedby="props.error ? `${props.id}-error` : undefined"
      :aria-invalid="props.error ? 'true' : 'false'"
      :autocomplete="props.autocomplete"
      :readonly="props.readonly"
      :type="props.type"
    />
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

input {
  background: #ffffff;
  border: 0.0625rem solid rgba(53, 94, 59, 0.22);
  border-radius: 0.375rem;
  color: #142013;
  font: inherit;
  min-height: 2.875rem;
  padding: 0 0.75rem;
  width: 100%;
}

input:focus {
  border-color: #355e3b;
  outline: 0.1875rem solid rgba(53, 94, 59, 0.18);
}

input[aria-invalid='true'] {
  border-color: #b02c2c;
}

input[readonly] {
  background: rgba(53, 94, 59, 0.06);
}

.field-error {
  color: #7c2020;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
}
</style>
