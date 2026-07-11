import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import HomeView from '../views/HomeView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'

const slotStub = {
  template: '<div><slot /></div>',
}

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Unauthenticated.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
  })

  it('mounts renders properly', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/',
          name: 'home',
          component: HomeView,
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

    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          'v-app': slotStub,
          'v-main': slotStub,
          'v-container': slotStub,
          'v-row': slotStub,
          'v-col': slotStub,
          'v-btn': slotStub,
          'v-card': slotStub,
          'v-divider': slotStub,
          'v-sheet': slotStub,
        },
      },
    })

    expect(wrapper.text()).toContain('Track every mountain bike route worth riding twice.')
    expect(wrapper.text()).toContain('BikeMap')
    expect(wrapper.text()).toContain('Register')
    expect(wrapper.text()).toContain('Log In')
    expect(wrapper.text()).toContain('Save routes that matter')
  })
})
