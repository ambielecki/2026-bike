import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import { ApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'
import LocationSettingsView from '@/views/LocationSettingsView.vue'
import SettingsView from '@/views/SettingsView.vue'

async function mountSettingsView() {
  const pinia = createPinia()
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/settings',
        name: 'settings',
        component: SettingsView,
      },
      {
        path: '/settings/locations',
        name: 'settings-locations',
        component: LocationSettingsView,
      },
    ],
  })

  setActivePinia(pinia)

  const authStore = useAuthStore()
  authStore.currentUser = {
    id: 1,
    name: 'Rider',
    email: 'rider@example.com',
    is_admin: false,
  }
  vi.spyOn(authStore, 'loadCurrentUser').mockResolvedValue()

  router.push('/settings')
  await router.isReady()

  const wrapper = mount(SettingsView, {
    global: {
      plugins: [pinia, router],
    },
  })

  await flushPromises()

  return {
    authStore,
    router,
    toastStore: useToastStore(),
    wrapper,
  }
}

describe('SettingsView', () => {
  it('renders profile, password, and location settings', async () => {
    const { wrapper } = await mountSettingsView()

    expect(wrapper.text()).toContain('Settings')
    expect(wrapper.text()).toContain('Profile')
    expect(wrapper.find('#settings-name').element).toHaveProperty('value', 'Rider')
    expect(wrapper.text()).toContain('rider@example.com')
    expect(wrapper.text()).toContain('Password')
    expect(wrapper.get('a[href="/settings/locations"]').text()).toBe('Manage Locations')
  })

  it('validates profile name before saving', async () => {
    const { authStore, wrapper } = await mountSettingsView()
    const updateNameSpy = vi.spyOn(authStore, 'updateName').mockResolvedValue()

    await wrapper.find('#settings-name').setValue('   ')
    await wrapper.findAll('form')[0]?.trigger('submit')

    expect(updateNameSpy).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Name is required.')
  })

  it('updates the profile name and shows a toast', async () => {
    const { authStore, toastStore, wrapper } = await mountSettingsView()
    const updateNameSpy = vi.spyOn(authStore, 'updateName').mockImplementation(async (name) => {
      authStore.currentUser = {
        id: 1,
        name,
        email: 'rider@example.com',
        is_admin: false,
      }
    })

    await wrapper.find('#settings-name').setValue('Updated Rider')
    await wrapper.findAll('form')[0]?.trigger('submit')
    await flushPromises()

    expect(updateNameSpy).toHaveBeenCalledWith('Updated Rider')
    expect(toastStore.toasts[0]?.message).toBe('Name updated')
  })

  it('renders profile update errors', async () => {
    const { authStore, wrapper } = await mountSettingsView()
    vi.spyOn(authStore, 'updateName').mockRejectedValue(
      new ApiError(422, 'The name field is required.'),
    )

    await wrapper.find('#settings-name').setValue('Updated Rider')
    await wrapper.findAll('form')[0]?.trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('The name field is required.')
  })

  it('validates password confirmation before saving', async () => {
    const { authStore, wrapper } = await mountSettingsView()
    const resetPasswordSpy = vi.spyOn(authStore, 'resetPassword').mockResolvedValue()

    await wrapper.find('#settings-password').setValue('new-password')
    await wrapper.find('#settings-password-confirmation').setValue('different-password')
    await wrapper.findAll('form')[1]?.trigger('submit')

    expect(resetPasswordSpy).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Password confirmation must match.')
  })

  it('resets the password and clears the password fields', async () => {
    const { authStore, toastStore, wrapper } = await mountSettingsView()
    const resetPasswordSpy = vi.spyOn(authStore, 'resetPassword').mockResolvedValue()

    await wrapper.find('#settings-password').setValue('new-password')
    await wrapper.find('#settings-password-confirmation').setValue('new-password')
    await wrapper.findAll('form')[1]?.trigger('submit')
    await flushPromises()

    expect(resetPasswordSpy).toHaveBeenCalledWith('new-password', 'new-password')
    expect(wrapper.find('#settings-password').element).toHaveProperty('value', '')
    expect(wrapper.find('#settings-password-confirmation').element).toHaveProperty('value', '')
    expect(toastStore.toasts[0]?.message).toBe('Password updated')
  })

  it('renders password update errors', async () => {
    const { authStore, wrapper } = await mountSettingsView()
    vi.spyOn(authStore, 'resetPassword').mockRejectedValue(
      new ApiError(422, 'The password field confirmation does not match.'),
    )

    await wrapper.find('#settings-password').setValue('new-password')
    await wrapper.find('#settings-password-confirmation').setValue('new-password')
    await wrapper.findAll('form')[1]?.trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('The password field confirmation does not match.')
  })
})
