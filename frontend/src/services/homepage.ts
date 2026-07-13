import { api } from '@/services/api'

export interface HomepageHighlight {
  title: string
  copy: string
  sort_order: number
}

export interface HomepageImage {
  id: number
  description: string | null
  alt_text: string
  urls: {
    small: string
    medium: string
    large: string
    original: string
  }
}

export interface HomepageContent {
  id: number
  highlights: HomepageHighlight[]
  carousel_images: HomepageImage[]
}

export interface AdminHomepageContent extends HomepageContent {
  available_images: HomepageImage[]
}

export interface UpdateHomepagePayload {
  highlights: Array<{
    title: string
    copy: string
  }>
  carousel_image_ids: number[]
}

interface ApiData<T> {
  data: T
}

export const defaultHomepageContent: HomepageContent = {
  id: 0,
  highlights: [],
  carousel_images: [],
}

export function homepageHeroImageUrl() {
  return `${apiBaseUrl()}/api/homepage/hero-image`
}

export async function getHomepage() {
  const response = await api.get<ApiData<HomepageContent>>('/api/homepage')

  return response.data
}

export async function getAdminHomepage() {
  const response = await api.get<ApiData<AdminHomepageContent>>('/api/admin/homepage')

  return response.data
}

export async function updateHomepage(payload: UpdateHomepagePayload) {
  const response = await api.patch<ApiData<HomepageContent>>('/api/admin/homepage', payload)

  return response.data
}

export async function uploadHomepageImage(payload: {
  image: File
  description: string
  altText: string
}) {
  const formData = new FormData()

  formData.append('image', payload.image)
  formData.append('alt_text', payload.altText)

  if (payload.description.trim()) {
    formData.append('description', payload.description.trim())
  }

  const response = await api.post<ApiData<HomepageImage>>('/api/admin/images', formData)

  return response.data
}

export async function updateHomepageImage(
  id: number,
  payload: {
    description: string
    altText: string
  },
) {
  const response = await api.patch<ApiData<HomepageImage>>(`/api/admin/images/${id}`, {
    description: payload.description.trim() || null,
    alt_text: payload.altText.trim(),
  })

  return response.data
}

export async function deleteHomepageImage(id: number) {
  await api.delete<void>(`/api/admin/images/${id}`)
}

function apiBaseUrl() {
  return import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
}
