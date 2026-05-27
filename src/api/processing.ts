import api from './client'
import type { ProcessResult } from '@/types'

export async function processFile(fileId: number): Promise<ProcessResult> {
  const { data } = await api.post(`/processing/${fileId}/process`)
  return data
}

/**
 * Helper para tratar respostas blob que podem conter erros JSON.
 * O Axios com responseType: 'blob' lê erros como Blob, impossibilitando
 * ler a mensagem de erro. Este helper faz o parse manualmente.
 */
async function requestBlob(url: string): Promise<Blob> {
  const response = await api.post(url, {}, {
    responseType: 'arraybuffer',
    validateStatus: () => true,
  })

  if (response.status >= 200 && response.status < 300) {
    return new Blob([response.data])
  }

  // Tentar parsear o erro como JSON
  const decoder = new TextDecoder('utf-8')
  const text = decoder.decode(response.data)
  try {
    const json = JSON.parse(text)
    throw { response: { data: json, status: response.status } }
  } catch (e: any) {
    if (e.response) throw e
    throw { response: { data: { message: text || `Erro HTTP ${response.status}` }, status: response.status } }
  }
}

export async function generatePdf(fileId: number): Promise<Blob> {
  return requestBlob(`/processing/${fileId}/relatorio/pdf`)
}

export async function generateMarkdown(fileId: number): Promise<Blob> {
  return requestBlob(`/processing/${fileId}/relatorio/markdown`)
}

export async function generateXlsx(fileId: number): Promise<Blob> {
  return requestBlob(`/processing/${fileId}/relatorio/xlsx`)
}
