import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { api } from '@/services/api'

export interface AuthUser {
  id: number
  name: string
  email: string
  is_admin: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<AuthUser | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => currentUser.value !== null)
  const isAdmin = computed(() => currentUser.value?.is_admin === true)

  async function login(email: string, password: string, remember = false) {
    await api.post<void>('/login', {
      email,
      password,
      remember,
    })

    await loadCurrentUser()
  }

  async function register(
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string,
  ) {
    await api.post<void>('/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    })

    await loadCurrentUser()
  }

  async function loadCurrentUser() {
    if (isLoading.value) {
      return
    }

    isLoading.value = true

    try {
      const response = await fetch(`${apiBaseUrl()}/api/user`, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      })

      if (response.status === 401 || response.status === 403) {
        currentUser.value = null
        return
      }

      if (!response.ok) {
        throw new Error(response.statusText)
      }

      const user = (await response.json()) as AuthUser

      currentUser.value = {
        ...user,
        is_admin: Boolean(user.is_admin),
      }
    } catch {
      currentUser.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    await api.post<void>('/logout', null)
    currentUser.value = null
  }

  function clearCurrentUser() {
    currentUser.value = null
  }

  return {
    clearCurrentUser,
    currentUser,
    isAdmin,
    isAuthenticated,
    isLoading,
    login,
    loadCurrentUser,
    logout,
    register,
  }
})

function apiBaseUrl() {
  return import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
}
