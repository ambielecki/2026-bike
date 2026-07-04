<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import AuthCheckbox from '@/components/auth/AuthCheckbox.vue'
import AuthFormPanel from '@/components/auth/AuthFormPanel.vue'
import AuthTextField from '@/components/auth/AuthTextField.vue'
import { ApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const emailError = ref('')
const passwordError = ref('')
const formError = ref('')
const isSubmitting = ref(false)
const step = ref<'email' | 'password'>('email')

const panelTitle = computed(() => (step.value === 'email' ? 'Log In' : 'Enter Password'))
const panelSubtitle = computed(() =>
  step.value === 'email'
    ? 'Use the email address for your BikeMap account.'
    : 'Enter your password to finish logging in.',
)

function continueToPassword() {
  formError.value = ''

  if (!validateEmail()) {
    return
  }

  step.value = 'password'
}

function editEmail() {
  password.value = ''
  passwordError.value = ''
  formError.value = ''
  step.value = 'email'
}

async function submitLogin() {
  formError.value = ''

  const emailIsValid = validateEmail()
  const passwordIsValid = validatePassword()

  if (!emailIsValid) {
    step.value = 'email'
    return
  }

  if (!passwordIsValid) {
    return
  }

  isSubmitting.value = true

  try {
    await authStore.login(email.value.trim(), password.value, rememberMe.value)
    toastStore.success('Welcome Back to BikeMap')
    await router.push({ name: 'rides' })
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'Unable to log in.'
  } finally {
    isSubmitting.value = false
  }
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
</script>

<template>
  <AuthFormPanel :error="formError" :subtitle="panelSubtitle" :title="panelTitle">
    <form v-if="step === 'email'" class="login-form" novalidate @submit.prevent="continueToPassword">
      <AuthTextField
        id="login-email"
        v-model="email"
        autocomplete="email"
        :error="emailError"
        label="Email address"
        type="email"
      />

      <button class="primary-action" type="submit">Continue</button>
    </form>

    <form v-else class="login-form" novalidate @submit.prevent="submitLogin">
      <AuthTextField
        id="login-email-confirm"
        v-model="email"
        autocomplete="email"
        label="Email address"
        readonly
        type="email"
      />

      <button class="link-action" type="button" @click="editEmail">Use a different email</button>

      <AuthTextField
        id="login-password"
        v-model="password"
        autocomplete="current-password"
        :error="passwordError"
        label="Password"
        type="password"
      />

      <AuthCheckbox id="login-remember" v-model="rememberMe" label="Remember Me" />

      <button class="primary-action" :disabled="isSubmitting" type="submit">
        {{ isSubmitting ? 'Logging in...' : 'Log In' }}
      </button>
    </form>
  </AuthFormPanel>
</template>

<style scoped>
.login-form {
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

.primary-action:focus-visible,
.link-action:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.28);
  outline-offset: 0.125rem;
}

.primary-action:hover:not(:disabled) {
  background: #29492e;
}

.link-action {
  background: transparent;
  border: 0;
  color: #355e3b;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  justify-self: start;
  padding: 0;
}
</style>
