import api from './client'
import type { Report } from '@/types'

export async function listReports(fileId?: number): Promise<Report[]> {
  const params: Record<string, any> = {}
  if (fileId) params.fileId = fileId
  const { data } = await api.get('/reports', { params })
  return data
}

export async function getReportById(id: number): Promise<Report> {
  const { data } = await api.get(`/reports/${id}`)
  return data
}

export async function deleteReport(id: number) {
  const { data } = await api.delete(`/reports/${id}`)
  return data
}

export async function createReport(file: File, title: string, fileId: number): Promise<Report> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', title)
  formData.append('fileId', String(fileId))
  const { data } = await api.post('/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}
