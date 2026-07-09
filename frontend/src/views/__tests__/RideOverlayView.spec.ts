import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import { getLocations, getRide, getRides } from '@/services/rides'
import RideOverlayView from '@/views/RideOverlayView.vue'

vi.mock('@/services/rides', () => ({
  getLocations: vi.fn(),
  getRide: vi.fn(),
  getRides: vi.fn(),
}))

const routeMapStub = {
  name: 'RideRouteMap',
  props: ['center', 'opacity', 'routes', 'showMarkers'],
  template: '<div class="route-map-stub"></div>',
}

const mockedGetLocations = vi.mocked(getLocations)
const mockedGetRide = vi.mocked(getRide)
const mockedGetRides = vi.mocked(getRides)

async function mountRideOverlayView() {
  const pinia = createPinia()
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/rides/overlay',
        name: 'ride-overlay',
        component: RideOverlayView,
      },
    ],
  })

  setActivePinia(pinia)

  router.push('/rides/overlay')
  await router.isReady()

  const wrapper = mount(RideOverlayView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        RideRouteMap: routeMapStub,
      },
    },
  })

  await flushPromises()

  return {
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
        },
        thumbnail_url: null,
      },
    ],
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: 50,
      to: 1,
      total: 1,
    },
    ...overrides,
  }
}

function rideDetails(overrides = {}) {
  return {
    id: 10,
    name: 'Morning Ride',
    description: null,
    datetime: '2026-07-04T12:30:00.000000Z',
    distance: '12.34',
    total_time: '3723.00',
    moving_time: '3600.00',
    average_speed: '12.10',
    max_speed: '24.20',
    image_url: null,
    route_data: [
      {
        latitude: 40.1,
        longitude: -79.1,
      },
    ],
    location: {
      id: 1,
      name: 'North Park',
      latitude: '40.000000',
      longitude: '-79.000000',
    },
    ...overrides,
  }
}

describe('RideOverlayView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedGetLocations.mockResolvedValue([
      {
        id: 1,
        name: 'North Park',
        user_id: 1,
        latitude: '40.000000',
        longitude: '-79.000000',
      },
    ])
    mockedGetRides.mockResolvedValue(ridesResponse())
    mockedGetRide.mockResolvedValue(rideDetails())
  })

  it('loads rides with overlay defaults and renders a condensed ride list', async () => {
    const { wrapper } = await mountRideOverlayView()

    expect(mockedGetLocations).toHaveBeenCalledOnce()
    expect(mockedGetRides).toHaveBeenCalledWith({
      endDate: '',
      locationId: '',
      page: 1,
      perPage: 50,
      startDate: '',
    })
    expect(wrapper.text()).toContain('Morning Ride')
    expect(wrapper.text()).toContain('12.34 mi')
    expect(wrapper.text()).toContain('North Park')
    expect(wrapper.getComponent(routeMapStub).props('showMarkers')).toBe(false)
  })

  it('filters by dates and location then centers the map on the selected location', async () => {
    const { wrapper } = await mountRideOverlayView()

    await wrapper.find('#overlay-location').setValue('1')
    await wrapper.find('#overlay-start-date').setValue('2026-07-01')
    await wrapper.find('#overlay-end-date').setValue('2026-07-05')
    await flushPromises()

    expect(mockedGetRides).toHaveBeenLastCalledWith({
      endDate: '2026-07-05',
      locationId: '1',
      page: 1,
      perPage: 50,
      startDate: '2026-07-01',
    })
    expect(wrapper.getComponent(routeMapStub).props('center')).toEqual({
      latitude: 40,
      longitude: -79,
    })
  })

  it('adds, colors, overrides, and removes a route', async () => {
    const { wrapper } = await mountRideOverlayView()

    await wrapper.findAll('button').find((button) => button.text() === 'Add')?.trigger('click')
    await flushPromises()

    expect(wrapper.find('.selected-routes').exists()).toBe(false)
    expect(mockedGetRide).toHaveBeenCalledWith(10)
    expect(wrapper.getComponent(routeMapStub).props('routes')).toEqual([
      {
        id: '10',
        name: 'Morning Ride',
        color: '#1f7a4d',
        points: [
          {
            latitude: 40.1,
            longitude: -79.1,
          },
        ],
        visible: true,
      },
    ])

    await wrapper.find('#route-color-10').setValue('#255f85')
    await flushPromises()

    expect(wrapper.getComponent(routeMapStub).props('routes')[0].color).toBe('#255f85')

    await wrapper.find('#overlay-use-global-color').setValue(true)
    await wrapper.find('#overlay-global-color').setValue('#ad2f45')
    await flushPromises()

    expect(wrapper.getComponent(routeMapStub).props('routes')[0].color).toBe('#ad2f45')

    await wrapper.findAll('button').find((button) => button.text() === 'Remove')?.trigger('click')
    await flushPromises()

    expect(wrapper.getComponent(routeMapStub).props('routes')).toEqual([])
  })

  it('loads more rides by appending the next page', async () => {
    mockedGetRides.mockResolvedValueOnce(ridesResponse({
      meta: {
        current_page: 1,
        from: 1,
        last_page: 2,
        per_page: 50,
        to: 50,
        total: 51,
      },
    }))
    mockedGetRides.mockResolvedValueOnce(ridesResponse({
      data: [
        {
          id: 11,
          name: 'Evening Ride',
          datetime: '2026-07-05T12:30:00.000000Z',
          distance: '8.10',
          total_time: '2400.00',
          location: {
            id: 1,
            name: 'North Park',
          },
          thumbnail_url: null,
        },
      ],
      meta: {
        current_page: 2,
        from: 51,
        last_page: 2,
        per_page: 50,
        to: 51,
        total: 51,
      },
    }))

    const { wrapper } = await mountRideOverlayView()

    await wrapper.findAll('button').find((button) => button.text() === 'Load more')?.trigger('click')
    await flushPromises()

    expect(mockedGetRides).toHaveBeenLastCalledWith({
      endDate: '',
      locationId: '',
      page: 2,
      perPage: 50,
      startDate: '',
    })
    expect(wrapper.text()).toContain('Morning Ride')
    expect(wrapper.text()).toContain('Evening Ride')
  })
})
