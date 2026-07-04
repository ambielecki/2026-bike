import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import { ApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import LoginView from '@/views/LoginView.vue'
import PlaceholderView from '@/views/PlaceholderView.vue'

async function mountLoginView() {
  const pinia = createPinia()
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/login',
        name: 'login',
        component: LoginView,
      },
      {
        path: '/rides',
        name: 'rides',
        component: PlaceholderView,
      },
    ],
  })

  setActivePinia(pinia)

  router.push('/login')
  await router.isReady()

  const wrapper = mount(LoginView, {
    global: {
      plugins: [pinia, router],
    },
  })

  return {
    authStore: useAuthStore(),
    router,
    toastStore: useToastStore(),
    wrapper,
  }
}

describe('LoginView', () => {
  it('does not advance when email is blank', async () => {
    const { wrapper } = await mountLoginView()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Email is required.')
    expect(wrapper.find('#login-password').exists()).toBe(false)
  })

  it('does not advance when email is malformed', async () => {
    const { wrapper } = await mountLoginView()

    await wrapper.find('#login-email').setValue('not-an-email')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Enter a valid email address.')
    expect(wrapper.find('#login-password').exists()).toBe(false)
  })

  it('advances to the password form when email is valid', async () => {
    const { wrapper } = await mountLoginView()

    await wrapper.find('#login-email').setValue('rider@example.com')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Enter Password')
    expect(wrapper.find('#login-password').exists()).toBe(true)
    expect(wrapper.find('#login-remember').exists()).toBe(true)
  })

  it('does not submit when password is blank', async () => {
    const { authStore, wrapper } = await mountLoginView()
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue()

    await wrapper.find('#login-email').setValue('rider@example.com')
    await wrapper.find('form').trigger('submit')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Password is required.')
    expect(loginSpy).not.toHaveBeenCalled()
  })

  it('submits login and redirects to rides', async () => {
    const { authStore, router, toastStore, wrapper } = await mountLoginView()
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue()

    await wrapper.find('#login-email').setValue('rider@example.com')
    await wrapper.find('form').trigger('submit')
    await wrapper.find('#login-password').setValue('password')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(loginSpy).toHaveBeenCalledWith('rider@example.com', 'password', false)
    expect(toastStore.toasts[0]?.message).toBe('Welcome Back to BikeMap')
    expect(router.currentRoute.value.name).toBe('rides')
  })

  it('submits remember me when checked', async () => {
    const { authStore, wrapper } = await mountLoginView()
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue()

    await wrapper.find('#login-email').setValue('rider@example.com')
    await wrapper.find('form').trigger('submit')
    await wrapper.find('#login-password').setValue('password')
    await wrapper.find('#login-remember').setValue(true)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(loginSpy).toHaveBeenCalledWith('rider@example.com', 'password', true)
  })

  it('keeps the user on the password step and shows login errors', async () => {
    const { authStore, wrapper } = await mountLoginView()

    vi.spyOn(authStore, 'login').mockRejectedValue(
      new ApiError(422, 'These credentials do not match our records.'),
    )

    await wrapper.find('#login-email').setValue('rider@example.com')
    await wrapper.find('form').trigger('submit')
    await wrapper.find('#login-password').setValue('wrong-password')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('#login-password').exists()).toBe(true)
    expect(wrapper.text()).toContain('These credentials do not match our records.')
  })
})
