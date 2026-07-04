import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia } from 'pinia'

import { pinia } from '@/plugins/pinia'
import { ApiError, api } from '@/services/api'
import { useToastStore } from '@/stores/toasts'

describe('api service', () => {
  beforeEach(() => {
    setActivePinia(pinia)
    useToastStore().$reset?.()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.stubEnv('VITE_API_URL', 'http://api.example.test')
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    document.cookie = 'laravel_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  })

  it('shows a generic red toast for server errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Detailed failure' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(api.get('/api/test-errors/server-error')).rejects.toBeInstanceOf(ApiError)

    const [toast] = useToastStore().toasts
    expect(toast?.variant).toBe('error')
    expect(toast?.message).toBe('Something went wrong.')
  })

  it('shows warning toasts with validation messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: 'Test validation error.',
            errors: {
              test: ['Test validation error.'],
            },
          }),
          {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    )

    await expect(api.get('/api/test-errors/validation')).rejects.toBeInstanceOf(ApiError)

    const [toast] = useToastStore().toasts
    expect(toast?.variant).toBe('warning')
    expect(toast?.message).toBe('Test validation error.')
  })

  it('shows warning toasts for not found responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Test not found error.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(api.get('/api/test-errors/not-found')).rejects.toBeInstanceOf(ApiError)

    const [toast] = useToastStore().toasts
    expect(toast?.variant).toBe('warning')
    expect(toast?.message).toBe('Test not found error.')
  })

  it('fetches a csrf cookie and sends the xsrf header for posts', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => {
        return new Response(null, {
          status: 204,
          headers: {
            'set-cookie': 'XSRF-TOKEN=test-token%3Dvalue; path=/; SameSite=Lax',
          },
        })
      })
      .mockImplementationOnce(async () => {
        return new Response(JSON.stringify({ status: 'ok', count: 1 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

    vi.stubGlobal('fetch', fetchMock)

    const response = await api.post<{ status: string; count: number }>('/api/test-session', {})

    expect(response).toEqual({ status: 'ok', count: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://api.example.test/sanctum/csrf-cookie',
      expect.objectContaining({
        credentials: 'include',
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://api.example.test/api/test-session',
      expect.objectContaining({
        credentials: 'include',
        method: 'POST',
      }),
    )

    const requestHeaders = new Headers(fetchMock.mock.calls[1]?.[1]?.headers)
    expect(requestHeaders.get('X-XSRF-TOKEN')).toBe('test-token=value')
  })

  it('refreshes the csrf cookie and retries a mutation once after a 419', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => {
        return new Response(null, {
          status: 204,
          headers: {
            'set-cookie': 'XSRF-TOKEN=old-token; path=/; SameSite=Lax',
          },
        })
      })
      .mockImplementationOnce(async () => {
        return new Response(JSON.stringify({ message: 'CSRF token mismatch.' }), {
          status: 419,
          headers: { 'Content-Type': 'application/json' },
        })
      })
      .mockImplementationOnce(async () => {
        return new Response(null, {
          status: 204,
          headers: {
            'set-cookie': 'XSRF-TOKEN=new-token; path=/; SameSite=Lax',
          },
        })
      })
      .mockImplementationOnce(async () => {
        return new Response(JSON.stringify({ status: 'ok', count: 2 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      })

    vi.stubGlobal('fetch', fetchMock)

    const response = await api.post<{ status: string; count: number }>('/api/test-session', {})

    expect(response).toEqual({ status: 'ok', count: 2 })
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://api.example.test/sanctum/csrf-cookie',
      expect.objectContaining({
        credentials: 'include',
      }),
    )

    const firstRequestHeaders = new Headers(fetchMock.mock.calls[1]?.[1]?.headers)
    const retryRequestHeaders = new Headers(fetchMock.mock.calls[3]?.[1]?.headers)

    expect(firstRequestHeaders.get('X-XSRF-TOKEN')).toBe('old-token')
    expect(retryRequestHeaders.get('X-XSRF-TOKEN')).toBe('new-token')
    expect(useToastStore().toasts).toHaveLength(0)
  })

  it('throws after one csrf retry when the mutation still returns 419', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => {
        return new Response(null, {
          status: 204,
          headers: {
            'set-cookie': 'XSRF-TOKEN=old-token; path=/; SameSite=Lax',
          },
        })
      })
      .mockImplementationOnce(async () => {
        return new Response(JSON.stringify({ message: 'CSRF token mismatch.' }), {
          status: 419,
          headers: { 'Content-Type': 'application/json' },
        })
      })
      .mockImplementationOnce(async () => {
        return new Response(null, {
          status: 204,
          headers: {
            'set-cookie': 'XSRF-TOKEN=new-token; path=/; SameSite=Lax',
          },
        })
      })
      .mockImplementationOnce(async () => {
        return new Response(JSON.stringify({ message: 'CSRF token mismatch.' }), {
          status: 419,
          headers: { 'Content-Type': 'application/json' },
        })
      })

    vi.stubGlobal('fetch', fetchMock)

    await expect(api.post('/api/test-session', {})).rejects.toMatchObject({
      status: 419,
      message: 'CSRF token mismatch.',
    })

    expect(fetchMock).toHaveBeenCalledTimes(4)

    const [toast] = useToastStore().toasts
    expect(toast?.variant).toBe('warning')
    expect(toast?.message).toBe('CSRF token mismatch.')
  })

  it('does not retry get requests that return 419', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'CSRF token mismatch.' }), {
        status: 419,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    await expect(api.get('/api/user')).rejects.toMatchObject({
      status: 419,
      message: 'CSRF token mismatch.',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.example.test/api/user',
      expect.objectContaining({
        method: 'GET',
      }),
    )
  })
})
