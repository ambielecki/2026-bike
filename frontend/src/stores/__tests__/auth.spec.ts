import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useAuthStore } from '@/stores/auth'

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.stubEnv('VITE_API_URL', 'http://api.example.test')
    document.cookie = 'XSRF-TOKEN=test-token; path=/'
  })

  it('logs in through Fortify and reloads the current user', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 1,
            name: 'Rider',
            email: 'rider@example.com',
            is_admin: 1,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()

    await authStore.login('rider@example.com', 'password', true)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://api.example.test/login',
      expect.objectContaining({
        credentials: 'include',
        method: 'POST',
      }),
    )

    const loginBody = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as {
      email: string
      password: string
      remember: boolean
    }
    const loginHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)

    expect(loginBody).toEqual({
      email: 'rider@example.com',
      password: 'password',
      remember: true,
    })
    expect(loginHeaders.get('X-XSRF-TOKEN')).toBe('test-token')
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://api.example.test/api/user',
      expect.objectContaining({
        credentials: 'include',
      }),
    )
    expect(authStore.currentUser?.email).toBe('rider@example.com')
    expect(authStore.isAdmin).toBe(true)
  })
})
