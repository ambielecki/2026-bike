import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import AppNavbar from '@/components/AppNavbar.vue'
import { useAuthStore } from '@/stores/auth'
import PlaceholderView from '@/views/PlaceholderView.vue'

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'home',
        component: PlaceholderView,
      },
      {
        path: '/rides',
        name: 'rides',
        component: PlaceholderView,
      },
      {
        path: '/rides/add',
        name: 'add-ride',
        component: PlaceholderView,
      },
      {
        path: '/admin',
        name: 'admin-tools',
        component: PlaceholderView,
      },
      {
        path: '/settings',
        name: 'settings',
        component: PlaceholderView,
      },
      {
        path: '/register',
        name: 'register',
        component: PlaceholderView,
      },
      {
        path: '/login',
        name: 'login',
        component: PlaceholderView,
      },
    ],
  })
}

async function mountNavbar() {
  const pinia = createPinia()
  const router = createTestRouter()

  setActivePinia(pinia)
  vi.spyOn(useAuthStore(), 'loadCurrentUser').mockResolvedValue()

  router.push('/')
  await router.isReady()

  return mount(AppNavbar, {
    global: {
      plugins: [pinia, router],
    },
  })
}

describe('AppNavbar', () => {
  it('shows guest account links when logged out', async () => {
    const wrapper = await mountNavbar()

    expect(wrapper.text()).toContain('BikeMap')
    expect(wrapper.text()).toContain('Register')
    expect(wrapper.text()).toContain('Log In')
    expect(wrapper.text()).not.toContain('Rides')
    expect(wrapper.text()).not.toContain('Admin Tools')
  })

  it('shows ride and account links for logged in users', async () => {
    const wrapper = await mountNavbar()
    const authStore = useAuthStore()

    authStore.currentUser = {
      id: 1,
      name: 'Rider',
      email: 'rider@example.com',
      is_admin: false,
    }
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Rides')
    expect(wrapper.text()).toContain('Add Ride')
    expect(wrapper.text()).toContain('Settings')
    expect(wrapper.text()).toContain('Log Out')
    expect(wrapper.text()).not.toContain('Admin Tools')
    expect(wrapper.text()).not.toContain('Register')
  })

  it('shows admin tools for admin users', async () => {
    const wrapper = await mountNavbar()
    const authStore = useAuthStore()

    authStore.currentUser = {
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      is_admin: true,
    }
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Admin Tools')
  })
})
