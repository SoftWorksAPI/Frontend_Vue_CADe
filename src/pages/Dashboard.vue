<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { listFiles } from '@/api/files'
import { listReports } from '@/api/reports'
import { aiHealth } from '@/api/system'
import StatusBadge from '@/components/StatusBadge.vue'
import type { FileRecord, Report } from '@/types'

const auth = useAuthStore()

const files = ref<FileRecord[]>([])
const reports = ref<Report[]>([])
const aiStatus = ref<string>('offline')
const loading = ref(true)

onMounted(async () => {
  try {
    const [filesRes, reportsRes, healthRes] = await Promise.allSettled([
      listFiles(1, 5),
      listReports(),
      aiHealth()
    ])

    if (filesRes.status === 'fulfilled') files.value = filesRes.value.files || []
    if (reportsRes.status === 'fulfilled') reports.value = (reportsRes.value || []).slice(0, 5)
    if (healthRes.status === 'fulfilled') aiStatus.value = healthRes.value.online ? 'online' : 'offline'
  } finally {
    loading.value = false
  }
})

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <p class="text-sm font-medium text-gray-500">Arquivos DXF</p>
        <p class="mt-1 text-3xl font-bold text-[var(--color-primary)]">{{ files.length }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <p class="text-sm font-medium text-gray-500">Relatorios</p>
        <p class="mt-1 text-3xl font-bold text-[var(--color-primary)]">{{ reports.length }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <p class="text-sm font-medium text-gray-500">Status IA</p>
        <div class="mt-2"><StatusBadge :status="aiStatus" /></div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <div class="h-6 w-6 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent"></div>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-800">Arquivos Recentes</h2>
          <router-link to="/files" class="text-sm text-[var(--color-primary)] hover:underline">Ver todos</router-link>
        </div>
        <div v-if="files.length === 0" class="py-8 text-center text-sm text-gray-400">Nenhum arquivo enviado</div>
        <div v-else class="space-y-3">
          <router-link v-for="file in files" :key="file.id" :to="`/files/${file.id}`"
            class="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50">
            <div>
              <p class="text-sm font-medium text-gray-800">{{ file.originalName }}</p>
              <p class="text-xs text-gray-400">{{ formatDate(file.createdAt) }}</p>
            </div>
            <span class="text-xs text-gray-500">{{ formatBytes(file.fileSize) }}</span>
          </router-link>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-800">Relatorios Recentes</h2>
          <router-link to="/reports" class="text-sm text-[var(--color-primary)] hover:underline">Ver todos</router-link>
        </div>
        <div v-if="reports.length === 0" class="py-8 text-center text-sm text-gray-400">Nenhum relatorio gerado</div>
        <div v-else class="space-y-3">
          <router-link v-for="report in reports" :key="report.id" :to="`/reports/${report.id}`"
            class="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50">
            <div>
              <p class="text-sm font-medium text-gray-800">{{ report.title }}</p>
              <p class="text-xs text-gray-400">{{ formatDate(report.createdAt) }}</p>
            </div>
            <StatusBadge v-if="report.confianca" :status="report.confianca" />
          </router-link>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-gray-200 bg-white p-5">
      <h2 class="mb-4 text-lg font-semibold text-gray-800">Acoes Rapidas</h2>
      <div class="flex flex-wrap gap-3">
        <router-link to="/files"
          class="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-light)]">
          Enviar Arquivo DXF
        </router-link>
        <router-link to="/reports"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Ver Relatorios
        </router-link>
      </div>
    </div>
  </div>
</template>
