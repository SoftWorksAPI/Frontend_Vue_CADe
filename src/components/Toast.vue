<script setup lang="ts">
import { useNotificationStore } from '@/stores/notifications'

const notifications = useNotificationStore()

const typeClasses: Record<string, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500'
}
</script>

<template>
  <div class="fixed right-4 top-4 z-50 flex flex-col gap-2">
    <TransitionGroup name="toast">
      <div
        v-for="n in notifications.notifications"
        :key="n.id"
        :class="[typeClasses[n.type], 'flex items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg']"
      >
        <span class="text-sm">{{ n.message }}</span>
        <button @click="notifications.remove(n.id)" class="ml-2 text-white/80 hover:text-white">&times;</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
