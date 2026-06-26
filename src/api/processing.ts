import api from './client'
import type { ProcessResult } from '@/types'

/**
 * Dispara processamento DXF (fire-and-forget).
 * Retorna 202 imediatamente. O resultado chega via SSE.
 */
export async function processFile(fileId: number): Promise<ProcessResult> {
  const { data } = await api.post(`/processing/${fileId}/process`)
  return data
}

/**
 * Dispara geracao de relatorio (fire-and-forget).
 * Retorna 202 imediatamente. O resultado chega via SSE.
 */
export async function generatePdf(fileId: number): Promise<{ status: string; reportId: number }> {
  const { data } = await api.post(`/processing/${fileId}/relatorio/pdf`)
  return data
}

export async function generateMarkdown(fileId: number): Promise<{ status: string; reportId: number }> {
  const { data } = await api.post(`/processing/${fileId}/relatorio/markdown`)
  return data
}

export async function generateXlsx(fileId: number): Promise<{ status: string; reportId: number }> {
  const { data } = await api.post(`/processing/${fileId}/relatorio/xlsx`)
  return data
}
