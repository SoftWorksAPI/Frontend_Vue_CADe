<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listNormFiles, uploadNormFile, toggleAtivo, deleteNormFile } from '@/api/normFiles'
import { useNotificationStore } from '@/stores/notifications'
import FileUpload from '@/components/FileUpload.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { NormFile } from '@/types'

const notify = useNotificationStore()

const normFiles = ref<NormFile[]>([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const showUpload = ref(false)
const uploading = ref(false)
const deleteTarget = ref<NormFile | null>(null)

const selectedFile = ref<File | null>(null)
const title = ref('')
const category = ref('')
const description = ref('')

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
    await loadNormFiles()
  } catch {
    notify.error('Erro ao alterar status')
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await deleteNormFile(deleteTarget.value.id)
    notify.success('Norma deletada com sucesso')
    deleteTarget.value = null
    await loadNormFiles()
  } catch {
    notify.error('Erro ao deletar norma')
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

    <div v-if="showUpload" class="rounded-xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold">Upload de Norma</h2>
      <FileUpload accept=".pdf,.docx,.doc" label="Arraste um arquivo ou clique para selecionar" description="PDF, DOCX ou DOC" @file-selected="(f) => selectedFile = f" />
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
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="normFiles.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400">Nenhuma norma encontrada</td>
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
