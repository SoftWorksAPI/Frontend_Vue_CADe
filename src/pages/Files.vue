<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { listFiles, uploadFile, deleteFile, updateFileTitle } from '@/api/files'
import { useNotificationStore } from '@/stores/notifications'
import { useAutoPaginate } from '@/composables/useAutoPaginate'
import { useSSE } from '@/composables/useSSE'
import FileUpload from '@/components/FileUpload.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { FileRecord } from '@/types'

const router = useRouter()
const notify = useNotificationStore()
const { perPage } = useAutoPaginate(52, 220)

const files = ref<FileRecord[]>([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const showUpload = ref(false)
const uploading = ref(false)
const description = ref('')
const selectedFile = ref<File | null>(null)
const deleteTarget = ref<FileRecord | null>(null)
const editingFileId = ref<number | null>(null)
const editingTitle = ref('')

function startEditTitle(file: FileRecord) {
  editingFileId.value = file.id
  editingTitle.value = file.title || file.originalName
}

function cancelEditTitle() {
  editingFileId.value = null
  editingTitle.value = ''
}

async function saveEditTitle(file: FileRecord) {
  if (!editingTitle.value.trim()) return
  try {
    await updateFileTitle(file.id, editingTitle.value.trim())
    file.title = editingTitle.value.trim()
    notify.success('Titulo atualizado')
    editingFileId.value = null
    editingTitle.value = ''
  } catch (err: any) {
    notify.error(err.response?.data?.message || 'Erro ao atualizar titulo')
  }
}

async function loadFiles(showSpinner = true) {
  if (showSpinner) loading.value = true
  try {
    const data = await listFiles(page.value, perPage.value)
    files.value = data.files || []
    totalPages.value = data.pagination?.pages || 1
  } catch {
    if (showSpinner) notify.error('Erro ao carregar projetos')
  } finally {
    if (showSpinner) loading.value = false
  }
}

async function handleUpload() {
  if (!selectedFile.value) return
  uploading.value = true
  try {
    await uploadFile(selectedFile.value, description.value || undefined)
    notify.success('Projeto enviado com sucesso')
    showUpload.value = false
    selectedFile.value = null
    description.value = ''
    await loadFiles()
  } catch (err: any) {
    notify.error(err.response?.data?.message || 'Erro ao enviar projeto')
  } finally {
    uploading.value = false
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await deleteFile(deleteTarget.value.id)
    notify.success('Projeto deletado com sucesso')
    deleteTarget.value = null
    await loadFiles()
  } catch {
    notify.error('Erro ao deletar projeto')
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

// Recarregar quando o numero de itens por pagina mudar (resize)
watch(perPage, () => {
  page.value = 1
  loadFiles(false)
})

// SSE: atualizar lista quando houver mudancas
useSSE(() => loadFiles(false))

onMounted(loadFiles)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Projetos</h1>
      <button @click="showUpload = !showUpload"
        class="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-light)]">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Novo Projeto
      </button>
    </div>

    <div v-if="showUpload" class="rounded-xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold">Upload de Projeto</h2>
      <FileUpload accept=".dxf" label="Arraste um arquivo DXF ou clique para selecionar" description="Apenas arquivos .dxf" @file-selected="(f) => selectedFile = f" />
      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700">Descricao (opcional)</label>
        <input v-model="description" type="text" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" placeholder="Ex: Planta baixa - Pavimento 1" />
      </div>
      <div class="mt-4 flex gap-3">
        <button @click="handleUpload" :disabled="!selectedFile || uploading" class="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {{ uploading ? 'Enviando...' : 'Enviar' }}
        </button>
        <button @click="showUpload = false" class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
      </div>
    </div>

    <div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
      <table v-else class="w-full text-left text-sm">
        <thead class="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            <th class="px-4 py-3 font-semibold">Nome</th>
            <th class="px-4 py-3 font-semibold">Status</th>
            <th class="px-4 py-3 font-semibold">Responsavel</th>
            <th class="px-4 py-3 font-semibold">Tamanho</th>
            <th class="px-4 py-3 font-semibold">Descricao</th>
            <th class="px-4 py-3 font-semibold">Data</th>
            <th class="px-4 py-3 font-semibold">Atualizado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="files.length === 0">
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">Nenhum projeto encontrado</td>
          </tr>
          <tr v-for="file in files" :key="file.id" class="cursor-pointer transition-colors hover:bg-gray-50" @click="router.push(`/files/${file.id}`)">
            <td class="px-4 py-3 font-medium text-gray-800">
              <div v-if="editingFileId === file.id" class="flex items-center gap-1" @click.stop>
                <input v-model="editingTitle"
                  @keyup.enter="saveEditTitle(file)"
                  @keyup.escape="cancelEditTitle"
                  class="w-full rounded border border-blue-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  autofocus />
                <button @click="saveEditTitle(file)" class="rounded px-1.5 py-0.5 text-xs text-green-600 hover:bg-green-50">OK</button>
              </div>
              <div v-else class="group flex items-center gap-2">
                <span class="truncate cursor-pointer" @click="router.push(`/files/${file.id}`)">{{ file.title || file.originalName }}</span>
                <button @click.stop="startEditTitle(file)"
                  class="hidden rounded px-1 py-0.5 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 group-hover:inline-block">
                  Editar
                </button>
              </div>
            </td>
            <td class="px-4 py-3">
              <StatusBadge v-if="file.processingStatus && file.processingStatus !== 'idle'" :status="file.processingStatus" />
              <span v-else class="text-xs text-gray-400">-</span>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ file.User?.name || '-' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ formatBytes(file.fileSize) }}</td>
            <td class="px-4 py-3 text-gray-600">{{ file.description || '-' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ formatDate(file.createdAt) }}</td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ formatDate(file.updatedAt) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="totalPages > 1" class="border-t bg-gray-50 px-4 py-3 flex items-center justify-between text-sm text-gray-600">
        <span>{{ files.length }} projeto(s)</span>
        <div class="flex gap-2">
          <button @click="page--; loadFiles()" :disabled="page <= 1" class="rounded border px-3 py-1 disabled:opacity-50">Anterior</button>
          <span class="flex items-center px-2">{{ page }} / {{ totalPages }}</span>
          <button @click="page++; loadFiles()" :disabled="page >= totalPages" class="rounded border px-3 py-1 disabled:opacity-50">Proximo</button>
        </div>
      </div>
    </div>

    <ConfirmDialog v-if="deleteTarget" title="Deletar Projeto"
      :message="`Tem certeza que deseja deletar '${deleteTarget.originalName}'?`" confirm-text="Deletar" :danger="true"
      @confirm="handleDelete" @cancel="deleteTarget = null" />
  </div>
</template>
