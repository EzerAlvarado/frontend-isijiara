import { clearAuth, getStoredToken } from '../types/auth'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(message: string, status: number, details: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export interface ApiRequestOptions extends RequestInit {
  auth?: boolean
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = options
  const token = auth ? getStoredToken() : null

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...headers,
    },
  })

  const body = await parseBody(response)

  if (response.status === 401 && auth) {
    clearAuth()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'detail' in body
        ? String((body as { detail: unknown }).detail)
        : `Error ${response.status}`
    throw new ApiError(message, response.status, body)
  }

  return body as T
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
