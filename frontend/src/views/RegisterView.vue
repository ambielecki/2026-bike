<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AuthFormPanel from '@/components/auth/AuthFormPanel.vue'
import AuthTextField from '@/components/auth/AuthTextField.vue'
import { ApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const nameError = ref('')
const emailError = ref('')
const passwordError = ref('')
const passwordConfirmationError = ref('')
const formError = ref('')
const isSubmitting = ref(false)

async function submitRegistration() {
  formError.value = ''

  const formIsValid = [validateName(), validateEmail(), validatePassword(), validateConfirmation()].every(
    Boolean,
  )

  if (!formIsValid) {
    return
  }

  isSubmitting.value = true

  try {
    await authStore.register(
      name.value.trim(),
      email.value.trim(),
      password.value,
      passwordConfirmation.value,
    )
    toastStore.success('Welcome to ShowMyRides')
    await router.push({ name: 'home' })
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'Unable to register.'
  } finally {
    isSubmitting.value = false
  }
}

function validateName() {
  if (!name.value.trim()) {
    nameError.value = 'Name is required.'
    return false
  }

  nameError.value = ''
  return true
}

function validateEmail() {
  const value = email.value.trim()

  if (!value) {
    emailError.value = 'Email is required.'
    return false
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    emailError.value = 'Enter a valid email address.'
    return false
  }

  emailError.value = ''
  return true
}

function validatePassword() {
  if (!password.value) {
    passwordError.value = 'Password is required.'
    return false
  }

  passwordError.value = ''
  return true
}

function validateConfirmation() {
  if (!passwordConfirmation.value) {
    passwordConfirmationError.value = 'Password confirmation is required.'
    return false
  }

  if (passwordConfirmation.value !== password.value) {
    passwordConfirmationError.value = 'Password confirmation must match.'
    return false
  }

  passwordConfirmationError.value = ''
  return true
}
</script>

<template>
  <AuthFormPanel
    :error="formError"
    subtitle="Create your ShowMyRides account."
    title="Register"
  >
    <form class="register-form" novalidate @submit.prevent="submitRegistration">
      <AuthTextField
        id="register-name"
        v-model="name"
        autocomplete="name"
        :error="nameError"
        label="Name"
      />

      <AuthTextField
        id="register-email"
        v-model="email"
        autocomplete="email"
        :error="emailError"
        label="Email address"
        type="email"
      />

      <AuthTextField
        id="register-password"
        v-model="password"
        autocomplete="new-password"
        :error="passwordError"
        label="Password"
        type="password"
      />

      <AuthTextField
        id="register-password-confirmation"
        v-model="passwordConfirmation"
        autocomplete="new-password"
        :error="passwordConfirmationError"
        label="Confirm password"
        type="password"
      />

      <button class="primary-action" :disabled="isSubmitting" type="submit">
        {{ isSubmitting ? 'Creating account...' : 'Create Account' }}
      </button>
    </form>
  </AuthFormPanel>
</template>

<style scoped>
.register-form {
  display: grid;
  gap: 1.125rem;
}

.primary-action {
  background: #355e3b;
  border: 0;
  border-radius: 0.375rem;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  min-height: 2.875rem;
  padding: 0 1rem;
}

.primary-action:disabled {
  cursor: wait;
  opacity: 0.72;
}

.primary-action:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.28);
  outline-offset: 0.125rem;
}

.primary-action:hover:not(:disabled) {
  background: #29492e;
}
</style>
