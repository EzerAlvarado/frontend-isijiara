import { apiRequest } from './client'
import type { AuthUser, LoginResponse } from '../types/auth'

export async function loginApi(username: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    auth: false,
  })
}

export async function logoutApi(): Promise<void> {
  await apiRequest('/auth/logout/', { method: 'POST' })
}

export async function fetchMe(): Promise<{ usuario: AuthUser; lineaNegocio: string }> {
  return apiRequest('/auth/me/')
}
