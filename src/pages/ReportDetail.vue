<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getReportById, deleteReport } from '@/api/reports'
import { useNotificationStore } from '@/stores/notifications'
import MarkdownViewer from '@/components/MarkdownViewer.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Report } from '@/types'

const route = useRoute()
const router = useRouter()
const notify = useNotificationStore()

const report = ref<Report | null>(null)
const loading = ref(true)
const showDeleteConfirm = ref(false)

const reportId = Number(route.params.id)
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function loadReport() {
  loading.value = true
  try {
    report.value = await getReportById(reportId)
  } catch {
    notify.error('Erro ao carregar relatorio')
    router.push('/reports')
  } finally {
    loading.value = false
  }
}

async function handleDelete() {
  try {
    await deleteReport(reportId)
    notify.success('Relatorio deletado com sucesso')
    router.push('/reports')
  } catch {
    notify.error('Erro ao deletar relatorio')
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString('pt-BR')
}

onMounted(loadReport)
</script>

<template>
  <div v-if="loading" class="flex justify-center py-12">
    <div class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent"></div>
  </div>

  <div v-else-if="report" class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <button @click="router.push('/reports')" class="mb-2 text-sm text-gray-500 hover:text-gray-700">&larr; Voltar</button>
        <h1 class="text-2xl font-bold text-gray-900">{{ report.title }}</h1>
        <div class="mt-2 flex items-center gap-3">
          <StatusBadge v-if="report.confianca" :status="report.confianca" />
          <StatusBadge :status="report.status" />
          <span class="text-sm text-gray-500">{{ report.fileType?.toUpperCase() }}</span>
        </div>
      </div>
      <div class="flex gap-2">
        <a v-if="report.filePath" :href="`${apiBaseUrl}${report.filePath}`" target="_blank"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
          {{ report.fileType === 'pdf' ? 'Abrir PDF' : report.fileType === 'json' ? 'Abrir JSON' : 'Baixar' }}
        </a>
        <button
          @click="showDeleteConfirm = true"
          class="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          Deletar
        </button>
      </div>
    </div>

    <!-- Info -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <p class="text-xs font-medium text-gray-500">Arquivo</p>
        <p class="mt-1 text-sm font-semibold">{{ report.File?.originalName || '-' }}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <p class="text-xs font-medium text-gray-500">Formato</p>
        <p class="mt-1 text-sm font-semibold">{{ report.fileType?.toUpperCase() || '-' }}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <p class="text-xs font-medium text-gray-500">Inconsistencias</p>
        <p class="mt-1 text-sm font-semibold">{{ report.numInconsistencias ?? 0 }}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <p class="text-xs font-medium text-gray-500">Data</p>
        <p class="mt-1 text-sm font-semibold">{{ formatDate(report.createdAt) }}</p>
      </div>
    </div>

    <!-- Review -->
    <div v-if="report.review" class="rounded-xl border border-gray-200 bg-white p-5">
      <h2 class="mb-4 text-lg font-semibold text-gray-800">Revisao da IA</h2>
      <MarkdownViewer :content="report.review" />
    </div>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-if="showDeleteConfirm"
      title="Deletar Relatorio"
      :message="`Tem certeza que deseja deletar '${report.title}'?`"
      confirm-text="Deletar"
      :danger="true"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>
