import api from './client'
import type { Report } from '@/types'

export async function listReports(fileId?: number, page = 1, limit = 20): Promise<{ reports: Report[], pagination: { total: number, page: number, limit: number, pages: number } }> {
  const params: Record<string, any> = { page, limit }
  if (fileId) params.fileId = fileId
  const { data } = await api.get('/reports', { params })
  return {
    reports: data.reports || [],
    pagination: data.pagination || { total: 0, page: 1, limit, pages: 0 },
  }
}

export async function getReportById(id: number): Promise<Report> {
  const { data } = await api.get(`/reports/${id}`)
  return data.report || data
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

export async function downloadReport(id: number, filename?: string): Promise<void> {
  const response = await api.get(`/reports/${id}/download`, {
    responseType: 'blob',
  })

  // Extrair nome do arquivo do header Content-Disposition
  const contentDisposition = response.headers['content-disposition']
  let downloadFilename = filename || 'relatorio'
  if (contentDisposition) {
    // Tentar extrair filename*= (UTF-8) primeiro
    const utf8Match = contentDisposition.match(/filename\*=UTF-8''(.+)/i)
    if (utf8Match) {
      downloadFilename = decodeURIComponent(utf8Match[1])
    } else {
      // Fallback para filename="..."
      const match = contentDisposition.match(/filename="?([^";\n]+)"?/)
      if (match) downloadFilename = match[1].trim()
    }
  }

  // Criar link temporario e clicar para download
  const blob = new Blob([response.data], { type: response.headers['content-type'] })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = downloadFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
