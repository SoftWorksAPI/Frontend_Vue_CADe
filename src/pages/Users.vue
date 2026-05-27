<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listUsers, deleteUser } from '@/api/users'
import { register } from '@/api/auth'
import { useNotificationStore } from '@/stores/notifications'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { User } from '@/types'

const notify = useNotificationStore()

const users = ref<User[]>([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const deleteTarget = ref<User | null>(null)
const showCreateForm = ref(false)

const newName = ref('')
const newEmail = ref('')
const newPassword = ref('')

async function loadUsers() {
  loading.value = true
  try {
    const data = await listUsers(page.value, 10)
    users.value = data.users || []
    totalPages.value = data.pages || 1
  } catch {
    notify.error('Erro ao carregar usuarios')
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  try {
    await register(newEmail.value, newPassword.value, newName.value)
    notify.success('Usuario criado com sucesso')
    showCreateForm.value = false
    newName.value = ''
    newEmail.value = ''
    newPassword.value = ''
    await loadUsers()
  } catch (err: any) {
    notify.error(err.response?.data?.message || 'Erro ao criar usuario')
  }
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await deleteUser(deleteTarget.value.id)
    notify.success('Usuario deletado com sucesso')
    deleteTarget.value = null
    await loadUsers()
  } catch {
    notify.error('Erro ao deletar usuario')
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

onMounted(loadUsers)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Usuarios</h1>
      <button @click="showCreateForm = !showCreateForm"
        class="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Novo Usuario
      </button>
    </div>

    <div v-if="showCreateForm" class="rounded-xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold">Criar Usuario</h2>
      <form @submit.prevent="handleCreate" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label class="block text-sm font-medium text-gray-700">Nome</label>
          <input v-model="newName" type="text" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input v-model="newEmail" type="email" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Senha</label>
          <input v-model="newPassword" type="password" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
        </div>
        <div class="flex gap-3 sm:col-span-3">
          <button type="submit" class="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white">Criar</button>
          <button type="button" @click="showCreateForm = false" class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">Cancelar</button>
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
            <th class="px-4 py-3 font-semibold">Nome</th>
            <th class="px-4 py-3 font-semibold">Email</th>
            <th class="px-4 py-3 font-semibold">Admin</th>
            <th class="px-4 py-3 font-semibold">Criado em</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="users.length === 0">
            <td colspan="4" class="px-4 py-8 text-center text-gray-400">Nenhum usuario encontrado</td>
          </tr>
          <tr v-for="user in users" :key="user.id" class="transition-colors hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ user.name }}</td>
            <td class="px-4 py-3 text-gray-600">{{ user.email }}</td>
            <td class="px-4 py-3">
              <span :class="user.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'"
                class="rounded-full px-2 py-0.5 text-xs font-medium">{{ user.isAdmin ? 'Sim' : 'Nao' }}</span>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ formatDate(user.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
      <button @click="page--; loadUsers()" :disabled="page <= 1" class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50">Anterior</button>
      <span class="text-sm text-gray-600">Pagina {{ page }} de {{ totalPages }}</span>
      <button @click="page++; loadUsers()" :disabled="page >= totalPages" class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50">Proxima</button>
    </div>

    <ConfirmDialog v-if="deleteTarget" title="Deletar Usuario"
      :message="`Tem certeza que deseja deletar '${deleteTarget.name}' (${deleteTarget.email})?`" confirm-text="Deletar" :danger="true"
      @confirm="handleDelete" @cancel="deleteTarget = null" />
  </div>
</template>
