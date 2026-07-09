import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { imageOverlay, map as createMap, marker, tileLayer } from 'leaflet'

import RideRouteMap from '@/components/map/RideRouteMap.vue'

const addToMock = vi.fn().mockReturnThis()
const clearLayersMock = vi.fn().mockReturnThis()
const invalidateSizeMock = vi.fn().mockReturnThis()
const removeMock = vi.fn().mockReturnThis()
const removeLayerMock = vi.fn().mockReturnThis()
const fitBoundsMock = vi.fn().mockReturnThis()
const setViewMock = vi.fn().mockReturnThis()

vi.mock('leaflet', () => ({
  imageOverlay: vi.fn(() => ({
    addTo: addToMock,
  })),
  latLng: (latitude: number, longitude: number) => ({ lat: latitude, lng: longitude }),
  layerGroup: vi.fn(() => ({
    addTo: addToMock,
    clearLayers: clearLayersMock,
  })),
  map: vi.fn(() => ({
    fitBounds: fitBoundsMock,
    invalidateSize: invalidateSizeMock,
    remove: removeMock,
    removeLayer: removeLayerMock,
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
vi.mock('leaflet.fullscreen', () => ({}))

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
const createMapMock = vi.mocked(createMap)
const imageOverlayMock = vi.mocked(imageOverlay)
const markerMock = vi.mocked(marker)
const tileLayerMock = vi.mocked(tileLayer)

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

    expect(createMapMock).toHaveBeenCalledWith(expect.any(HTMLElement), {
      fullscreenControl: true,
      scrollWheelZoom: true,
    })
    expect(setViewMock).toHaveBeenCalledWith([40, -79], 13)
  })

  it('uses OpenStreetMap tiles by default', async () => {
    mount(RideRouteMap, {
      props: {
        routes: [route],
      },
    })

    await flushPromises()

    expect(tileLayerMock).toHaveBeenCalledWith('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    })
    expect(imageOverlayMock).not.toHaveBeenCalled()
  })

  it('uses the Watopia image overlay without OpenStreetMap tiles in Watopia mode', async () => {
    mount(RideRouteMap, {
      props: {
        mapProvider: 'watopia',
        routes: [],
      },
    })

    await flushPromises()

    expect(imageOverlayMock).toHaveBeenCalledWith(
      expect.stringContaining('watopia.png'),
      [
        [-11.62597, 166.87747],
        [-11.74087, 167.03255],
      ],
      {
        attribution: '&copy; Zwift',
      },
    )
    expect(tileLayerMock).not.toHaveBeenCalled()
    expect(fitBoundsMock).toHaveBeenCalledWith([
      [-11.635444, 166.93555],
      [-11.673613, 166.972511],
    ])
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
