import { onMounted, onUnmounted } from 'vue'
import { useSSEStore } from '@/stores/sse'

/**
 * Inscreve um callback para receber eventos SSE.
 * A conexao global e gerenciada pelo store no App.vue.
 * @param onEvent - Callback chamado quando um evento e recebido
 */
export function useSSE(onEvent: (event: string, data: any) => void) {
  const sse = useSSEStore()
  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    unsubscribe = sse.subscribe(onEvent)
  })

  onUnmounted(() => {
    unsubscribe?.()
  })
}
