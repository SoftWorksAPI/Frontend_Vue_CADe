import api from './client'
import type { ChatMessage } from '@/types'

export interface ChatReferencia {
  tipo: string
  itens: string[]
}

export interface ChatResponse {
  resposta: string
  sugestoes: string[]
  referencias: ChatReferencia[]
}

export async function sendChatMessage(
  fileId: number,
  pergunta: string,
  historico: ChatMessage[] = []
): Promise<ChatResponse> {
  const { data } = await api.post('/chat', { fileId, pergunta, historico })
  return data
}
