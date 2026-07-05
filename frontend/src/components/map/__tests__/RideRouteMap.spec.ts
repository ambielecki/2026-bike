import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { marker } from 'leaflet'

import RideRouteMap from '@/components/map/RideRouteMap.vue'

const addToMock = vi.fn().mockReturnThis()
const clearLayersMock = vi.fn().mockReturnThis()
const invalidateSizeMock = vi.fn().mockReturnThis()
const removeMock = vi.fn().mockReturnThis()
const setViewMock = vi.fn().mockReturnThis()

vi.mock('leaflet', () => ({
  latLng: (latitude: number, longitude: number) => ({ lat: latitude, lng: longitude }),
  layerGroup: vi.fn(() => ({
    addTo: addToMock,
    clearLayers: clearLayersMock,
  })),
  map: vi.fn(() => ({
    invalidateSize: invalidateSizeMock,
    remove: removeMock,
    setView: setViewMock,
  })),
  marker: vi.fn(() => ({
    addTo: addToMock,
  })),
  polyline: vi.fn(() => ({
    addTo: addToMock,
  })),
  tileLayer: vi.fn(() => ({
    addTo: addToMock,
  })),
}))

const route = {
  id: 'ride-1',
  name: 'Morning Ride',
  color: '#1f7a4d',
  points: [
    {
      latitude: 40.1,
      longitude: -79.1,
    },
    {
      latitude: 40.2,
      longitude: -79.2,
    },
  ],
  visible: true,
}
const markerMock = vi.mocked(marker)

describe('RideRouteMap', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('centers on the provided location center', async () => {
    mount(RideRouteMap, {
      props: {
        center: {
          latitude: 40,
          longitude: -79,
        },
        routes: [route],
      },
    })

    await flushPromises()

    expect(setViewMock).toHaveBeenCalledWith([40, -79], 13)
  })

  it('falls back to the first route point when no center is provided', async () => {
    mount(RideRouteMap, {
      props: {
        center: null,
        routes: [route],
      },
    })

    await flushPromises()

    expect(setViewMock).toHaveBeenCalledWith([40.1, -79.1], 13)
  })

  it('does not recenter when only route color or opacity changes', async () => {
    const wrapper = mount(RideRouteMap, {
      props: {
        center: {
          latitude: 40,
          longitude: -79,
        },
        opacity: 0.75,
        routes: [route],
      },
    })
    await flushPromises()
    setViewMock.mockClear()

    await wrapper.setProps({
      opacity: 0.35,
      routes: [
        {
          ...route,
          color: '#ff0000',
        },
      ],
    })
    await flushPromises()

    expect(setViewMock).not.toHaveBeenCalled()
  })

  it('does not render start and end markers when markers are disabled', async () => {
    mount(RideRouteMap, {
      props: {
        routes: [route],
        showMarkers: false,
      },
    })

    await flushPromises()

    expect(markerMock).not.toHaveBeenCalled()
  })
})
