import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import { ApiError } from '@/services/api'
import { getPaginatedLocations, updateLocation } from '@/services/rides'
import { useToastStore } from '@/stores/toasts'
import LocationSettingsView from '@/views/LocationSettingsView.vue'
import SettingsView from '@/views/SettingsView.vue'

vi.mock('@/services/rides', () => ({
  getPaginatedLocations: vi.fn(),
  updateLocation: vi.fn(),
}))

const mockedGetPaginatedLocations = vi.mocked(getPaginatedLocations)
const mockedUpdateLocation = vi.mocked(updateLocation)

async function mountLocationSettingsView() {
  const pinia = createPinia()
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/settings',
        name: 'settings',
        component: SettingsView,
      },
      {
        path: '/settings/locations',
        name: 'settings-locations',
        component: LocationSettingsView,
      },
    ],
  })

  setActivePinia(pinia)

  router.push('/settings/locations')
  await router.isReady()

  const wrapper = mount(LocationSettingsView, {
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

function paginatedLocations(overrides = {}) {
  return {
    data: [
      {
        id: 1,
        name: 'North Park',
        user_id: 1,
        system_key: null,
        map_provider: 'openstreetmap' as const,
        latitude: '40.123456',
        longitude: '-79.123456',
      },
      {
        id: 2,
        name: 'South Trail',
        user_id: 1,
        system_key: null,
        map_provider: 'openstreetmap' as const,
        latitude: '41.123456',
        longitude: '-78.123456',
      },
    ],
    meta: {
      current_page: 1,
      from: 1,
      last_page: 2,
      per_page: 10,
      to: 2,
      total: 12,
    },
    ...overrides,
  }
}

describe('LocationSettingsView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedGetPaginatedLocations.mockResolvedValue(paginatedLocations())
    mockedUpdateLocation.mockResolvedValue({
      id: 1,
      name: 'Updated Park',
      user_id: 1,
      system_key: null,
      map_provider: 'openstreetmap' as const,
      latitude: '40.654321',
      longitude: '-79.654321',
    })
  })

  it('loads and renders a paginated list of locations', async () => {
    const { wrapper } = await mountLocationSettingsView()

    expect(mockedGetPaginatedLocations).toHaveBeenCalledWith({
      page: 1,
      perPage: 10,
    })
    expect(wrapper.text()).toContain('North Park')
    expect(wrapper.text()).toContain('40.123456, -79.123456')
    expect(wrapper.text()).toContain('South Trail')
    expect(wrapper.text()).toContain('Showing 1 to 2 of 12 locations.')
    expect(wrapper.text()).toContain('Page 1 of 2')
  })

  it('loads the next page', async () => {
    mockedGetPaginatedLocations.mockResolvedValueOnce(paginatedLocations()).mockResolvedValueOnce(
      paginatedLocations({
        data: [
          {
            id: 3,
            name: 'Third Trail',
            user_id: 1,
            system_key: null,
            map_provider: 'openstreetmap' as const,
            latitude: '42.123456',
            longitude: '-77.123456',
          },
        ],
        meta: {
          current_page: 2,
          from: 11,
          last_page: 2,
          per_page: 10,
          to: 11,
          total: 11,
        },
      }),
    )

    const { wrapper } = await mountLocationSettingsView()

    await buttonByText(wrapper, 'Next').trigger('click')
    await flushPromises()

    expect(mockedGetPaginatedLocations).toHaveBeenLastCalledWith({
      page: 2,
      perPage: 10,
    })
    expect(wrapper.text()).toContain('Third Trail')
    expect(wrapper.text()).toContain('Page 2 of 2')
  })

  it('opens the edit modal with the selected location values', async () => {
    const { wrapper } = await mountLocationSettingsView()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Edit')
      ?.trigger('click')

    expect(wrapper.find('#edit-location-name').element).toHaveProperty('value', 'North Park')
    expect(wrapper.find('#edit-location-latitude').element).toHaveProperty('value', '40.123456')
    expect(wrapper.find('#edit-location-longitude').element).toHaveProperty('value', '-79.123456')
  })

  it('validates edit location fields before saving', async () => {
    const { wrapper } = await mountLocationSettingsView()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Edit')
      ?.trigger('click')
    await wrapper.find('#edit-location-name').setValue('   ')
    await wrapper.find('#edit-location-latitude').setValue('91')
    await wrapper.find('#edit-location-longitude').setValue('-181')
    await wrapper.find('form.location-form').trigger('submit')

    expect(mockedUpdateLocation).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Name is required.')
    expect(wrapper.text()).toContain('Latitude must be between -90 and 90.')
    expect(wrapper.text()).toContain('Longitude must be between -180 and 180.')
  })

  it('updates a location from the edit modal', async () => {
    const { toastStore, wrapper } = await mountLocationSettingsView()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Edit')
      ?.trigger('click')
    await wrapper.find('#edit-location-name').setValue('Updated Park')
    await wrapper.find('#edit-location-latitude').setValue('40.654321')
    await wrapper.find('#edit-location-longitude').setValue('-79.654321')
    await wrapper.find('form.location-form').trigger('submit')
    await flushPromises()

    expect(mockedUpdateLocation).toHaveBeenCalledWith(1, {
      name: 'Updated Park',
      latitude: '40.654321',
      longitude: '-79.654321',
    })
    expect(wrapper.find('.modal-panel').exists()).toBe(false)
    expect(wrapper.text()).toContain('Updated Park')
    expect(wrapper.text()).toContain('40.654321, -79.654321')
    expect(toastStore.toasts[0]?.message).toBe('Location updated')
  })

  it('renders load errors', async () => {
    mockedGetPaginatedLocations.mockRejectedValueOnce(
      new ApiError(500, 'Unable to load locations.'),
    )

    const { wrapper } = await mountLocationSettingsView()

    expect(wrapper.text()).toContain('Unable to load locations.')
  })

  it('renders update errors in the modal', async () => {
    mockedUpdateLocation.mockRejectedValueOnce(new ApiError(422, 'The latitude field is invalid.'))
    const { wrapper } = await mountLocationSettingsView()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Edit')
      ?.trigger('click')
    await wrapper.find('form.location-form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.modal-panel').exists()).toBe(true)
    expect(wrapper.text()).toContain('The latitude field is invalid.')
  })
})

function buttonByText(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper.findAll('button').find((item) => item.text() === text)

  if (!button) {
    throw new Error(`Button not found: ${text}`)
  }

  return button
}
