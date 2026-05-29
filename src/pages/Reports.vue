<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { listReports, deleteReport, downloadReport } from '@/api/reports'
import { useNotificationStore } from '@/stores/notifications'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { Report } from '@/types'

const router = useRouter()
const notify = useNotificationStore()

const reports = ref<Report[]>([])
const loading = ref(true)
const deleteTarget = ref<Report | null>(null)

async function loadReports(showSpinner = true) {
  if (showSpinner) loading.value = true
  try {
    reports.value = await listReports()
  } catch {
    if (showSpinner) notify.error('Erro ao carregar relatorios')
  } finally {
    if (showSpinner) loading.value = false
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await deleteReport(deleteTarget.value.id)
    notify.success('Relatorio deletado com sucesso')
    deleteTarget.value = null
    await loadReports()
  } catch {
    notify.error('Erro ao deletar relatorio')
  }
}

const downloadingId = ref<number | null>(null)

async function handleDownload(report: Report) {
  downloadingId.value = report.id
  try {
    await downloadReport(report.id, report.title)
    notify.success('Download concluido')
  } catch {
    notify.error('Erro ao baixar relatorio')
  } finally {
    downloadingId.value = null
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

let pollInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  loadReports()
  pollInterval = setInterval(() => loadReports(false), 10000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Relatorios</h1>

    <div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
      <table v-else class="w-full text-left text-sm">
        <thead class="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            <th class="px-4 py-3 font-semibold">Titulo</th>
            <th class="px-4 py-3 font-semibold">Projeto</th>
            <th class="px-4 py-3 font-semibold">Enviado por</th>
            <th class="px-4 py-3 font-semibold">Formato</th>
            <th class="px-4 py-3 font-semibold">Confianca</th>
            <th class="px-4 py-3 font-semibold">Status</th>
            <th class="px-4 py-3 font-semibold">Data</th>
            <th class="px-4 py-3 font-semibold">Acoes</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="reports.length === 0">
            <td colspan="8" class="px-4 py-8 text-center text-gray-400">Nenhum relatorio encontrado</td>
          </tr>
          <tr v-for="report in reports" :key="report.id" class="cursor-pointer transition-colors hover:bg-gray-50"
            @click="router.push(`/reports/${report.id}`)">
            <td class="px-4 py-3 font-medium text-gray-800">{{ report.title }}</td>
            <td class="px-4 py-3 text-gray-600">{{ report.File?.originalName || '-' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ report.User?.name || '-' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ report.fileType?.toUpperCase() || '-' }}</td>
            <td class="px-4 py-3"><StatusBadge v-if="report.confianca" :status="report.confianca" /></td>
            <td class="px-4 py-3"><StatusBadge :status="report.status" /></td>
            <td class="px-4 py-3 text-gray-600">{{ formatDate(report.createdAt) }}</td>
            <td class="px-4 py-3">
              <button v-if="report.filePath && (report.fileType === 'pdf' || report.fileType === 'xlsx' || report.fileType === 'md')"
                @click.stop="handleDownload(report)"
                :disabled="downloadingId === report.id"
                class="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                title="Baixar arquivo">
                {{ downloadingId === report.id ? 'Baixando...' : 'Download' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmDialog v-if="deleteTarget" title="Deletar Relatorio"
      :message="`Tem certeza que deseja deletar '${deleteTarget.title}'?`" confirm-text="Deletar" :danger="true"
      @confirm="handleDelete" @cancel="deleteTarget = null" />
  </div>
</template>
