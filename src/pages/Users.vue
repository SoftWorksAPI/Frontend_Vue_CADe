<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listUsers, deleteUser, updateUser } from '@/api/users'
import { register, changePassword } from '@/api/auth'
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
const editingUser = ref<User | null>(null)

// Create form
const newName = ref('')
const newEmail = ref('')
const newPassword = ref('')

// Edit form
const editName = ref('')
const editIsAdmin = ref(false)
const editNewPassword = ref('')

// Password visibility (hold to show)
const showCreatePassword = ref(false)
const showEditPassword = ref(false)

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

function startEdit(user: User) {
  editingUser.value = user
  editName.value = user.name
  editIsAdmin.value = user.isAdmin
  editNewPassword.value = ''
  showCreateForm.value = false
}

async function handleUpdate() {
  if (!editingUser.value) return
  try {
    // Atualizar nome e isAdmin
    await updateUser(editingUser.value.id, {
      name: editName.value,
      isAdmin: editIsAdmin.value,
    })

    // Se preencheu nova senha, alterar separadamente
    if (editNewPassword.value) {
      await changePassword(editingUser.value.id, editNewPassword.value)
    }

    notify.success('Usuario atualizado com sucesso')
    editingUser.value = null
    await loadUsers()
  } catch (err: any) {
    notify.error(err.response?.data?.message || 'Erro ao atualizar usuario')
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
      <button @click="showCreateForm = !showCreateForm; editingUser = null"
        class="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Novo Usuario
      </button>
    </div>

    <!-- Create Form -->
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
          <div class="relative mt-1">
            <input v-model="newPassword" :type="showCreatePassword ? 'text' : 'password'" required class="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
            <button type="button"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              @mousedown="showCreatePassword = true"
              @mouseup="showCreatePassword = false"
              @mouseleave="showCreatePassword = false"
              @touchstart.prevent="showCreatePassword = true"
              @touchend="showCreatePassword = false">
              <svg v-if="!showCreatePassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            </button>
          </div>
        </div>
        <div class="flex gap-3 sm:col-span-3">
          <button type="submit" class="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white">Criar</button>
          <button type="button" @click="showCreateForm = false" class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">Cancelar</button>
        </div>
      </form>
    </div>

    <!-- Edit Form -->
    <div v-if="editingUser" class="rounded-xl border border-blue-200 bg-blue-50 p-6">
      <h2 class="mb-4 text-lg font-semibold">Editar Usuario: {{ editingUser.email }}</h2>
      <form @submit.prevent="handleUpdate" class="space-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label class="block text-sm font-medium text-gray-700">Nome</label>
            <input v-model="editName" type="text" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
          </div>
          <div class="flex items-end gap-2 pb-1">
            <input v-model="editIsAdmin" type="checkbox" id="editIsAdmin" class="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
            <label for="editIsAdmin" class="text-sm font-medium text-gray-700">Administrador</label>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Nova senha <span class="font-normal text-gray-400">(deixe vazio para nao alterar)</span></label>
            <div class="relative mt-1">
              <input v-model="editNewPassword" :type="showEditPassword ? 'text' : 'password'" minlength="6" class="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-[var(--color-primary)] focus:outline-none" placeholder="Min. 6 caracteres" />
              <button type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                @mousedown="showEditPassword = true"
                @mouseup="showEditPassword = false"
                @mouseleave="showEditPassword = false"
                @touchstart.prevent="showEditPassword = true"
                @touchend="showEditPassword = false">
                <svg v-if="!showEditPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="flex gap-3">
          <button type="submit" class="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white">Salvar</button>
          <button type="button" @click="editingUser = null" class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600">Cancelar</button>
        </div>
      </form>
    </div>

    <!-- Table -->
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
            <th class="px-4 py-3 font-semibold w-24">Acoes</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="users.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-gray-400">Nenhum usuario encontrado</td>
          </tr>
          <tr v-for="user in users" :key="user.id" class="transition-colors hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-800">{{ user.name }}</td>
            <td class="px-4 py-3 text-gray-600">{{ user.email }}</td>
            <td class="px-4 py-3">
              <span :class="user.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'"
                class="rounded-full px-2 py-0.5 text-xs font-medium">{{ user.isAdmin ? 'Sim' : 'Nao' }}</span>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ formatDate(user.createdAt) }}</td>
            <td class="px-4 py-3">
              <div class="flex gap-1">
                <button @click="startEdit(user)" class="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition">
                  Editar
                </button>
                <button @click="deleteTarget = user" class="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition">
                  Deletar
                </button>
              </div>
            </td>
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
