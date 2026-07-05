import { api } from '@/services/api'

export interface Location {
  id: number
  name: string
  user_id: number
  latitude: string
  longitude: string
}

export interface Ride {
  id: number
  name: string
  description: string | null
  user_id: number
  location_id: number
}

export interface RideListItem {
  id: number
  name: string
  datetime: string | null
  distance: string | null
  total_time: string | null
  location: {
    id: number
    name: string
  } | null
  thumbnail_url: string | null
}

export interface RoutePoint {
  latitude: number
  longitude: number
}

export interface RideDetails {
  id: number
  name: string
  description: string | null
  datetime: string | null
  distance: string | null
  total_time: string | null
  moving_time: string | null
  average_speed: string | null
  max_speed: string | null
  route_data: RoutePoint[]
  location: {
    id: number
    name: string
    latitude: string
    longitude: string
  } | null
}

export interface RideListFilters {
  dateRange?: 'last_week' | 'last_month' | 'last_year' | ''
  locationId?: string
  page?: number
  perPage?: 10 | 25 | 50
}

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

interface PaginatedApiData<T> extends ApiData<T> {
  meta: PaginationMeta
}

interface ApiData<T> {
  data: T
}

export interface CreateLocationPayload {
  name: string
  latitude: string
  longitude: string
}

export interface CreateRidePayload {
  name: string
  description: string
  locationId: number
  fitFile: File
  imageFile: File | null
}

export async function getLocations() {
  const response = await api.get<ApiData<Location[]>>('/api/locations')

  return response.data
}

export async function getRides(filters: RideListFilters = {}) {
  const params = new URLSearchParams()

  if (filters.locationId) {
    params.set('location_id', filters.locationId)
  }

  if (filters.dateRange) {
    params.set('date_range', filters.dateRange)
  }

  if (filters.perPage) {
    params.set('per_page', String(filters.perPage))
  }

  if (filters.page) {
    params.set('page', String(filters.page))
  }

  const query = params.toString()
  const response = await api.get<PaginatedApiData<RideListItem[]>>(
    query ? `/api/rides?${query}` : '/api/rides',
  )

  return response
}

export async function getRide(id: string | number) {
  const response = await api.get<ApiData<RideDetails>>(`/api/rides/${id}`)

  return response.data
}

export async function createLocation(payload: CreateLocationPayload) {
  const response = await api.post<ApiData<Location>>('/api/locations', {
    name: payload.name,
    latitude: payload.latitude,
    longitude: payload.longitude,
  })

  return response.data
}

export async function createRide(payload: CreateRidePayload) {
  const formData = new FormData()

  formData.append('name', payload.name)
  formData.append('location_id', String(payload.locationId))
  formData.append('fit_file', payload.fitFile)

  if (payload.description) {
    formData.append('description', payload.description)
  }

  if (payload.imageFile) {
    formData.append('image', payload.imageFile)
  }

  const response = await api.post<ApiData<Ride>>('/api/rides', formData)

  return response.data
}
