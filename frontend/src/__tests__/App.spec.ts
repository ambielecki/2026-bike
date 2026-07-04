import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import HomeView from '../views/HomeView.vue'

const slotStub = {
  template: '<div><slot /></div>',
}

describe('App', () => {
  it('mounts renders properly', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        {
          path: '/',
          name: 'home',
          component: HomeView,
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
    expect(wrapper.text()).toContain('Check API')
  })
})
