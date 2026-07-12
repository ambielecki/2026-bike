import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { imageOverlay, map as createMap, marker, tileLayer } from 'leaflet'

import RideRouteMap from '@/components/map/RideRouteMap.vue'

const addToMock = vi.fn().mockReturnThis()
const clearLayersMock = vi.fn().mockReturnThis()
const invalidateSizeMock = vi.fn().mockReturnThis()
const latLngToContainerPointMock = vi.fn((point: { lat: number; lng: number }) => ({
  x: point.lng,
  y: point.lat,
}))
const removeMock = vi.fn().mockReturnThis()
const removeLayerMock = vi.fn().mockReturnThis()
const fitBoundsMock = vi.fn().mockReturnThis()
const getSizeMock = vi.fn(() => ({
  x: 640,
  y: 480,
}))
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
    getSize: getSizeMock,
    invalidateSize: invalidateSizeMock,
    latLngToContainerPoint: latLngToContainerPointMock,
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
      crossOrigin: true,
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

  it('uses the Makuri Islands image overlay without OpenStreetMap tiles in Makuri Islands mode', async () => {
    mount(RideRouteMap, {
      props: {
        mapProvider: 'makuri-islands',
        routes: [],
      },
    })

    await flushPromises()

    expect(imageOverlayMock).toHaveBeenCalledWith(
      expect.stringContaining('makuri-islands.png'),
      [
        [-10.73746, 165.76591],
        [-10.85234, 165.88222],
      ],
      {
        attribution: '&copy; Zwift',
      },
    )
    expect(tileLayerMock).not.toHaveBeenCalled()
    expect(fitBoundsMock).toHaveBeenCalledWith([
      [-10.74367, 165.799463],
      [-10.817209, 165.859244],
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

  it('downloads the current map view as a PNG image', async () => {
    const clickMock = vi.fn()
    const createObjectUrlMock = vi.fn(() => 'blob:map-image')
    const revokeObjectUrlMock = vi.fn()
    const drawImageMock = vi.fn()
    let downloadFilename = ''
    const originalCreateElement = document.createElement.bind(document)
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrlMock,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrlMock,
    })
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName, options) => {
        const element = originalCreateElement(tagName, options)

        if (tagName === 'canvas') {
          vi.spyOn(element as HTMLCanvasElement, 'getContext').mockReturnValue({
            arc: vi.fn(),
            beginPath: vi.fn(),
            drawImage: drawImageMock,
            fill: vi.fn(),
            fillRect: vi.fn(),
            lineTo: vi.fn(),
            moveTo: vi.fn(),
            restore: vi.fn(),
            save: vi.fn(),
            stroke: vi.fn(),
          } as unknown as CanvasRenderingContext2D)
          vi.spyOn(element as HTMLCanvasElement, 'toBlob').mockImplementation((callback) => {
            callback(new Blob(['map'], { type: 'image/png' }))
          })
        }

        if (tagName === 'a') {
          vi.spyOn(element as HTMLAnchorElement, 'click').mockImplementation(() => {
            downloadFilename = (element as HTMLAnchorElement).download
            clickMock()
          })
        }

        return element
      })

    try {
      const wrapper = mount(RideRouteMap, {
        props: {
          downloadFilenameBase: 'North Park',
          routes: [route],
        },
      })
      await flushPromises()

      await wrapper.get('button[aria-label="Download map image"]').trigger('click')
      await flushPromises()

      expect(createObjectUrlMock).toHaveBeenCalledWith(expect.any(Blob))
      expect(clickMock).toHaveBeenCalledOnce()
      expect(latLngToContainerPointMock).toHaveBeenCalled()
      expect(downloadFilename).toMatch(/^north-park-\d{4}-\d{2}-\d{2}\.png$/)
    } finally {
      createElementSpy.mockRestore()
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        value: originalCreateObjectURL,
      })
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        value: originalRevokeObjectURL,
      })
    }
  })
})
