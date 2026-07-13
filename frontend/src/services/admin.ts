import { api } from '@/services/api'

export interface AdminStats {
  total_users: number
  new_users_last_7_days: number
  total_routes_logged: number
  routes_logged_last_7_days: number
}

interface ApiData<T> {
  data: T
}

export async function getAdminStats() {
  const response = await api.get<ApiData<AdminStats>>('/api/admin/stats')

  return response.data
}
