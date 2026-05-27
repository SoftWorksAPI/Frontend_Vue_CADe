<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import Toast from '@/components/Toast.vue'

const auth = useAuthStore()
</script>

<template>
  <DefaultLayout v-if="auth.isAuthenticated">
    <router-view />
  </DefaultLayout>
  <router-view v-else />
  <Toast />
</template>
