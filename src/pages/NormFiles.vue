<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listNormFiles, uploadNormFile, toggleAtivo, deleteNormFile, updateNormFile } from '@/api/normFiles'
import { ragSync } from '@/api/system'
import { useNotificationStore } from '@/stores/notifications'
import FileUpload from '@/components/FileUpload.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { NormFile } from '@/types'

const notify = useNotificationStore()

const normFiles = ref<NormFile[]>([])
const loading = ref(true)
const syncing = ref(false)
const hasChanges = ref(false)
const page = ref(1)
const totalPages = ref(1)
const showUpload = ref(false)
const uploading = ref(false)
const deleteTarget = ref<NormFile | null>(null)

const selectedFile = ref<File | null>(null)
const title = ref('')
const category = ref('')
const description = ref('')

// Edit form
const editingNormFile = ref<NormFile | null>(null)
const editTitle = ref('')
const editCategory = ref('')

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getFileUrl(nf: NormFile): string {
  // filePath vem como "/uploads/norms/arquivo.pdf"
  return `${apiBaseUrl}${nf.filePath}`
}

async function loadNormFiles() {
  loading.value = true
  try {
    const data = await listNormFiles(page.value, 10)
    normFiles.value = data.normFiles || []
    totalPages.value = data.pagination?.pages || 1
  } catch {
    notify.error('Erro ao carregar normas')
  } finally {
    loading.value = false
  }
}

async function handleUpload() {
  if (!selectedFile.value || !title.value || !category.value) return
  uploading.value = true
  try {
    await uploadNormFile(selectedFile.value, title.value, category.value, description.value || undefined)
    notify.success('Norma enviada com sucesso')
    hasChanges.value = true
    showUpload.value = false
    selectedFile.value = null
    title.value = ''
    category.value = ''
    description.value = ''
    await loadNormFiles()
  } catch (err: any) {
    notify.error(err.response?.data?.message || 'Erro ao enviar norma')
  } finally {
    uploading.value = false
  }
}

async function handleToggleAtivo(normFile: NormFile) {
  try {
    await toggleAtivo(normFile.id)
    notify.success(`Norma ${normFile.ativo ? 'desativada' : 'ativada'}`)
    hasChanges.value = true
    await loadNormFiles()
  } catch {
    notify.error('Erro ao alterar status')
  }
}

function startEdit(nf: NormFile) {
  editingNormFile.value = nf
  editTitle.value = nf.title
  editCategory.value = nf.category
  showUpload.value = false
}

async function handleUpdate() {
  if (!editingNormFile.value) return
  try {
    await updateNormFile(editingNormFile.value.id, {
      title: editTitle.value,
      category: editCategory.value,
    })
    notify.success('Norma atualizada com sucesso')
    hasChanges.value = true
    editingNormFile.value = null
    await loadNormFiles()
  } catch (err: any) {
    notify.error(err.response?.data?.message || 'Erro ao atualizar norma')
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await deleteNormFile(deleteTarget.value.id)
    notify.success('Norma deletada com sucesso')
    hasChanges.value = true
    deleteTarget.value = null
    await loadNormFiles()
  } catch {
    notify.error('Erro ao deletar norma')
  }
}

async function handleSyncRag() {
  syncing.value = true
  try {
    const result = await ragSync()
    notify.success(`RAG sincronizado: ${result.normas_sincronizadas || 0} normas, ${result.total_chunks || 0} chunks`)
    hasChanges.value = false
  } catch (err: any) {
    notify.error(err.response?.data?.message || 'Erro ao sincronizar RAG')
  } finally {
    syncing.value = false
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

onMounted(loadNormFiles)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Normas Tecnicas</h1>
      <button @click="showUpload = !showUpload"
        class="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nova Norma
      </button>
    </div>

    <!-- Warning: changes detected -->
    <div v-if="hasChanges" class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <svg class="h-5 w-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p class="text-sm text-yellow-800">
          Foram detectadas alterações nas normas. Atualize o banco vetorial para que o RAG considere os dados mais recentes.
        </p>
      </div>
      <button
        :disabled="syncing"
        @click="handleSyncRag"
        class="ml-4 flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50 transition"
      >
        <svg v-if="!syncing" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
        </svg>
        <svg v-else class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ syncing ? 'Sincronizando...' : 'Atualizar Banco Vetorial' }}
      </button>
    </div>

    <div v-if="showUpload" class="rounded-xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold">Upload de Norma</h2>
      <FileUpload accept=".pdf,.docx,.xlsx,.xls" label="Arraste um arquivo ou clique para selecionar" description="PDF, DOCX, XLSX ou XLS" @file-selected="(f) => selectedFile = f" />
      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label class="block text-sm font-medium text-gray-700">Titulo</label>
          <input v-model="title" type="text" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" placeholder="Ex: NBR 5410" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Categoria</label>
          <input v-model="category" type="text" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" placeholder="Ex: Eletrica" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Descricao (opcional)</label>
          <input v-model="description" type="text" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
        </div>
      </div>
      <div class="mt-4 flex gap-3">
        <button @click="handleUpload" :disabled="!selectedFile || !title || !category || uploading" class="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {{ uploading ? 'Enviando...' : 'Enviar' }}
        </button>
        <button @click="showUpload = false" class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">Cancelar</button>
      </div>
    </div>

    <!-- Edit Form -->
    <div v-if="editingNormFile" class="rounded-xl border border-blue-200 bg-blue-50 p-6">
      <h2 class="mb-4 text-lg font-semibold">Editar Norma: {{ editingNormFile.originalName }}</h2>
      <form @submit.prevent="handleUpdate" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label class="block text-sm font-medium text-gray-700">Titulo</label>
          <input v-model="editTitle" type="text" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Categoria</label>
          <input v-model="editCategory" type="text" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
        </div>
        <div class="flex gap-3 items-end">
          <button type="submit" class="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white">Salvar</button>
          <button type="button" @click="editingNormFile = null" class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent"></div>
      </div>
      <table v-else class="w-full text-left text-sm">
        <thead class="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            <th class="px-4 py-3 font-semibold">Titulo</th>
            <th class="px-4 py-3 font-semibold">Categoria</th>
            <th class="px-4 py-3 font-semibold">Formato</th>
            <th class="px-4 py-3 font-semibold">Ativo</th>
            <th class="px-4 py-3 font-semibold">Data</th>
            <th class="px-4 py-3 font-semibold">Acoes</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="normFiles.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-400">Nenhuma norma encontrada</td>
          </tr>
          <tr v-for="nf in normFiles" :key="nf.id" class="transition-colors hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ nf.title }}</td>
            <td class="px-4 py-3 text-gray-600">{{ nf.category }}</td>
            <td class="px-4 py-3 text-gray-600">{{ nf.fileType?.toUpperCase() }}</td>
            <td class="px-4 py-3">
              <button @click="handleToggleAtivo(nf)"
                :class="nf.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                class="rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80">
                {{ nf.ativo ? 'Sim' : 'Nao' }}
              </button>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ formatDate(nf.createdAt) }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-1">
                <a :href="getFileUrl(nf)" target="_blank" rel="noopener noreferrer"
                  class="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition"
                  @click.stop>
                  Visualizar
                </a>
                <button @click="startEdit(nf)" class="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition">
                  Editar
                </button>
                <button @click="handleToggleAtivo(nf)"
                  class="rounded px-2 py-1 text-xs transition"
                  :class="nf.ativo ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'">
                  {{ nf.ativo ? 'Desativar' : 'Ativar' }}
                </button>
                <button @click="deleteTarget = nf" class="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition">
                  Deletar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
      <button @click="page--; loadNormFiles()" :disabled="page <= 1" class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50">Anterior</button>
      <span class="text-sm text-gray-600">Pagina {{ page }} de {{ totalPages }}</span>
      <button @click="page++; loadNormFiles()" :disabled="page >= totalPages" class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50">Proxima</button>
    </div>

    <ConfirmDialog v-if="deleteTarget" title="Deletar Norma"
      :message="`Tem certeza que deseja deletar '${deleteTarget.title}'?`" confirm-text="Deletar" :danger="true"
      @confirm="handleDelete" @cancel="deleteTarget = null" />
  </div>
</template>
