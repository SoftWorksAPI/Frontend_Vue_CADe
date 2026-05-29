import api from './client'
import type { FileRecord, PaginatedResponse } from '@/types'

export async function uploadFile(file: File, description?: string): Promise<FileRecord> {
  const formData = new FormData()
  formData.append('file', file)
  if (description) formData.append('description', description)
  const { data } = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export async function listFiles(page = 1, limit = 10): Promise<PaginatedResponse<FileRecord>> {
  const { data } = await api.get('/files', { params: { page, limit } })
  return data
}

export async function getFileById(id: number): Promise<FileRecord> {
  const { data } = await api.get(`/files/${id}`)
  return data
}

export async function deleteFile(id: number) {
  const { data } = await api.delete(`/files/${id}`)
  return data
}

export async function replaceFile(fileId: number, file: File): Promise<FileRecord> {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.patch(`/files/${fileId}/replace`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data.file || data
}

export async function addMarkdown(id: number, markdownContent: string) {
  const { data } = await api.patch(`/files/${id}/markdown`, { markdownContent })
  return data
}
