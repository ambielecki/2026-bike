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
  site_name: string
  headline: string
  intro: string
  highlights: HomepageHighlight[]
  carousel_images: HomepageImage[]
}

export interface AdminHomepageContent extends HomepageContent {
  available_images: HomepageImage[]
}

export interface UpdateHomepagePayload {
  site_name: string
  headline: string
  intro: string
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
  site_name: 'ShowMyRides',
  headline: 'Track every mountain bike route worth riding twice.',
  intro:
    'Keep a clean record of the trails you ride, remember the lines you liked, and build a personal map of every loop, climb, and descent.',
  highlights: [
    {
      title: 'Save routes that matter',
      copy: 'Keep your favorite climbs, descents, and loops in one place instead of digging through old ride files.',
      sort_order: 0,
    },
    {
      title: 'Add context to each ride',
      copy: 'Capture conditions, difficulty, and trail notes so the next outing starts with better information.',
      sort_order: 1,
    },
    {
      title: 'Build your own trail map',
      copy: 'Turn repeated rides into a personal map of where you have been and where you want to ride next.',
      sort_order: 2,
    },
  ],
  carousel_images: [],
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
