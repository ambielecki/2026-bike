import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import CookieAcknowledgementBanner from '../CookieAcknowledgementBanner.vue'

const storageKey = 'showMyRidesCookieAcknowledgedUntil'
const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000

describe('CookieAcknowledgementBanner', () => {
  beforeEach(() => {
    const storage = new Map<string, string>()

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: vi.fn(() => storage.clear()),
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        removeItem: vi.fn((key: string) => storage.delete(key)),
        setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows when cookies have not been acknowledged', async () => {
    window.localStorage.clear()

    const wrapper = mount(CookieAcknowledgementBanner)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('ShowMyRides uses required cookies')
    expect(wrapper.get('button').text()).toBe('Got it')
  })

  it('stores a thirty day acknowledgement and hides when acknowledged', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-12T12:00:00Z'))
    window.localStorage.clear()

    const wrapper = mount(CookieAcknowledgementBanner)
    await wrapper.vm.$nextTick()

    await wrapper.get('button').trigger('click')

    expect(wrapper.find('[aria-label="Cookie acknowledgement"]').exists()).toBe(false)
    expect(window.localStorage.getItem(storageKey)).toBe((Date.now() + thirtyDaysInMs).toString())
  })

  it('stays hidden while a stored acknowledgement has not expired', async () => {
    window.localStorage.setItem(storageKey, (Date.now() + 1_000).toString())

    const wrapper = mount(CookieAcknowledgementBanner)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[aria-label="Cookie acknowledgement"]').exists()).toBe(false)
  })

  it('shows again when a stored acknowledgement has expired', async () => {
    window.localStorage.setItem(storageKey, (Date.now() - 1_000).toString())

    const wrapper = mount(CookieAcknowledgementBanner)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('ShowMyRides uses required cookies')
  })
})
