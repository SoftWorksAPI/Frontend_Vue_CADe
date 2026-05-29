import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Calcula quantos itens cabem na tela com base na altura disponivel.
 * @param rowHeight - altura estimada de cada linha em px (default 52)
 * @param offset - espaco ocupado por header, titulo, paginacao, padding em px (default 220)
 * @param min - minimo de itens por pagina (default 3)
 * @param max - maximo de itens por pagina (default 50)
 */
export function useAutoPaginate(rowHeight = 52, offset = 220, min = 3, max = 50) {
  const perPage = ref(10)

  function recalc() {
    const available = window.innerHeight - offset
    const count = Math.floor(available / rowHeight)
    perPage.value = Math.max(min, Math.min(max, count))
  }

  onMounted(() => {
    recalc()
    window.addEventListener('resize', recalc)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', recalc)
  })

  return { perPage }
}
