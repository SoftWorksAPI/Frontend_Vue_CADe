import api from './client'
import type { ProcessResult } from '@/types'

export async function processFile(fileId: number): Promise<ProcessResult> {
  const { data } = await api.post(`/processing/${fileId}/process`)
  return data
}

export async function generatePdf(fileId: number, timeout = 180000): Promise<Blob> {
  const { data } = await api.post(`/processing/${fileId}/relatorio/pdf`, null, {
    params: { timeout },
    responseType: 'blob'
  })
  return data
}

export async function generateMarkdown(fileId: number, timeout = 180000): Promise<Blob> {
  const { data } = await api.post(`/processing/${fileId}/relatorio/markdown`, null, {
    params: { timeout },
    responseType: 'blob'
  })
  return data
}

export async function generateXlsx(fileId: number, timeout = 180000): Promise<Blob> {
  const { data } = await api.post(`/processing/${fileId}/relatorio/xlsx`, null, {
    params: { timeout },
    responseType: 'blob'
  })
  return data
}
