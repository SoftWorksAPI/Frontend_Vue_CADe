<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getFileById, deleteFile } from '@/api/files'
import { listReports } from '@/api/reports'
import { processFile, generatePdf, generateMarkdown, generateXlsx } from '@/api/processing'
import { useNotificationStore } from '@/stores/notifications'
import MarkdownViewer from '@/components/MarkdownViewer.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { FileRecord, Report, ProcessResult } from '@/types'

const route = useRoute()
const router = useRouter()
const notify = useNotificationStore()

const file = ref<FileRecord | null>(null)
const reports = ref<Report[]>([])
const loading = ref(true)
const processing = ref(false)
const processResult = ref<ProcessResult | null>(null)
const showDeleteConfirm = ref(false)
const downloading = ref<string | null>(null)

const fileId = Number(route.params.id)

async function loadFile() {
  loading.value = true
  try {
    const [fileData, reportsData] = await Promise.all([
      getFileById(fileId),
      listReports(fileId)
    ])
    file.value = fileData
    reports.value = reportsData || []
  } catch {
    notify.error('Erro ao carregar arquivo')
    router.push('/files')
  } finally {
    loading.value = false
  }
}

async function handleProcess() {
  processing.value = true
  processResult.value = null
  try {
    const result = await processFile(fileId)
    processResult.value = result
    if (result.sucesso) {
      notify.success('Arquivo processado com sucesso')
      await loadFile()
    } else {
      notify.warning('Processamento concluido com avisos')
    }
  } catch (err: any) {
    notify.error(err.response?.data?.message || 'Erro ao processar arquivo')
  } finally {
    processing.value = false
  }
}

async function handleDownload(type: 'pdf' | 'markdown' | 'xlsx') {
  downloading.value = type
  try {
    let blob: Blob
    let filename: string
    if (type === 'pdf') {
      blob = await generatePdf(fileId)
      filename = `${file.value?.originalName || 'relatorio'}.pdf`
    } else if (type === 'markdown') {
      blob = await generateMarkdown(fileId)
      filename = `${file.value?.originalName || 'relatorio'}.md`
    } else {
      blob = await generateXlsx(fileId)
      filename = `${file.value?.originalName || 'relatorio'}.xlsx`
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    notify.success(`Relatorio ${type.toUpperCase()} gerado com sucesso`)
  } catch (err: any) {
    notify.error(err.response?.data?.message || `Erro ao gerar ${type.toUpperCase()}`)
  } finally {
    downloading.value = null
  }
}

async function handleDelete() {
  try {
    await deleteFile(fileId)
    notify.success('Arquivo deletado com sucesso')
    router.push('/files')
  } catch {
    notify.error('Erro ao deletar arquivo')
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString('pt-BR')
}

onMounted(loadFile)
</script>

<template>
  <div v-if="loading" class="flex justify-center py-12">
    <div class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent"></div>
  </div>

  <div v-else-if="file" class="space-y-6">
    <div class="flex items-start justify-between">
      <div>
        <button @click="router.push('/files')" class="mb-2 text-sm text-gray-500 hover:text-gray-700">&larr; Voltar</button>
        <h1 class="text-2xl font-bold text-gray-900">{{ file.originalName }}</h1>
        <p class="mt-1 text-sm text-gray-500">{{ file.description || 'Sem descricao' }}</p>
      </div>
      <button @click="showDeleteConfirm = true" class="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50">Deletar</button>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <p class="text-xs font-medium text-gray-500">Tamanho</p>
        <p class="mt-1 text-lg font-semibold">{{ formatBytes(file.fileSize) }}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <p class="text-xs font-medium text-gray-500">Enviado em</p>
        <p class="mt-1 text-lg font-semibold">{{ formatDate(file.createdAt) }}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <p class="text-xs font-medium text-gray-500">Relatorios</p>
        <p class="mt-1 text-lg font-semibold">{{ reports.length }}</p>
      </div>
    </div>

    <div class="rounded-xl border border-gray-200 bg-white p-5">
      <h2 class="mb-4 text-lg font-semibold text-gray-800">Acoes</h2>
      <div class="flex flex-wrap gap-3">
        <button @click="handleProcess" :disabled="processing"
          class="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
          <svg v-if="!processing" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          <div v-else class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          {{ processing ? 'Processando...' : 'Processar com IA' }}
        </button>
        <button @click="handleDownload('pdf')" :disabled="downloading === 'pdf'" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          {{ downloading === 'pdf' ? 'Gerando...' : 'Gerar PDF' }}
        </button>
        <button @click="handleDownload('markdown')" :disabled="downloading === 'markdown'" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          {{ downloading === 'markdown' ? 'Gerando...' : 'Gerar Markdown' }}
        </button>
        <button @click="handleDownload('xlsx')" :disabled="downloading === 'xlsx'" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          {{ downloading === 'xlsx' ? 'Gerando...' : 'Gerar XLSX' }}
        </button>
      </div>
    </div>

    <div v-if="processResult" class="rounded-xl border border-gray-200 bg-white p-5">
      <h2 class="mb-4 text-lg font-semibold text-gray-800">Resultado do Processamento</h2>
      <div class="mb-4 flex gap-4">
        <div><span class="text-sm text-gray-500">Confianca:</span> <StatusBadge v-if="processResult.confianca" :status="processResult.confianca" /></div>
        <div><span class="text-sm text-gray-500">Inconsistencias:</span> <span class="ml-1 text-sm font-medium">{{ processResult.num_inconsistencias }}</span></div>
      </div>
    </div>

    <div v-if="file.markdownContent" class="rounded-xl border border-gray-200 bg-white p-5">
      <h2 class="mb-4 text-lg font-semibold text-gray-800">Memorial Descritivo</h2>
      <MarkdownViewer :content="file.markdownContent" />
    </div>

    <div v-if="reports.length > 0" class="rounded-xl border border-gray-200 bg-white p-5">
      <h2 class="mb-4 text-lg font-semibold text-gray-800">Relatorios Gerados</h2>
      <div class="space-y-2">
        <router-link v-for="report in reports" :key="report.id" :to="`/reports/${report.id}`"
          class="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50">
          <div>
            <p class="text-sm font-medium text-gray-800">{{ report.title }}</p>
            <p class="text-xs text-gray-400">{{ report.fileType?.toUpperCase() }} - {{ formatDate(report.createdAt) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <StatusBadge v-if="report.confianca" :status="report.confianca" />
            <StatusBadge :status="report.status" />
          </div>
        </router-link>
      </div>
    </div>

    <ConfirmDialog v-if="showDeleteConfirm" title="Deletar Arquivo"
      :message="`Tem certeza que deseja deletar '${file.originalName}'?`" confirm-text="Deletar" :danger="true"
      @confirm="handleDelete" @cancel="showDeleteConfirm = false" />
  </div>
</template>
