import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import { createLocation, createRide, getLocations } from '@/services/rides'
import { useToastStore } from '@/stores/toasts'
import AddRideView from '@/views/AddRideView.vue'
import PlaceholderView from '@/views/PlaceholderView.vue'

vi.mock('@/services/rides', () => ({
  createLocation: vi.fn(),
  createRide: vi.fn(),
  getLocations: vi.fn(),
}))

const mockedGetLocations = vi.mocked(getLocations)
const mockedCreateLocation = vi.mocked(createLocation)
const mockedCreateRide = vi.mocked(createRide)

async function mountAddRideView() {
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
        path: '/rides/add',
        name: 'add-ride',
        component: AddRideView,
      },
    ],
  })

  setActivePinia(pinia)

  router.push('/rides/add')
  await router.isReady()

  const wrapper = mount(AddRideView, {
    global: {
      plugins: [pinia, router],
    },
  })

  await flushPromises()

  return {
    router,
    toastStore: useToastStore(),
    wrapper,
  }
}

function makeFile(name: string, type = 'application/octet-stream') {
  return new File(['content'], name, { type })
}

async function setFile(wrapper: Awaited<ReturnType<typeof mountAddRideView>>['wrapper'], selector: string, file: File) {
  const input = wrapper.find<HTMLInputElement>(selector)

  Object.defineProperty(input.element, 'files', {
    configurable: true,
    value: [file],
  })

  await input.trigger('change')
}

describe('AddRideView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('loads locations on mount', async () => {
    mockedGetLocations.mockResolvedValueOnce([
      {
        id: 1,
        name: 'North Park',
        user_id: 1,
        system_key: null,
        map_provider: 'openstreetmap' as const,
        latitude: '40.000000',
        longitude: '-79.000000',
      },
      {
        id: 2,
        name: 'Watopia',
        user_id: null,
        system_key: 'watopia',
        map_provider: 'watopia' as const,
        latitude: '-11.683420',
        longitude: '166.955010',
      },
    ])

    const { wrapper } = await mountAddRideView()

    expect(mockedGetLocations).toHaveBeenCalledOnce()
    expect(wrapper.find('#ride-location').text()).toContain('North Park')
    expect(wrapper.find('#ride-location').text()).toContain('Watopia')
  })

  it('validates required ride fields', async () => {
    mockedGetLocations.mockResolvedValueOnce([])

    const { wrapper } = await mountAddRideView()

    await wrapper.find('form.ride-form').trigger('submit')

    expect(wrapper.text()).toContain('Name is required.')
    expect(wrapper.text()).toContain('Location is required.')
    expect(wrapper.text()).toContain('FIT file is required.')
    expect(mockedCreateRide).not.toHaveBeenCalled()
  })

  it('creates a location and selects it', async () => {
    mockedGetLocations
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 12,
          name: 'River Loop',
          user_id: 1,
          system_key: null,
          map_provider: 'openstreetmap' as const,
          latitude: '40.100000',
          longitude: '-79.100000',
        },
      ])
    mockedCreateLocation.mockResolvedValueOnce({
      id: 12,
      name: 'River Loop',
      user_id: 1,
      system_key: null,
      map_provider: 'openstreetmap' as const,
      latitude: '40.100000',
      longitude: '-79.100000',
    })

    const { wrapper } = await mountAddRideView()

    await wrapper.find('button.secondary-action').trigger('click')
    await wrapper.find('#new-location-name').setValue('River Loop')
    await wrapper.find('#new-location-latitude').setValue('40.1')
    await wrapper.find('#new-location-longitude').setValue('-79.1')
    await wrapper.find('form.location-form').trigger('submit')
    await flushPromises()

    expect(mockedCreateLocation).toHaveBeenCalledWith({
      name: 'River Loop',
      latitude: '40.1',
      longitude: '-79.1',
    })
    expect(wrapper.find<HTMLSelectElement>('#ride-location').element.value).toBe('12')
    expect(wrapper.find('.modal-panel').exists()).toBe(false)
  })

  it('submits multipart ride data and redirects to rides', async () => {
    mockedGetLocations.mockResolvedValueOnce([
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
    mockedCreateRide.mockResolvedValueOnce({
      id: 2,
      name: 'Morning Ride',
      description: 'Easy spin',
      user_id: 1,
      location_id: 1,
    })

    const { router, toastStore, wrapper } = await mountAddRideView()
    const fitFile = makeFile('activity.fit')

    await wrapper.find('#ride-name').setValue('Morning Ride')
    await wrapper.find('#ride-description').setValue('Easy spin')
    await wrapper.find('#ride-location').setValue('1')
    await setFile(wrapper, '#ride-fit-file', fitFile)
    await wrapper.find('form.ride-form').trigger('submit')
    await flushPromises()

    expect(mockedCreateRide).toHaveBeenCalledWith({
      name: 'Morning Ride',
      description: 'Easy spin',
      locationId: 1,
      fitFile,
    })
    expect(toastStore.toasts[0]?.message).toBe('Ride added to BikeMap')
    expect(router.currentRoute.value.name).toBe('rides')
  })
})
