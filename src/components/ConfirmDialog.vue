<script setup lang="ts">
defineProps<{
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      <p class="mt-2 text-sm text-gray-600">{{ message }}</p>
      <div class="mt-6 flex justify-end gap-3">
        <button
          @click="$emit('cancel')"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {{ cancelText || 'Cancelar' }}
        </button>
        <button
          @click="$emit('confirm')"
          :class="[
            'rounded-lg px-4 py-2 text-sm font-medium text-white',
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)]'
          ]"
        >
          {{ confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  </div>
</template>
