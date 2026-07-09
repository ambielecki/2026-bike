import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import { ApiError } from '@/services/api'
import { deleteRide, getRide, updateRide } from '@/services/rides'
import PlaceholderView from '@/views/PlaceholderView.vue'
import RideDetailsView from '@/views/RideDetailsView.vue'

vi.mock('@/services/rides', () => ({
  deleteRide: vi.fn(),
  getRide: vi.fn(),
  updateRide: vi.fn(),
}))

const mockedDeleteRide = vi.mocked(deleteRide)
const mockedGetRide = vi.mocked(getRide)
const mockedUpdateRide = vi.mocked(updateRide)

const routeMapStub = {
  props: ['center', 'mapProvider', 'opacity', 'routes'],
  template:
    '<div class="route-map-stub" :data-map-provider="mapProvider" :data-opacity="opacity">{{ routes.length }} route overlays</div>',
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
    image_url: 'http://example.test/storage/rides/10/images/medium/photo.jpg',
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
      system_key: null,
      map_provider: 'openstreetmap' as const,
    },
    ...overrides,
  }
}

describe('RideDetailsView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedGetRide.mockResolvedValue(rideDetails())
    mockedUpdateRide.mockResolvedValue(
      rideDetails({
        name: 'Updated Ride',
        description: 'Updated description.',
      }),
    )
    mockedDeleteRide.mockResolvedValue()
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
    expect(wrapper.find('.ride-image').attributes('src')).toBe(
      'http://example.test/storage/rides/10/images/medium/photo.jpg',
    )
    expect(wrapper.find('.ride-image').attributes('alt')).toBe('Morning Ride ride image')

    const map = wrapper.findComponent(routeMapStub)
    expect(map.props('center')).toEqual({
      latitude: 40,
      longitude: -79,
    })
    expect(map.props('mapProvider')).toBe('openstreetmap')
  })

  it('passes Watopia map mode for Watopia rides', async () => {
    mockedGetRide.mockResolvedValueOnce(
      rideDetails({
        location: {
          id: 2,
          name: 'Watopia',
          latitude: '-11.683420',
          longitude: '166.955010',
          system_key: 'watopia',
          map_provider: 'watopia' as const,
        },
      }),
    )

    const { wrapper } = await mountRideDetailsView()

    expect(wrapper.findComponent(routeMapStub).props('mapProvider')).toBe('watopia')
  })

  it('centers on the first route point when the ride location is missing', async () => {
    mockedGetRide.mockResolvedValueOnce(
      rideDetails({
        location: null,
      }),
    )

    const { wrapper } = await mountRideDetailsView()

    const map = wrapper.findComponent(routeMapStub)
    expect(map.props('center')).toEqual({
      latitude: 40.1,
      longitude: -79.1,
    })
  })

  it('renders pending route state through the map component when route data is empty', async () => {
    mockedGetRide.mockResolvedValueOnce(
      rideDetails({
        route_data: [],
      }),
    )

    const { wrapper } = await mountRideDetailsView()

    const map = wrapper.findComponent(routeMapStub)
    expect(map.props('routes')).toMatchObject([
      {
        points: [],
        visible: true,
      },
    ])
  })

  it('does not render a ride image when no image URL is present', async () => {
    mockedGetRide.mockResolvedValueOnce(
      rideDetails({
        image_url: null,
      }),
    )

    const { wrapper } = await mountRideDetailsView()

    expect(wrapper.find('.ride-image').exists()).toBe(false)
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

  it('updates ride name and description from the edit modal', async () => {
    const { wrapper } = await mountRideDetailsView()

    await buttonByText(wrapper, 'Edit').trigger('click')
    await wrapper.find('#edit-ride-name').setValue('Updated Ride')
    await wrapper.find('#edit-ride-description').setValue('Updated description.')
    await wrapper.find('form.modal-form').trigger('submit')
    await flushPromises()

    expect(mockedUpdateRide).toHaveBeenCalledWith(10, {
      name: 'Updated Ride',
      description: 'Updated description.',
    })
    expect(wrapper.find('.modal-panel').exists()).toBe(false)
    expect(wrapper.text()).toContain('Updated Ride')
    expect(wrapper.text()).toContain('Updated description.')
  })

  it('requires a ride name when editing', async () => {
    const { wrapper } = await mountRideDetailsView()

    await buttonByText(wrapper, 'Edit').trigger('click')
    await wrapper.find('#edit-ride-name').setValue('   ')
    await wrapper.find('form.modal-form').trigger('submit')
    await flushPromises()

    expect(mockedUpdateRide).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Name is required.')
  })

  it('renders update errors in the edit modal', async () => {
    mockedUpdateRide.mockRejectedValueOnce(new ApiError(422, 'The name field is required.'))
    const { wrapper } = await mountRideDetailsView()

    await buttonByText(wrapper, 'Edit').trigger('click')
    await wrapper.find('#edit-ride-name').setValue('Updated Ride')
    await wrapper.find('form.modal-form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.modal-panel').exists()).toBe(true)
    expect(wrapper.text()).toContain('The name field is required.')
  })

  it('deletes a ride after confirmation and returns to the ride list', async () => {
    const { router, wrapper } = await mountRideDetailsView()

    await buttonByText(wrapper, 'Delete').trigger('click')
    expect(wrapper.text()).toContain('Delete Morning Ride? This cannot be undone.')

    await buttonByText(wrapper, 'Delete Ride').trigger('click')
    await flushPromises()

    expect(mockedDeleteRide).toHaveBeenCalledWith(10)
    expect(router.currentRoute.value.name).toBe('rides')
  })

  it('renders delete errors in the confirmation modal', async () => {
    mockedDeleteRide.mockRejectedValueOnce(new ApiError(500, 'Unable to delete ride.'))
    const { wrapper } = await mountRideDetailsView()

    await buttonByText(wrapper, 'Delete').trigger('click')
    await buttonByText(wrapper, 'Delete Ride').trigger('click')
    await flushPromises()

    expect(wrapper.find('.modal-panel').exists()).toBe(true)
    expect(wrapper.text()).toContain('Unable to delete ride.')
  })

  it('renders API errors', async () => {
    mockedGetRide.mockRejectedValueOnce(new ApiError(404, 'Not found.'))

    const { wrapper } = await mountRideDetailsView()

    expect(wrapper.text()).toContain('Not found.')
  })
})

function buttonByText(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper.findAll('button').find((item) => item.text() === text)

  if (!button) {
    throw new Error(`Button not found: ${text}`)
  }

  return button
}
