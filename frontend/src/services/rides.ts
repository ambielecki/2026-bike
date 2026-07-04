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
