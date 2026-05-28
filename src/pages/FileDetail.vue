<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getFileById, deleteFile } from '@/api/files'
import { listReports, createReport, deleteReport } from '@/api/reports'
import { processFile, generatePdf, generateMarkdown, generateXlsx } from '@/api/processing'
import { useNotificationStore } from '@/stores/notifications'
import MarkdownViewer from '@/components/MarkdownViewer.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ChatPanel from '@/components/ChatPanel.vue'
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
const showRawJson = ref(false)
const showTreatedJson = ref(false)
const showUploadReport = ref(false)
const uploadingReport = ref(false)
const reportToDelete = ref<Report | null>(null)
const reportFile = ref<File | null>(null)
const reportTitle = ref('')
const showRetryConfirm = ref(false)
const retryType = ref<'pdf' | 'markdown' | 'xlsx' | null>(null)

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const fileId = Number(route.params.id)

// Verificar se o arquivo foi processado pela IA (tem JSON cru e tratado)
const jsonCruReport = computed(() => reports.value.find(r => r.fileType === 'json' && r.filePath?.includes('json_cru')))
const jsonTratadoReport = computed(() => reports.value.find(r => r.fileType === 'json' && r.filePath?.includes('json_tratado')))
const isProcessed = computed(() => !!jsonCruReport.value && !!jsonTratadoReport.value)

// Persistir estado de processamento no localStorage
const PROCESSING_KEY = 'cade_processing'

function getProcessingState(): boolean {
  try {
    const stored = localStorage.getItem(PROCESSING_KEY)
    if (!stored) return false
    const map = JSON.parse(stored)
    return !!map[fileId]
  } catch {
    return false
  }
}

function setProcessingState(value: boolean) {
  try {
    const stored = localStorage.getItem(PROCESSING_KEY)
    const map = stored ? JSON.parse(stored) : {}
    if (value) {
      map[fileId] = Date.now()
    } else {
      delete map[fileId]
    }
    localStorage.setItem(PROCESSING_KEY, JSON.stringify(map))
  } catch {}
}

async function loadReports() {
  try {
    reports.value = await listReports(fileId)
  } catch {
    // Silently fail
  }
}

async function loadFile() {
  loading.value = true
  try {
    const [fileData, reportsData] = await Promise.all([
      getFileById(fileId),
      listReports(fileId)
    ])
    file.value = fileData
    reports.value = reportsData || []

    // Se o arquivo ja foi processado (tem JSONs), limpar estado de processamento
    if (isProcessed.value) {
      setProcessingState(false)
      processing.value = false
    }
  } catch {
    notify.error('Erro ao carregar arquivo')
    router.push('/files')
  } finally {
    loading.value = false
  }
}

async function handleProcess() {
  processing.value = true
  setProcessingState(true)
  processResult.value = null
  try {
    const result = await processFile(fileId)
    processResult.value = result
    if (result.sucesso) {
      notify.success('Arquivo processado com sucesso')
    } else {
      notify.warning('Processamento concluido com avisos')
    }
    // Recarregar dados sem mostrar loading spinner
    const [fileData, reportsData] = await Promise.all([
      getFileById(fileId),
      listReports(fileId)
    ])
    file.value = fileData
    reports.value = reportsData || []
  } catch (err: any) {
    notify.error(err.response?.data?.message || 'Erro ao processar arquivo')
  } finally {
    processing.value = false
    setProcessingState(false)
  }
}

async function handleDeleteReport() {
  if (!reportToDelete.value) return
  try {
    await deleteReport(reportToDelete.value.id)
    notify.success('Relatório deletado com sucesso')
    reportToDelete.value = null
    await loadReports()
  } catch (err: any) {
    notify.error(err.response?.data?.message || 'Erro ao deletar relatório')
  }
}

async function handleUploadReport() {
  if (!reportFile.value || !reportTitle.value) return
  uploadingReport.value = true
  try {
    await createReport(reportFile.value, reportTitle.value, fileId)
    notify.success('Relatório enviado com sucesso')
    showUploadReport.value = false
    reportFile.value = null
    reportTitle.value = ''
    await loadReports()
  } catch (err: any) {
    notify.error(err.response?.data?.message || 'Erro ao enviar relatório')
  } finally {
    uploadingReport.value = false
  }
}

function downloadJson(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function getMemorialData(): any {
  if (!file.value?.markdownContent) return null
  try {
    return JSON.parse(file.value.markdownContent)
  } catch {
    return null
  }
}

async function handleDownload(type: 'pdf' | 'markdown' | 'xlsx', isRetry = false) {
  downloading.value = type
  const timeoutMs = isRetry ? 600000 : undefined // 10min no retry, 5min default
  try {
    let blob: Blob
    let filename: string
    if (type === 'pdf') {
      blob = await generatePdf(fileId, timeoutMs)
      filename = `${file.value?.originalName || 'relatorio'}.pdf`
    } else if (type === 'markdown') {
      blob = await generateMarkdown(fileId, timeoutMs)
      filename = `${file.value?.originalName || 'relatorio'}.md`
    } else {
      blob = await generateXlsx(fileId, timeoutMs)
      filename = `${file.value?.originalName || 'relatorio'}.xlsx`
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    notify.success(`Relatorio ${type.toUpperCase()} gerado com sucesso`)
    await loadReports()
  } catch (err: any) {
    const status = err?.response?.status
    if (status === 500 && !isRetry) {
      // Mostrar dialog de retry
      retryType.value = type
      showRetryConfirm.value = true
    } else {
      notify.error(err?.response?.data?.message || err.message || `Erro ao gerar ${type.toUpperCase()}`)
    }
  } finally {
    downloading.value = null
  }
}

async function confirmRetry() {
  if (retryType.value) {
    showRetryConfirm.value = false
    notify.info('Tentando novamente com timeout estendido...')
    await handleDownload(retryType.value, true)
    retryType.value = null
  }
}

function cancelRetry() {
  showRetryConfirm.value = false
  retryType.value = null
  notify.info('Geracao de relatorio cancelada')
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

onMounted(() => {
  // Restaurar estado de processamento se o usuario saiu e voltou
  if (getProcessingState()) {
    processing.value = true
  }
  loadFile()
})
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
        <p class="text-xs font-medium text-gray-500">Responsavel</p>
        <p class="mt-1 text-lg font-semibold">{{ file.User?.name || '-' }}</p>
      </div>
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
        <button @click="handleDownload('pdf')" :disabled="downloading === 'pdf' || !isProcessed" :title="!isProcessed ? 'Processe com IA primeiro' : ''" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          {{ downloading === 'pdf' ? 'Gerando...' : 'Gerar PDF' }}
        </button>
        <button @click="handleDownload('markdown')" :disabled="downloading === 'markdown' || !isProcessed" :title="!isProcessed ? 'Processe com IA primeiro' : ''" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          {{ downloading === 'markdown' ? 'Gerando...' : 'Gerar Markdown' }}
        </button>
        <button @click="handleDownload('xlsx')" :disabled="downloading === 'xlsx' || !isProcessed" :title="!isProcessed ? 'Processe com IA primeiro' : ''" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          {{ downloading === 'xlsx' ? 'Gerando...' : 'Gerar XLSX' }}
        </button>
      </div>
      <p v-if="!isProcessed" class="mt-2 text-xs text-yellow-600">
        Processe o arquivo com IA antes de gerar relatórios.
      </p>
      <div v-if="processing && !isProcessed" class="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 flex items-center justify-between">
        <p class="text-sm text-yellow-800">
          O processamento anterior pode ter sido interrompido. Clique em "Processar com IA" para tentar novamente.
        </p>
        <button @click="processing = false; setProcessingState(false)" class="ml-3 flex-shrink-0 text-xs text-yellow-700 underline hover:text-yellow-900">
          Limpar status
        </button>
      </div>
    </div>
    <div v-if="processResult" class="rounded-xl border border-gray-200 bg-white p-5">
      <h2 class="mb-4 text-lg font-semibold text-gray-800">Resultado do Processamento</h2>
      <div class="mb-4 flex gap-4">
        <div><span class="text-sm text-gray-500">Confianca:</span> <StatusBadge v-if="processResult.confianca" :status="processResult.confianca" /></div>
        <div><span class="text-sm text-gray-500">Inconsistencias:</span> <span class="ml-1 text-sm font-medium">{{ processResult.num_inconsistencias }}</span></div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button v-if="processResult.dados_extracao" @click="showRawJson = !showRawJson"
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          {{ showRawJson ? 'Ocultar' : 'Ver' }} JSON Cru
        </button>
        <button v-if="processResult.memorial_descritivo" @click="showTreatedJson = !showTreatedJson"
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          {{ showTreatedJson ? 'Ocultar' : 'Ver' }} JSON Tratado
        </button>
      </div>
      <pre v-if="showRawJson && processResult.dados_extracao" class="mt-3 max-h-96 overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700">{{ JSON.stringify(processResult.dados_extracao, null, 2) }}</pre>
      <pre v-if="showTreatedJson && processResult.memorial_descritivo" class="mt-3 max-h-96 overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700">{{ JSON.stringify(processResult.memorial_descritivo, null, 2) }}</pre>
    </div>

    <!-- Chat e Relatorios lado a lado -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Chat do Projeto -->
      <ChatPanel v-if="isProcessed" :file-id="fileId" />

      <!-- Reports section -->
      <div class="rounded-xl border border-gray-200 bg-white p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800">Relatorios Gerados</h2>
          <button @click="showUploadReport = !showUploadReport"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Manual
          </button>
        </div>

        <!-- Upload form -->
        <div v-if="showUploadReport" class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 class="mb-3 text-sm font-semibold text-gray-800">Enviar relatório manualmente</h3>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label class="block text-xs font-medium text-gray-700">Título</label>
              <input v-model="reportTitle" type="text" required
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                placeholder="Ex: Memorial Descritivo" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700">Arquivo</label>
              <input type="file" @change="(e) => reportFile = (e.target as HTMLInputElement).files?.[0] || null"
                class="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200" />
            </div>
          </div>
          <div class="mt-3 flex gap-2">
            <button @click="handleUploadReport" :disabled="!reportFile || !reportTitle || uploadingReport"
              class="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50">
              {{ uploadingReport ? 'Enviando...' : 'Enviar' }}
            </button>
            <button @click="showUploadReport = false; reportFile = null; reportTitle = ''"
              class="rounded-lg border border-gray-300 px-4 py-1.5 text-xs text-gray-600">
              Cancelar
            </button>
          </div>
        </div>
        <div class="space-y-2">
          <div v-for="report in reports" :key="report.id"
            class="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50 cursor-pointer"
            @click="router.push(`/reports/${report.id}`)">
            <div>
              <p class="text-sm font-medium text-gray-800">{{ report.title }}</p>
              <p class="text-xs text-gray-400">{{ report.User?.name || 'Sistema' }} - {{ report.fileType?.toUpperCase() }} - {{ formatDate(report.createdAt) }}</p>
            </div>
            <div class="flex items-center gap-2">
              <StatusBadge v-if="report.confianca" :status="report.confianca" />
              <StatusBadge :status="report.status" />
              <button @click.stop="reportToDelete = report"
                class="rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50 transition">
                Deletar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isProcessed" class="rounded-xl border border-gray-200 bg-white p-5">
      <h2 class="mb-4 text-lg font-semibold text-gray-800">Memorial Descritivo</h2>

      <template v-if="getMemorialData()">
        <!-- Confianca -->
        <div v-if="getMemorialData().confianca_analise" class="mb-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-1">Confianca da Analise</h3>
          <StatusBadge :status="getMemorialData().confianca_analise" />
        </div>

        <!-- Observacoes Tecnicas -->
        <div v-if="getMemorialData().observacoes_tecnicas?.length" class="mb-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Observacoes Tecnicas</h3>
          <ul class="space-y-1">
            <li v-for="(obs, i) in getMemorialData().observacoes_tecnicas" :key="i"
              class="flex items-start gap-2 text-sm text-gray-600">
              <span class="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400"></span>
              {{ obs }}
            </li>
          </ul>
        </div>

        <!-- Inconsistencias Detectadas -->
        <div v-if="getMemorialData().inconsistencias_detectadas?.length" class="mb-4">
          <h3 class="text-sm font-semibold text-red-700 mb-2">Inconsistencias Detectadas</h3>
          <ul class="space-y-1">
            <li v-for="(inc, i) in getMemorialData().inconsistencias_detectadas" :key="i"
              class="flex items-start gap-2 text-sm text-red-600">
              <span class="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400"></span>
              {{ inc }}
            </li>
          </ul>
        </div>

        <pre v-if="showTreatedJson" class="mt-3 max-h-96 overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700">{{ JSON.stringify(getMemorialData(), null, 2) }}</pre>
      </template>

      <MarkdownViewer v-else :key="file.id + '-' + file.updatedAt" :content="file.markdownContent || ''" />
    </div>

    <ConfirmDialog v-if="showDeleteConfirm" title="Deletar Arquivo"
      :message="`Tem certeza que deseja deletar '${file.originalName}'?`" confirm-text="Deletar" :danger="true"
      @confirm="handleDelete" @cancel="showDeleteConfirm = false" />

    <ConfirmDialog v-if="reportToDelete"
      :title="reportToDelete.fileType === 'json' ? 'Atenção' : 'Deletar Relatorio'"
      :message="reportToDelete.fileType === 'json'
        ? `O relatorio '${reportToDelete.title}' e um arquivo JSON utilizado pelo sistema de IA. Ao deleta-lo, sera necessario processar o arquivo novamente com IA para gerar novos relatorios. Deseja continuar?`
        : `Tem certeza que deseja deletar o relatorio '${reportToDelete.title}'?`"
      confirm-text="Deletar"
      :danger="true"
      @confirm="handleDeleteReport"
      @cancel="reportToDelete = null" />

    <ConfirmDialog v-if="showRetryConfirm"
      title="Erro ao gerar relatorio"
      message="O servidor retornou um erro interno (500). Isso pode ter acontecido por timeout ou sobrecarga. Deseja tentar novamente com mais tempo de espera?"
      confirm-text="Tentar novamente"
      :danger="false"
      @confirm="confirmRetry"
      @cancel="cancelRetry" />
  </div>
</template>
