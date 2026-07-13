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

  it('registers through Fortify and reloads the current user', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 2,
            name: 'New Rider',
            email: 'new@example.com',
            is_admin: false,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()

    await authStore.register('New Rider', 'new@example.com', 'password', 'password')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://api.example.test/register',
      expect.objectContaining({
        credentials: 'include',
        method: 'POST',
      }),
    )

    const registerBody = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as {
      name: string
      email: string
      password: string
      password_confirmation: string
    }

    expect(registerBody).toEqual({
      name: 'New Rider',
      email: 'new@example.com',
      password: 'password',
      password_confirmation: 'password',
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://api.example.test/api/user',
      expect.objectContaining({
        credentials: 'include',
      }),
    )
    expect(authStore.currentUser?.name).toBe('New Rider')
  })

  it('shares an in-flight current user request across concurrent callers', async () => {
    let resolveResponse: (response: Response) => void = () => {}
    const userResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve
    })
    const fetchMock = vi.fn().mockReturnValue(userResponse)

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    const firstLoad = authStore.loadCurrentUser()
    const secondLoad = authStore.loadCurrentUser()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(authStore.isLoading).toBe(true)

    resolveResponse(
      new Response(
        JSON.stringify({
          id: 1,
          name: 'Admin Rider',
          email: 'admin@example.com',
          is_admin: true,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    await Promise.all([firstLoad, secondLoad])

    expect(authStore.currentUser?.email).toBe('admin@example.com')
    expect(authStore.isAdmin).toBe(true)
    expect(authStore.isLoading).toBe(false)
  })

  it('updates the current user name', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 1,
          name: 'Updated Rider',
          email: 'rider@example.com',
          is_admin: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()

    await authStore.updateName('Updated Rider')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.example.test/api/user/name',
      expect.objectContaining({
        credentials: 'include',
        method: 'PATCH',
      }),
    )

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as {
      name: string
    }
    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)

    expect(body).toEqual({
      name: 'Updated Rider',
    })
    expect(headers.get('X-XSRF-TOKEN')).toBe('test-token')
    expect(authStore.currentUser?.name).toBe('Updated Rider')
    expect(authStore.currentUser?.is_admin).toBe(false)
  })

  it('resets the current user password', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()

    await authStore.resetPassword('new-password', 'new-password')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.example.test/api/user/password',
      expect.objectContaining({
        credentials: 'include',
        method: 'PATCH',
      }),
    )

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as {
      password: string
      password_confirmation: string
    }

    expect(body).toEqual({
      password: 'new-password',
      password_confirmation: 'new-password',
    })
  })

  it('deletes the current user account and clears the current user', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 }))

    vi.stubGlobal('fetch', fetchMock)

    const authStore = useAuthStore()
    authStore.currentUser = {
      id: 1,
      name: 'Rider',
      email: 'rider@example.com',
      is_admin: false,
    }

    await authStore.deleteAccount('Delete My ShowMyRides Account')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.example.test/api/user',
      expect.objectContaining({
        credentials: 'include',
        method: 'DELETE',
      }),
    )

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string) as {
      confirmation_phrase: string
    }

    expect(body).toEqual({
      confirmation_phrase: 'Delete My ShowMyRides Account',
    })
    expect(authStore.currentUser).toBeNull()
  })
})
