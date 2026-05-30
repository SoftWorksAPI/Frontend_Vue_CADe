import api from './client'
import type { HealthStatus, RagStatus } from '@/types'

export async function aiHealth(): Promise<HealthStatus> {
  const { data } = await api.get('/system/ai/health')
  return {
    online: data.online ?? data.status === 'online',
    provider: data.provider,
    modelo: data.modelo,
    tempo_resposta_ms: data.tempo_resposta_ms,
    erro: data.erro,
  }
}

export async function ragHealth(): Promise<RagStatus> {
  const { data } = await api.get('/system/rag/health')
  return data
}

export async function ragSync() {
  const { data } = await api.post('/system/rag/sync')
  return data
}
