import api from './client'
import type { ChatMessage } from '@/types'

export interface ChatResponse {
  resposta: string
}

export async function sendChatMessage(
  fileId: number,
  pergunta: string,
  historico: ChatMessage[] = []
): Promise<ChatResponse> {
  const { data } = await api.post('/chat', { fileId, pergunta, historico })
  return data
}
