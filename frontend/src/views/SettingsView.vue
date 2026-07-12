<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AuthTextField from '@/components/auth/AuthTextField.vue'
import { ApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'

const authStore = useAuthStore()
const router = useRouter()
const toastStore = useToastStore()
const deleteConfirmationPhrase = 'Delete My ShowMyRides Account'

const name = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const accountDeleteConfirmation = ref('')
const nameError = ref('')
const passwordError = ref('')
const passwordConfirmationError = ref('')
const accountDeleteConfirmationError = ref('')
const profileFormError = ref('')
const passwordFormError = ref('')
const accountDeleteFormError = ref('')
const isSavingProfile = ref(false)
const isSavingPassword = ref(false)
const isDeleteModalOpen = ref(false)
const isDeletingAccount = ref(false)

const userEmail = computed(() => authStore.currentUser?.email ?? '')

onMounted(async () => {
  if (!authStore.currentUser) {
    await authStore.loadCurrentUser()
  }

  name.value = authStore.currentUser?.name ?? ''
})

async function submitProfile() {
  profileFormError.value = ''

  if (!validateName()) {
    return
  }

  isSavingProfile.value = true

  try {
    await authStore.updateName(name.value.trim())
    name.value = authStore.currentUser?.name ?? name.value.trim()
    toastStore.success('Name updated')
  } catch (error) {
    profileFormError.value = error instanceof ApiError ? error.message : 'Unable to update name.'
  } finally {
    isSavingProfile.value = false
  }
}

async function submitPassword() {
  passwordFormError.value = ''

  if (![validatePassword(), validatePasswordConfirmation()].every(Boolean)) {
    return
  }

  isSavingPassword.value = true

  try {
    await authStore.resetPassword(password.value, passwordConfirmation.value)
    password.value = ''
    passwordConfirmation.value = ''
    toastStore.success('Password updated')
  } catch (error) {
    passwordFormError.value =
      error instanceof ApiError ? error.message : 'Unable to update password.'
  } finally {
    isSavingPassword.value = false
  }
}

function openDeleteModal() {
  accountDeleteConfirmation.value = ''
  accountDeleteConfirmationError.value = ''
  accountDeleteFormError.value = ''
  isDeleteModalOpen.value = true
}

function closeDeleteModal() {
  if (isDeletingAccount.value) {
    return
  }

  isDeleteModalOpen.value = false
}

async function confirmAccountDelete() {
  accountDeleteFormError.value = ''

  if (!validateAccountDeleteConfirmation()) {
    return
  }

  isDeletingAccount.value = true

  try {
    await authStore.deleteAccount(accountDeleteConfirmation.value)
    toastStore.success('Account deleted')
    await router.push({ name: 'home' })
  } catch (error) {
    accountDeleteFormError.value =
      error instanceof ApiError ? error.message : 'Unable to delete account.'
  } finally {
    isDeletingAccount.value = false
  }
}

function validateAccountDeleteConfirmation() {
  if (accountDeleteConfirmation.value !== deleteConfirmationPhrase) {
    accountDeleteConfirmationError.value = `Enter "${deleteConfirmationPhrase}" to confirm.`
    return false
  }

  accountDeleteConfirmationError.value = ''
  return true
}

function validateName() {
  if (!name.value.trim()) {
    nameError.value = 'Name is required.'
    return false
  }

  nameError.value = ''
  return true
}

function validatePassword() {
  if (!password.value) {
    passwordError.value = 'New password is required.'
    return false
  }

  passwordError.value = ''
  return true
}

function validatePasswordConfirmation() {
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
  <main class="settings-page">
    <section class="page-header">
      <h1>Settings</h1>
    </section>

    <div class="settings-layout">
      <section class="settings-panel" aria-labelledby="profile-settings-title">
        <div class="panel-heading">
          <h2 id="profile-settings-title">Profile</h2>
          <p v-if="userEmail" class="supporting-text">{{ userEmail }}</p>
        </div>

        <p v-if="profileFormError" class="form-error" role="alert">
          {{ profileFormError }}
        </p>

        <form class="settings-form" novalidate @submit.prevent="submitProfile">
          <AuthTextField
            id="settings-name"
            v-model="name"
            autocomplete="name"
            :error="nameError"
            label="Name"
          />

          <button class="primary-action" :disabled="isSavingProfile" type="submit">
            {{ isSavingProfile ? 'Saving...' : 'Save Name' }}
          </button>
        </form>
      </section>

      <section class="settings-panel" aria-labelledby="password-settings-title">
        <div class="panel-heading">
          <h2 id="password-settings-title">Password</h2>
        </div>

        <p v-if="passwordFormError" class="form-error" role="alert">
          {{ passwordFormError }}
        </p>

        <form class="settings-form" novalidate @submit.prevent="submitPassword">
          <AuthTextField
            id="settings-password"
            v-model="password"
            autocomplete="new-password"
            :error="passwordError"
            label="New password"
            type="password"
          />

          <AuthTextField
            id="settings-password-confirmation"
            v-model="passwordConfirmation"
            autocomplete="new-password"
            :error="passwordConfirmationError"
            label="Confirm password"
            type="password"
          />

          <button class="primary-action" :disabled="isSavingPassword" type="submit">
            {{ isSavingPassword ? 'Saving...' : 'Save Password' }}
          </button>
        </form>
      </section>

      <section class="settings-panel" aria-labelledby="location-settings-title">
        <div class="panel-heading">
          <h2 id="location-settings-title">Locations</h2>
        </div>

        <RouterLink class="secondary-action" :to="{ name: 'settings-locations' }">
          Manage Locations
        </RouterLink>
      </section>

      <section class="settings-panel danger-panel" aria-labelledby="delete-account-title">
        <div class="panel-heading">
          <h2 id="delete-account-title">Delete Account</h2>
          <p class="supporting-text">
            Permanently delete your account, locations, rides, and stored ride files.
          </p>
        </div>

        <button class="danger-action" type="button" @click="openDeleteModal">Delete Account</button>
      </section>
    </div>

    <div v-if="isDeleteModalOpen" class="modal-layer" role="presentation">
      <button
        class="modal-backdrop"
        type="button"
        aria-label="Close account delete confirmation"
        @click="closeDeleteModal"
      ></button>

      <section
        class="modal-panel"
        aria-labelledby="delete-account-modal-title"
        aria-modal="true"
        role="dialog"
      >
        <div class="modal-header">
          <h2 id="delete-account-modal-title">Delete Account</h2>
          <button
            class="close-button"
            type="button"
            aria-label="Close account delete confirmation"
            @click="closeDeleteModal"
          >
            ×
          </button>
        </div>

        <p class="confirm-text">
          This permanently deletes your ShowMyRides account, locations, rides, and stored ride
          files. This cannot be undone.
        </p>

        <p v-if="accountDeleteFormError" class="form-error" role="alert">
          {{ accountDeleteFormError }}
        </p>

        <form class="settings-form" novalidate @submit.prevent="confirmAccountDelete">
          <AuthTextField
            id="settings-delete-confirmation"
            v-model="accountDeleteConfirmation"
            autocomplete="off"
            :error="accountDeleteConfirmationError"
            :label="`Type ${deleteConfirmationPhrase}`"
          />

          <div class="modal-actions">
            <button class="secondary-action" type="button" @click="closeDeleteModal">Cancel</button>
            <button class="danger-action" :disabled="isDeletingAccount" type="submit">
              {{ isDeletingAccount ? 'Deleting...' : 'Delete Account' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.settings-page {
  background: #f8f6f0;
  min-height: calc(100vh - 4rem);
  padding: 2rem clamp(1rem, 4vw, 3rem) 3rem;
}

.page-header,
.settings-layout {
  margin-left: auto;
  margin-right: auto;
  max-width: 52rem;
}

.page-header {
  margin-bottom: 1.25rem;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  color: #142013;
  font-size: 2rem;
  line-height: 1.2;
}

h2 {
  color: #142013;
  font-size: 1.25rem;
  line-height: 1.3;
}

.settings-layout {
  display: grid;
  gap: 1rem;
}

.settings-panel {
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2rem rgba(20, 32, 19, 0.08);
  display: grid;
  gap: 1.125rem;
  padding: clamp(1.25rem, 4vw, 2rem);
}

.panel-heading {
  display: grid;
  gap: 0.35rem;
}

.supporting-text {
  color: #52614f;
  line-height: 1.5;
}

.settings-form {
  display: grid;
  gap: 1.125rem;
}

.primary-action,
.secondary-action,
.danger-action {
  align-items: center;
  border-radius: 0.375rem;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-weight: 700;
  justify-content: center;
  justify-self: start;
  min-height: 2.875rem;
  padding: 0 1rem;
  text-decoration: none;
}

.primary-action {
  background: #355e3b;
  border: 0;
  color: #ffffff;
}

.primary-action:hover:not(:disabled) {
  background: #29492e;
}

.primary-action:disabled {
  cursor: wait;
  opacity: 0.72;
}

.secondary-action {
  background: #ffffff;
  border: 0.0625rem solid rgba(53, 94, 59, 0.32);
  color: #29492e;
}

.danger-panel {
  border-color: rgba(176, 44, 44, 0.28);
}

.danger-action {
  background: #ffffff;
  border: 0.0625rem solid rgba(176, 44, 44, 0.34);
  color: #7c2020;
}

.danger-action:hover:not(:disabled) {
  background: rgba(176, 44, 44, 0.08);
}

.danger-action:disabled {
  cursor: wait;
  opacity: 0.72;
}

.form-error {
  background: rgba(176, 44, 44, 0.08);
  border: 0.0625rem solid rgba(176, 44, 44, 0.22);
  border-radius: 0.375rem;
  color: #7c2020;
  line-height: 1.5;
  padding: 0.75rem;
}

.modal-layer {
  align-items: center;
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 50;
}

.modal-backdrop {
  background: rgba(20, 32, 19, 0.42);
  border: 0;
  inset: 0;
  position: fixed;
}

.modal-panel {
  background: #fffdf7;
  border: 0.0625rem solid rgba(176, 44, 44, 0.18);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2rem rgba(20, 32, 19, 0.08);
  display: grid;
  gap: 1.125rem;
  max-width: 34rem;
  padding: 1.25rem;
  position: relative;
  width: min(100%, 34rem);
}

.modal-header,
.modal-actions {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.modal-actions {
  justify-content: flex-end;
}

.close-button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 0.375rem;
  color: #142013;
  cursor: pointer;
  display: inline-flex;
  font-size: 1.75rem;
  height: 2.5rem;
  justify-content: center;
  line-height: 1;
  padding: 0;
  width: 2.5rem;
}

.confirm-text {
  color: #142013;
  line-height: 1.5;
}

.primary-action:focus-visible,
.secondary-action:focus-visible,
.danger-action:focus-visible,
.close-button:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.28);
  outline-offset: 0.125rem;
}

@media (max-width: 40rem) {
  .primary-action,
  .secondary-action,
  .danger-action {
    justify-self: stretch;
  }

  .modal-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
