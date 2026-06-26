<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
    <div>
      <!-- <div class="h-30 w-30 bg-[var(--color-primary)]"
           style="-webkit-mask: url('/Logo.svg') center/contain no-repeat; mask: url('/Logo.svg') center/contain no-repeat;"></div> -->
    </div>
    <div class="flex items-center gap-4">
      <div class="text-right">
        <p class="text-sm font-medium text-gray-700">{{ auth.user?.name }}</p>
        <p class="text-xs text-gray-500">{{ auth.user?.isAdmin ? 'Administrador' : 'Usuario' }}</p>
      </div>
      <button
        @click="handleLogout"
        class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
      >
        Sair
      </button>
    </div>
  </header>
</template>
