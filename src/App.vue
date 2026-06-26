<script setup lang="ts">
import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSSEStore } from '@/stores/sse'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import Toast from '@/components/Toast.vue'

const auth = useAuthStore()
const sse = useSSEStore()

// Conectar SSE quando autenticado, desconectar no logout
watch(() => auth.isAuthenticated, (isAuth) => {
  if (isAuth) {
    sse.connect()
  } else {
    sse.disconnect()
  }
}, { immediate: true })
</script>

<template>
  <DefaultLayout v-if="auth.isAuthenticated">
    <router-view />
  </DefaultLayout>
  <router-view v-else />
  <Toast />
</template>
