import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import { getLocations, getRides } from '@/services/rides'
import PlaceholderView from '@/views/PlaceholderView.vue'
import RideListView from '@/views/RideListView.vue'

vi.mock('@/services/rides', () => ({
  getLocations: vi.fn(),
  getRides: vi.fn(),
}))

const mockedGetLocations = vi.mocked(getLocations)
const mockedGetRides = vi.mocked(getRides)

async function mountRideListView() {
  const pinia = createPinia()
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/rides',
        name: 'rides',
        component: RideListView,
      },
      {
        path: '/rides/:id',
        name: 'ride-details',
        component: PlaceholderView,
        props: {
          title: 'Ride Details',
        },
      },
      {
        path: '/rides/add',
        name: 'add-ride',
        component: PlaceholderView,
        props: {
          title: 'Add Ride',
        },
      },
    ],
  })

  setActivePinia(pinia)

  router.push('/rides')
  await router.isReady()

  const wrapper = mount(RideListView, {
    global: {
      plugins: [pinia, router],
    },
  })

  await flushPromises()

  return {
    router,
    wrapper,
  }
}

function ridesResponse(overrides = {}) {
  return {
    data: [
      {
        id: 10,
        name: 'Morning Ride',
        datetime: '2026-07-04T12:30:00.000000Z',
        distance: '12.34',
        total_time: '3723.00',
        location: {
          id: 1,
          name: 'North Park',
          system_key: null,
          map_provider: 'openstreetmap' as const,
        },
        thumbnail_url: 'http://example.test/storage/rides/10/images/small/photo.jpg',
      },
    ],
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: 10,
      to: 1,
      total: 1,
    },
    ...overrides,
  }
}

describe('RideListView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedGetLocations.mockResolvedValue([
      {
        id: 1,
        name: 'North Park',
        user_id: 1,
        system_key: null,
        map_provider: 'openstreetmap' as const,
        latitude: '40.000000',
        longitude: '-79.000000',
      },
    ])
    mockedGetRides.mockResolvedValue(ridesResponse())
  })

  it('loads and renders rides on mount', async () => {
    const { wrapper } = await mountRideListView()

    expect(mockedGetLocations).toHaveBeenCalledOnce()
    expect(mockedGetRides).toHaveBeenCalledWith({
      dateRange: '',
      locationId: '',
      page: 1,
      perPage: 10,
    })
    expect(wrapper.text()).toContain('Morning Ride')
    expect(wrapper.text()).toContain('12.34 mi')
    expect(wrapper.text()).toContain('1h 2m')
    expect(wrapper.text()).toContain('North Park')
    expect(wrapper.find('img').attributes('src')).toBe('http://example.test/storage/rides/10/images/small/photo.jpg')
    expect(wrapper.find('a.ride-title').attributes('href')).toBe('/rides/10')
  })

  it('reloads rides when filters change', async () => {
    const { wrapper } = await mountRideListView()

    await wrapper.find('#ride-list-location').setValue('1')
    await wrapper.find('#ride-list-date-range').setValue('last_month')
    await wrapper.find('#ride-list-per-page').setValue('25')
    await flushPromises()

    expect(mockedGetRides).toHaveBeenLastCalledWith({
      dateRange: 'last_month',
      locationId: '1',
      page: 1,
      perPage: 25,
    })
  })

  it('paginates rides', async () => {
    mockedGetRides.mockResolvedValueOnce(ridesResponse({
      meta: {
        current_page: 1,
        from: 1,
        last_page: 2,
        per_page: 10,
        to: 10,
        total: 12,
      },
    }))
    mockedGetRides.mockResolvedValueOnce(ridesResponse({
      meta: {
        current_page: 2,
        from: 11,
        last_page: 2,
        per_page: 10,
        to: 12,
        total: 12,
      },
    }))

    const { wrapper } = await mountRideListView()

    await wrapper.findAll('button').find((button) => button.text() === 'Next')?.trigger('click')
    await flushPromises()

    expect(mockedGetRides).toHaveBeenLastCalledWith({
      dateRange: '',
      locationId: '',
      page: 2,
      perPage: 10,
    })
    expect(wrapper.text()).toContain('11-12 of 12')
  })

  it('renders an empty state', async () => {
    mockedGetRides.mockResolvedValueOnce(ridesResponse({
      data: [],
      meta: {
        current_page: 1,
        from: null,
        last_page: 1,
        per_page: 10,
        to: null,
        total: 0,
      },
    }))

    const { wrapper } = await mountRideListView()

    expect(wrapper.text()).toContain('No rides match these filters.')
    expect(wrapper.text()).toContain('No rides')
  })
})
