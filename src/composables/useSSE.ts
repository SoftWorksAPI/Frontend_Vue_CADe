import { onMounted, onUnmounted } from 'vue'

/**
 * Conecta ao SSE (Server-Sent Events) do backend para receber atualizacoes em tempo real.
 * @param onEvent - Callback chamado quando um evento e recebido
 */
export function useSSE(onEvent: (event: string, data: any) => void) {
  let source: EventSource | null = null
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  function connect() {
    if (source) return

    source = new EventSource(`${apiUrl}/events`)

    source.addEventListener('connected', () => {
      console.log('[SSE] Conectado ao servidor')
    })

    source.addEventListener('file-updated', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        onEvent('file-updated', data)
      } catch {}
    })

    source.addEventListener('report-updated', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        onEvent('report-updated', data)
      } catch {}
    })

    source.onerror = () => {
      console.warn('[SSE] Conexao perdida, reconectando...')
      source?.close()
      source = null
      // Reconectar apos 3s
      setTimeout(connect, 3000)
    }
  }

  function disconnect() {
    if (source) {
      source.close()
      source = null
    }
  }

  onMounted(connect)
  onUnmounted(disconnect)

  return { connect, disconnect }
}
