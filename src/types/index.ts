export interface User {
  id: number
  name: string
  email: string
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

export interface FileRecord {
  id: number
  title: string | null
  originalName: string
  filename: string
  filePath: string
  fileSize: number
  userId: number
  description: string | null
  markdownContent: string | null
  processingStatus: 'idle' | 'processando' | 'gerando' | 'concluido' | 'erro'
  createdAt: string
  updatedAt: string
  User?: User
}

export interface Report {
  id: number
  title: string
  fileId: number
  userId: number
  filePath: string | null
  fileType: string | null
  confianca: string | null
  numInconsistencias: number
  status: string
  tentativasRevisao: number
  review: string | null
  createdAt: string
  updatedAt: string
  File?: { id: number; title: string | null; originalName: string; filename: string; filePath?: string }
  User?: User
}

export interface NormFile {
  id: number
  title: string
  description: string | null
  category: string
  originalName: string
  filename: string
  filePath: string
  fileSize: number
  fileType: string
  ativo: boolean
  userId: number
  createdAt: string
  updatedAt: string
  User?: User
}

export interface Column {
  key: string
  label: string
  format?: (value: any, row?: any) => string
}

export interface Pagination {
  total: number
  page: number
  limit: number
  pages: number
}

export interface PaginatedResponse<T> {
  files?: T[]
  reports?: T[]
  normFiles?: T[]
  users?: T[]
  pagination?: Pagination
  total?: number
  page?: number
  pages?: number
}

export interface ProcessResult {
  sucesso: boolean
  memorial_descritivo: Record<string, any>
  dados_extracao: Record<string, any>
  confianca: string
  num_inconsistencias: number
  relatorio_md?: string
  relatorio_pdf?: string
  revisao?: string
  erro?: string
}

export interface HealthStatus {
  online: boolean
  modelo?: string
  tempo_resposta_ms?: number
  erro?: string
}

export interface RagStatus {
  status: string
  total_chunks: number
  normas_indexadas: string[]
  caminho: string
  erro?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
