import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNotificationStore } from './notifications'
import { useAuthStore } from './auth'

type EventCallback = (event: string, data: any) => void

export const useSSEStore = defineStore('sse', () => {
  const connected = ref(false)
  let source: EventSource | null = null
  const listeners = new Set<EventCallback>()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  function connect() {
    if (source) return

    source = new EventSource(`${apiUrl}/events`)
    const notify = useNotificationStore()

    source.addEventListener('connected', () => {
      connected.value = true
      console.log('[SSE] Conectado ao servidor')
    })

    source.addEventListener('file-updated', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        const auth = useAuthStore()
        const isMine = !data.userId || auth.user?.id === data.userId
        const name = data.name ? ` "${data.name}"` : ''
        if (isMine && data.status === 'concluido') {
          notify.success(`Projeto${name} processado com sucesso!`)
        } else if (isMine && data.status === 'erro') {
          notify.error(`Processamento de${name} falhou`)
        }
        listeners.forEach(cb => cb('file-updated', data))
      } catch {}
    })

    source.addEventListener('report-updated', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        const auth = useAuthStore()
        const isMine = !data.userId || auth.user?.id === data.userId
        const name = data.name ? ` "${data.name}"` : ''
        if (isMine && data.status === 'concluido') {
          notify.success(`Relatorio${name} gerado com sucesso!`)
        } else if (isMine && data.status === 'erro') {
          notify.error(`Geracao de${name} falhou`)
        }
        listeners.forEach(cb => cb('report-updated', data))
      } catch {}
    })

    source.onerror = () => {
      connected.value = false
      console.warn('[SSE] Conexao perdida, reconectando...')
      source?.close()
      source = null
      setTimeout(connect, 3000)
    }
  }

  function disconnect() {
    if (source) {
      source.close()
      source = null
      connected.value = false
    }
  }

  /** Inscrever para receber eventos (para atualizar dados na pagina) */
  function subscribe(cb: EventCallback) {
    listeners.add(cb)
    return () => listeners.delete(cb)
  }

  return { connected, connect, disconnect, subscribe }
})
