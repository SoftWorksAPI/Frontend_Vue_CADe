<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { changePassword } from '@/api/auth'
import { useNotificationStore } from '@/stores/notifications'

const router = useRouter()

const auth = useAuthStore()
const notify = useNotificationStore()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)

async function handleChangePassword() {
  if (newPassword.value !== confirmPassword.value) {
    notify.error('As senhas nao coincidem')
    return
  }
  if (oldPassword.value && newPassword.value === oldPassword.value) {
    notify.error('A nova senha nao pode ser igual a senha atual')
    return
  }
  if (!auth.user) return

  loading.value = true
  try {
    await changePassword(auth.user.id, newPassword.value, oldPassword.value || undefined)
    notify.success('Senha alterada com sucesso. Faca login novamente.')
    auth.logout()
    router.push('/login')
  } catch (err: any) {
    notify.error(err.response?.data?.message || 'Erro ao alterar senha')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Perfil</h1>

    <!-- User Info -->
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-800">Dados do Usuario</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p class="text-sm font-medium text-gray-500">Nome</p>
          <p class="mt-1 text-sm text-gray-900">{{ auth.user?.name }}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Email</p>
          <p class="mt-1 text-sm text-gray-900">{{ auth.user?.email }}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Tipo</p>
          <p class="mt-1 text-sm text-gray-900">{{ auth.user?.isAdmin ? 'Administrador' : 'Usuario' }}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">Membro desde</p>
          <p class="mt-1 text-sm text-gray-900">{{ auth.user?.createdAt ? new Date(auth.user.createdAt).toLocaleDateString('pt-BR') : '-' }}</p>
        </div>
      </div>
    </div>

    <!-- Change Password -->
    <div class="rounded-xl border border-gray-200 bg-white p-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-800">Alterar Senha</h2>
      <form @submit.prevent="handleChangePassword" class="max-w-md space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Senha Atual</label>
          <input v-model="oldPassword" type="password" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Nova Senha</label>
          <input v-model="newPassword" type="password" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
          <input v-model="confirmPassword" type="password" required class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
        </div>
        <button type="submit" :disabled="loading" class="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
          {{ loading ? 'Salvando...' : 'Alterar Senha' }}
        </button>
      </form>
    </div>
  </div>
</template>
