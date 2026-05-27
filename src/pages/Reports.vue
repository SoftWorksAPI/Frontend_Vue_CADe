<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listReports, deleteReport } from '@/api/reports'
import { useNotificationStore } from '@/stores/notifications'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { Report } from '@/types'

const router = useRouter()
const notify = useNotificationStore()

const reports = ref<Report[]>([])
const loading = ref(true)
const deleteTarget = ref<Report | null>(null)

async function loadReports() {
  loading.value = true
  try {
    reports.value = await listReports()
  } catch {
    notify.error('Erro ao carregar relatorios')
  } finally {
    loading.value = false
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

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

onMounted(loadReports)
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
            <th class="px-4 py-3 font-semibold">Formato</th>
            <th class="px-4 py-3 font-semibold">Confianca</th>
            <th class="px-4 py-3 font-semibold">Status</th>
            <th class="px-4 py-3 font-semibold">Data</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="reports.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Nenhum relatorio encontrado</td>
          </tr>
          <tr v-for="report in reports" :key="report.id" class="cursor-pointer transition-colors hover:bg-gray-50"
            @click="router.push(`/reports/${report.id}`)">
            <td class="px-4 py-3 font-medium text-gray-800">{{ report.title }}</td>
            <td class="px-4 py-3 text-gray-600">{{ report.File?.originalName || '-' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ report.fileType?.toUpperCase() || '-' }}</td>
            <td class="px-4 py-3"><StatusBadge v-if="report.confianca" :status="report.confianca" /></td>
            <td class="px-4 py-3"><StatusBadge :status="report.status" /></td>
            <td class="px-4 py-3 text-gray-600">{{ formatDate(report.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmDialog v-if="deleteTarget" title="Deletar Relatorio"
      :message="`Tem certeza que deseja deletar '${deleteTarget.title}'?`" confirm-text="Deletar" :danger="true"
      @confirm="handleDelete" @cancel="deleteTarget = null" />
  </div>
</template>
