import { useToastStore } from '@/stores/toasts'
import { pinia } from '@/plugins/pinia'

interface ApiRequestOptions extends RequestInit {
  suppressNotFoundToast?: boolean
}

interface ApiErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  status: number
  data: ApiErrorResponse | null

  constructor(status: number, message: string, data: ApiErrorResponse | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

const DEFAULT_SERVER_ERROR_MESSAGE = 'Something went wrong.'
let xsrfToken: string | null = null

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return sendRequest<T>(path, options, false, null)
}

async function sendRequest<T>(
  path: string,
  options: ApiRequestOptions,
  hasRetriedCsrf: boolean,
  refreshedCsrfToken: string | null,
): Promise<T> {
  const csrfToken = isMutationMethod(options.method)
    ? (refreshedCsrfToken ?? await ensureCsrfCookie())
    : null

  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    ...options,
    headers: mergeHeaders(
      {
        Accept: 'application/json',
        ...(csrfHeader(options.method, csrfToken) ?? {}),
      },
      options.headers,
    ),
  })

  if (shouldRetryWithFreshCsrf(response, options, hasRetriedCsrf)) {
    const freshCsrfToken = await refreshCsrfCookie()

    return sendRequest<T>(path, options, true, freshCsrfToken)
  }

  if (!response.ok) {
    const errorData = await parseJson<ApiErrorResponse>(response)

    if (response.status === 401) {
      await handleUnauthenticatedResponse()
    }

    handleErrorToast(response.status, errorData, options)

    throw new ApiError(response.status, errorData?.message ?? response.statusText, errorData)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await parseJson<T>(response)) as T
}

export const api = {
  get<T>(path: string, options?: ApiRequestOptions) {
    return request<T>(path, {
      ...options,
      method: 'GET',
    })
  },
  post<T>(path: string, body?: BodyInit | object | null, options?: ApiRequestOptions) {
    return request<T>(path, withBody('POST', body, options))
  },
  put<T>(path: string, body?: BodyInit | object | null, options?: ApiRequestOptions) {
    return request<T>(path, withBody('PUT', body, options))
  },
  patch<T>(path: string, body?: BodyInit | object | null, options?: ApiRequestOptions) {
    return request<T>(path, withBody('PATCH', body, options))
  },
  delete<T>(path: string, options?: ApiRequestOptions) {
    return request<T>(path, {
      ...options,
      method: 'DELETE',
    })
  },
}

function withBody(
  method: 'POST' | 'PUT' | 'PATCH',
  body?: BodyInit | object | null,
  options: ApiRequestOptions = {},
) {
  if (body == null || body instanceof FormData || typeof body === 'string') {
    return {
      ...options,
      method,
      body: body ?? undefined,
    }
  }

  return {
    ...options,
    method,
    body: JSON.stringify(body),
    headers: mergeHeaders(
      {
        'Content-Type': 'application/json',
      },
      options.headers,
    ),
  }
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${apiBaseUrl()}${normalizedPath}`
}

function apiBaseUrl() {
  return import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
}

async function ensureCsrfCookie() {
  const token = resolveXsrfToken()

  if (token) {
    return token
  }

  return refreshCsrfCookie()
}

async function refreshCsrfCookie() {
  xsrfToken = null

  const response = await fetch(`${apiBaseUrl()}/sanctum/csrf-cookie`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await parseJson<ApiErrorResponse>(response)
    handleErrorToast(response.status, errorData, {})

    throw new ApiError(response.status, errorData?.message ?? response.statusText, errorData)
  }

  xsrfToken = extractXsrfToken(response) ?? readXsrfCookie()

  return xsrfToken
}

function shouldRetryWithFreshCsrf(
  response: Response,
  options: ApiRequestOptions,
  hasRetriedCsrf: boolean,
) {
  return response.status === 419 && isMutationMethod(options.method) && !hasRetriedCsrf
}

function mergeHeaders(base: HeadersInit, overrides?: HeadersInit) {
  const headers = new Headers(base)

  new Headers(overrides).forEach((value, key) => {
    headers.set(key, value)
  })

  return headers
}

function isMutationMethod(method?: string) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes((method ?? '').toUpperCase())
}

function csrfHeader(method?: string, token = resolveXsrfToken()) {
  if (!isMutationMethod(method)) {
    return null
  }

  if (!token) {
    return null
  }

  return {
    'X-XSRF-TOKEN': token,
  }
}

async function parseJson<T>(response: Response) {
  const contentType = response.headers.get('content-type')

  if (!contentType || !contentType.includes('application/json')) {
    return null
  }

  return (await response.json()) as T
}

function handleErrorToast(
  status: number,
  data: ApiErrorResponse | null,
  options: ApiRequestOptions,
) {
  const toastStore = useToastStore(pinia)

  if (status === 401) {
    return
  }

  if (status >= 500) {
    toastStore.error(DEFAULT_SERVER_ERROR_MESSAGE, 'Server error')
    return
  }

  if (status === 422) {
    const message = collectValidationMessages(data)
    toastStore.warning(message, 'Validation error')
    return
  }

  if (status === 404 && options.suppressNotFoundToast) {
    return
  }

  if (status === 404) {
    toastStore.warning(data?.message ?? 'The requested resource was not found.', 'Not found')
    return
  }

  toastStore.warning(data?.message ?? 'Request failed.', 'Request issue')
}

async function handleUnauthenticatedResponse() {
  const [{ useAuthStore }, { default: router }] = await Promise.all([
    import('@/stores/auth'),
    import('@/router'),
  ])
  const authStore = useAuthStore(pinia)
  const toastStore = useToastStore(pinia)

  authStore.clearCurrentUser()
  toastStore.warning('Please Login')

  if (router.currentRoute.value.name !== 'login') {
    await router.push({ name: 'login' })
  }
}

function collectValidationMessages(data: ApiErrorResponse | null) {
  const messages = Object.values(data?.errors ?? {}).flat().filter(Boolean)

  if (messages.length > 0) {
    return messages.join(' ')
  }

  return data?.message ?? 'Validation failed.'
}

function readCookie(name: string) {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))

  if (!cookie) {
    return null
  }

  return cookie.slice(name.length + 1)
}

function resolveXsrfToken() {
  const cookieToken = readXsrfCookie()

  if (!cookieToken && xsrfToken) {
    xsrfToken = null
  }

  if (!cookieToken) {
    return null
  }

  if (xsrfToken !== cookieToken) {
    xsrfToken = cookieToken
  }

  return xsrfToken
}

function readXsrfCookie() {
  const token = readCookie('XSRF-TOKEN')

  return token ? decodeURIComponent(token) : null
}

function extractXsrfToken(response: Response) {
  const setCookieHeaders = readSetCookieHeaders(response)

  for (const header of setCookieHeaders) {
    const token = parseXsrfTokenFromSetCookie(header)

    if (token) {
      return token
    }
  }

  return null
}

function readSetCookieHeaders(response: Response) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[]
  }

  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie()
  }

  const setCookie = headers.get('set-cookie')

  return setCookie ? splitSetCookieHeader(setCookie) : []
}

function splitSetCookieHeader(header: string) {
  return header.split(/,(?=\s*[^;,=\s]+=)/)
}

function parseXsrfTokenFromSetCookie(header: string) {
  const match = header.match(/(?:^|;\s*|,\s*)XSRF-TOKEN=([^;]+)/)

  if (!match?.[1]) {
    return null
  }

  return decodeURIComponent(match[1])
}
