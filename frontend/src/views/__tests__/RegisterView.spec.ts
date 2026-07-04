import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import { ApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import HomeView from '@/views/HomeView.vue'
import RegisterView from '@/views/RegisterView.vue'

async function mountRegisterView() {
  const pinia = createPinia()
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'home',
        component: HomeView,
      },
      {
        path: '/register',
        name: 'register',
        component: RegisterView,
      },
    ],
  })

  setActivePinia(pinia)

  router.push('/register')
  await router.isReady()

  const wrapper = mount(RegisterView, {
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

async function fillRegistrationForm(wrapper: Awaited<ReturnType<typeof mountRegisterView>>['wrapper']) {
  await wrapper.find('#register-name').setValue('New Rider')
  await wrapper.find('#register-email').setValue('new@example.com')
  await wrapper.find('#register-password').setValue('password')
  await wrapper.find('#register-password-confirmation').setValue('password')
}

describe('RegisterView', () => {
  it('validates required fields', async () => {
    const { authStore, wrapper } = await mountRegisterView()
    const registerSpy = vi.spyOn(authStore, 'register').mockResolvedValue()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Name is required.')
    expect(wrapper.text()).toContain('Email is required.')
    expect(wrapper.text()).toContain('Password is required.')
    expect(wrapper.text()).toContain('Password confirmation is required.')
    expect(registerSpy).not.toHaveBeenCalled()
  })

  it('validates email format and password confirmation', async () => {
    const { authStore, wrapper } = await mountRegisterView()
    const registerSpy = vi.spyOn(authStore, 'register').mockResolvedValue()

    await wrapper.find('#register-name').setValue('New Rider')
    await wrapper.find('#register-email').setValue('not-an-email')
    await wrapper.find('#register-password').setValue('password')
    await wrapper.find('#register-password-confirmation').setValue('different')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Enter a valid email address.')
    expect(wrapper.text()).toContain('Password confirmation must match.')
    expect(registerSpy).not.toHaveBeenCalled()
  })

  it('registers a user, shows a success toast, and redirects home', async () => {
    const { authStore, router, toastStore, wrapper } = await mountRegisterView()
    const registerSpy = vi.spyOn(authStore, 'register').mockResolvedValue()

    await fillRegistrationForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(registerSpy).toHaveBeenCalledWith(
      'New Rider',
      'new@example.com',
      'password',
      'password',
    )
    expect(toastStore.toasts[0]?.message).toBe('Welcome to BikeMap')
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('shows server registration errors without redirecting', async () => {
    const { authStore, router, wrapper } = await mountRegisterView()

    vi.spyOn(authStore, 'register').mockRejectedValue(
      new ApiError(422, 'The email has already been taken.'),
    )

    await fillRegistrationForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('The email has already been taken.')
    expect(router.currentRoute.value.name).toBe('register')
  })
})
