import api from './client'
import type { User } from '@/types'

export async function login(email: string, password: string): Promise<{ token: string }> {
  const { data } = await api.post('/users/login', { email, password })
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await api.get('/users/me')
  return data
}

export async function register(email: string, password: string, name: string) {
  const { data } = await api.post('/users/register', { email, password, name })
  return data
}

export async function changePassword(id: number, newPassword: string, oldPassword?: string) {
  const { data } = await api.patch('/users/change-password', { id, newPassword, oldPassword })
  return data
}
