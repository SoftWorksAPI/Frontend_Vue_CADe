import api from './client'

export interface AIConfig {
  provider: 'openrouter' | 'ollama'
  model: string
  apiKey: string
  baseUrl: string
}

export interface AITestResult {
  status: string
  provider?: string
  modelo?: string
  resposta?: string
  erro?: string
}

export async function getAIConfig(): Promise<AIConfig> {
  const { data } = await api.get('/system/ai-config')
  return data
}

export async function updateAIConfig(config: Partial<AIConfig>): Promise<AIConfig> {
  const { data } = await api.put('/system/ai-config', config)
  return data
}

export async function testAIConnection(): Promise<AITestResult> {
  const { data } = await api.post('/system/ai/test')
  return data
}
