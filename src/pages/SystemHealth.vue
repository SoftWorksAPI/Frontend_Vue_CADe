<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { aiHealth, ragHealth, ragSync } from '@/api/system'
import { useNotificationStore } from '@/stores/notifications'
import StatusBadge from '@/components/StatusBadge.vue'
import type { HealthStatus, RagStatus } from '@/types'

const notify = useNotificationStore()

const ai = ref<HealthStatus | null>(null)
const rag = ref<RagStatus | null>(null)
const loading = ref(true)
const syncing = ref(false)

async function loadHealth() {
  loading.value = true
  try {
    const [aiRes, ragRes] = await Promise.allSettled([aiHealth(), ragHealth()])
    if (aiRes.status === 'fulfilled') ai.value = aiRes.value
    if (ragRes.status === 'fulfilled') rag.value = ragRes.value
  } finally {
    loading.value = false
  }
}

async function handleSync() {
  syncing.value = true
  try {
    const result = await ragSync()
    notify.success(`RAG sincronizado: ${result.normas_sincronizadas || 0} normas, ${result.total_chunks || 0} chunks`)
    await loadHealth()
  } catch (err: any) {
    notify.error(err.response?.data?.message || 'Erro ao sincronizar RAG')
  } finally {
    syncing.value = false
  }
}

onMounted(loadHealth)
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Saude do Sistema</h1>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent"></div>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-800">Inteligencia Artificial</h2>
          <StatusBadge v-if="ai" :status="ai.online ? 'online' : 'offline'" />
        </div>
        <div v-if="ai?.online" class="space-y-3">
          <div v-if="ai.modelo" class="flex justify-between">
            <span class="text-sm text-gray-500">Modelo</span>
            <span class="text-sm font-medium">{{ ai.modelo }}</span>
          </div>
          <div v-if="ai.tempo_resposta_ms" class="flex justify-between">
            <span class="text-sm text-gray-500">Tempo de resposta</span>
            <span class="text-sm font-medium">{{ ai.tempo_resposta_ms }}ms</span>
          </div>
        </div>
        <div v-else-if="ai?.erro" class="rounded-lg bg-red-50 p-4">
          <p class="text-sm text-red-600">{{ ai.erro }}</p>
        </div>
        <div v-else class="text-sm text-gray-400">Servico indisponivel</div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-800">RAG (ChromaDB)</h2>
          <StatusBadge :status="rag?.status === 'ok' ? 'online' : 'offline'" />
        </div>
        <div v-if="rag?.status === 'ok'" class="space-y-3">
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Total de chunks</span>
            <span class="text-sm font-medium">{{ rag.total_chunks ?? 0 }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Normas indexadas</span>
            <span class="text-sm font-medium">{{ rag.normas_indexadas ?? 0 }}</span>
          </div>
        </div>
        <div v-else-if="rag?.erro" class="rounded-lg bg-red-50 p-4">
          <p class="text-sm text-red-600">{{ rag.erro }}</p>
        </div>
        <div v-else class="text-sm text-gray-400">Servico indisponivel</div>
        <div class="mt-4">
          <button @click="handleSync" :disabled="syncing"
            class="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
            {{ syncing ? 'Sincronizando...' : 'Sincronizar Normas' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
