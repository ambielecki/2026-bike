/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'leaflet' {
  export interface LatLng {
    lat: number
    lng: number
  }

  export interface LayerGroup {
    addTo(map: Map): this
    clearLayers(): this
  }

  export interface Map {
    invalidateSize(): this
    remove(): this
    setView(center: [number, number], zoom: number): this
  }

  export interface TileLayerOptions {
    attribution?: string
    maxZoom?: number
  }

  export interface PolylineOptions {
    color?: string
    opacity?: number
    weight?: number
  }

  export interface MarkerOptions {
    title?: string
  }

  export function latLng(latitude: number, longitude: number): LatLng
  export function layerGroup(): LayerGroup
  export function map(
    element: HTMLElement,
    options?: {
      fullscreenControl?: boolean
      scrollWheelZoom?: boolean
    },
  ): Map
  export function marker(latLng: LatLng, options?: MarkerOptions): { addTo(layer: LayerGroup): unknown }
  export function polyline(
    latLngs: LatLng[],
    options?: PolylineOptions,
  ): { addTo(layer: LayerGroup): unknown }
  export function tileLayer(urlTemplate: string, options?: TileLayerOptions): { addTo(map: Map): unknown }
}

declare module 'leaflet.fullscreen'
