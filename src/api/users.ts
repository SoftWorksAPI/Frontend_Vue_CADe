import api from './client'
import type { User, PaginatedResponse } from '@/types'

export async function listUsers(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
  const { data } = await api.get('/users/list', { params: { page, limit } })
  return data
}

export async function getUserById(id: number): Promise<User> {
  const { data } = await api.get(`/users/${id}`)
  return data
}

export async function updateUser(id: number, updates: Partial<User>) {
  const { data } = await api.patch(`/users/update/${id}`, updates)
  return data
}

export async function deleteUser(id: number) {
  const { data } = await api.delete(`/users/delete/${id}`)
  return data
}
