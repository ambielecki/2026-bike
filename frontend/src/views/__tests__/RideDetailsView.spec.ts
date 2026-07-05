import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import { ApiError } from '@/services/api'
import { getRide } from '@/services/rides'
import PlaceholderView from '@/views/PlaceholderView.vue'
import RideDetailsView from '@/views/RideDetailsView.vue'

vi.mock('@/services/rides', () => ({
  getRide: vi.fn(),
}))

const mockedGetRide = vi.mocked(getRide)

const routeMapStub = {
  props: ['center', 'opacity', 'routes'],
  template: '<div class="route-map-stub" :data-opacity="opacity">{{ routes.length }} route overlays</div>',
}

async function mountRideDetailsView(id = '10') {
  const pinia = createPinia()
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/rides',
        name: 'rides',
        component: PlaceholderView,
        props: {
          title: 'Rides',
        },
      },
      {
        path: '/rides/:id',
        name: 'ride-details',
        component: RideDetailsView,
      },
    ],
  })

  setActivePinia(pinia)

  router.push(`/rides/${id}`)
  await router.isReady()

  const wrapper = mount(RideDetailsView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        RideRouteMap: routeMapStub,
      },
    },
  })

  await flushPromises()

  return {
    router,
    wrapper,
  }
}

function rideDetails(overrides = {}) {
  return {
    id: 10,
    name: 'Morning Ride',
    description: 'Good morning loop.',
    datetime: '2026-07-04T12:30:00.000000Z',
    distance: '12.34',
    total_time: '3723.00',
    moving_time: '3600.00',
    average_speed: '11.10',
    max_speed: '22.20',
    route_data: [
      {
        latitude: 40.1,
        longitude: -79.1,
      },
      {
        latitude: 40.2,
        longitude: -79.2,
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

describe('RideDetailsView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedGetRide.mockResolvedValue(rideDetails())
  })

  it('loads and renders ride details', async () => {
    const { wrapper } = await mountRideDetailsView()

    expect(mockedGetRide).toHaveBeenCalledWith('10')
    expect(wrapper.text()).toContain('Morning Ride')
    expect(wrapper.text()).toContain('Good morning loop.')
    expect(wrapper.text()).toContain('North Park')
    expect(wrapper.text()).toContain('12.34 mi')
    expect(wrapper.text()).toContain('1h 2m')
    expect(wrapper.text()).toContain('1h 0m')
    expect(wrapper.text()).toContain('11.10 mph')
    expect(wrapper.text()).toContain('22.20 mph')
    expect(wrapper.find('.route-map-stub').text()).toContain('1 route overlays')

    const map = wrapper.findComponent(routeMapStub)
    expect(map.props('center')).toEqual({
      latitude: 40,
      longitude: -79,
    })
  })

  it('centers on the first route point when the ride location is missing', async () => {
    mockedGetRide.mockResolvedValueOnce(rideDetails({
      location: null,
    }))

    const { wrapper } = await mountRideDetailsView()

    const map = wrapper.findComponent(routeMapStub)
    expect(map.props('center')).toEqual({
      latitude: 40.1,
      longitude: -79.1,
    })
  })

  it('renders pending route state through the map component when route data is empty', async () => {
    mockedGetRide.mockResolvedValueOnce(rideDetails({
      route_data: [],
    }))

    const { wrapper } = await mountRideDetailsView()

    const map = wrapper.findComponent(routeMapStub)
    expect(map.props('routes')).toMatchObject([
      {
        points: [],
        visible: true,
      },
    ])
  })

  it('updates route color opacity and visibility controls', async () => {
    const { wrapper } = await mountRideDetailsView()

    await wrapper.find('#route-color').setValue('#ff0000')
    await wrapper.find('#route-opacity').setValue('0.35')
    await wrapper.find('#route-visible').setValue(false)
    await flushPromises()

    const map = wrapper.findComponent(routeMapStub)
    expect(map.props('opacity')).toBe(0.35)
    expect(map.props('routes')).toMatchObject([
      {
        color: '#ff0000',
        visible: false,
      },
    ])
  })

  it('renders API errors', async () => {
    mockedGetRide.mockRejectedValueOnce(new ApiError(404, 'Not found.'))

    const { wrapper } = await mountRideDetailsView()

    expect(wrapper.text()).toContain('Not found.')
  })
})
