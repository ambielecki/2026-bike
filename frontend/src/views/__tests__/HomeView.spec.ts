import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getHomepage } from '@/services/homepage'
import HomeView from '@/views/HomeView.vue'

vi.mock('@/services/homepage', () => ({
  defaultHomepageContent: {
    id: 0,
    highlights: [],
    carousel_images: [],
  },
  getHomepage: vi.fn(),
  homepageHeroImageUrl: vi.fn(() => '/api/homepage/hero-image'),
}))

const mockedGetHomepage = vi.mocked(getHomepage)

const slotStub = {
  template: '<div><slot /></div>',
}

function mountHomeView() {
  return mount(HomeView, {
    global: {
      stubs: {
        'v-container': slotStub,
        'v-row': slotStub,
        'v-col': slotStub,
        'v-card': slotStub,
      },
    },
  })
}

describe('HomeView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedGetHomepage.mockResolvedValue({
      id: 1,
      highlights: [],
      carousel_images: [],
    })
  })

  it('renders hardcoded hero copy before homepage content loads', () => {
    mockedGetHomepage.mockReturnValue(new Promise(() => {}))

    const wrapper = mountHomeView()

    expect(wrapper.text()).toContain('ShowMyRides')
    expect(wrapper.text()).toContain('Track every route and see where you have been')
    expect(wrapper.text()).toContain(
      'Keep a clean record of the trails you ride, remember the lines you liked',
    )
    expect(wrapper.find('#highlights').exists()).toBe(false)
  })

  it('renders highlights after homepage content loads', async () => {
    mockedGetHomepage.mockResolvedValue({
      id: 1,
      highlights: [
        {
          title: 'Plan',
          copy: 'Pick the right route.',
          sort_order: 0,
        },
      ],
      carousel_images: [],
    })

    const wrapper = mountHomeView()
    await flushPromises()
    await nextTick()

    expect(wrapper.find('#highlights').exists()).toBe(true)
    expect(wrapper.text()).toContain('Plan')
    expect(wrapper.text()).toContain('Pick the right route.')
  })

  it('reserves a blank carousel area when no images exist', async () => {
    const wrapper = mountHomeView()
    await flushPromises()
    await nextTick()

    expect(wrapper.find('.carousel-empty').exists()).toBe(true)
    expect(wrapper.find('.carousel-image').exists()).toBe(false)
    expect(wrapper.text()).toContain('No homepage images selected.')
  })

  it('prioritizes the first carousel image when content includes images', async () => {
    mockedGetHomepage.mockResolvedValue({
      id: 1,
      highlights: [],
      carousel_images: [
        {
          id: 10,
          description: 'Trail overlook',
          alt_text: 'Mountain trail overlook',
          urls: {
            small: '/storage/homepage/images/small/trail.jpg',
            medium: '/storage/homepage/images/medium/trail.jpg',
            large: '/storage/homepage/images/large/trail.jpg',
            original: '/storage/homepage/images/original/trail.jpg',
          },
        },
      ],
    })

    const wrapper = mountHomeView()
    await flushPromises()
    await nextTick()

    const image = wrapper.get('.carousel-image')

    expect(image.attributes('src')).toBe('/api/homepage/hero-image')
    expect(image.attributes('alt')).toBe('Mountain trail overlook')
    expect(image.attributes('loading')).toBeUndefined()
    expect(image.attributes('fetchpriority')).toBe('high')
  })
})
