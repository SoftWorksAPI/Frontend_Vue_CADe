import api from './client'
import type { NormFile, PaginatedResponse } from '@/types'

export async function uploadNormFile(file: File, title: string, category: string, description?: string): Promise<NormFile> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', title)
  formData.append('category', category)
  if (description) formData.append('description', description)
  const { data } = await api.post('/norm-files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export async function listNormFiles(page = 1, limit = 10, category?: string): Promise<PaginatedResponse<NormFile>> {
  const params: Record<string, any> = { page, limit }
  if (category) params.category = category
  const { data } = await api.get('/norm-files', { params })
  return data
}

export async function getNormFileById(id: number): Promise<NormFile> {
  const { data } = await api.get(`/norm-files/${id}`)
  return data
}

export async function updateNormFile(id: number, updates: { title?: string; category?: string }) {
  const { data } = await api.patch(`/norm-files/${id}`, updates)
  return data
}

export async function toggleAtivo(id: number) {
  const { data } = await api.patch(`/norm-files/${id}/toggle-ativo`)
  return data
}

export async function deleteNormFile(id: number) {
  const { data } = await api.delete(`/norm-files/${id}`)
  return data
}
