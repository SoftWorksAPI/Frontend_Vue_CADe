<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import Header from '@/components/Header.vue'

const sidebarOpen = ref(true)
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-100">
    <Sidebar :open="sidebarOpen" @toggle="sidebarOpen = !sidebarOpen" />

    <div class="flex flex-1 flex-col overflow-hidden">
      <Header @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
