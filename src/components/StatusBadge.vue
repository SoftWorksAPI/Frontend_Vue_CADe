<script setup lang="ts">
defineProps<{
  status: string
}>()

const classes: Record<string, string> = {
  concluido: 'bg-green-100 text-green-800',
  erro: 'bg-red-100 text-red-800',
  revisado: 'bg-blue-100 text-blue-800',
  processando: 'bg-yellow-100 text-yellow-800',
  gerando: 'bg-blue-100 text-blue-800',
  idle: 'bg-gray-100 text-gray-400',
  alta: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  baixa: 'bg-red-100 text-red-800',
  online: 'bg-green-100 text-green-800',
  offline: 'bg-red-100 text-red-800'
}
</script>

<template>
  <span :class="[classes[status] || 'bg-gray-100 text-gray-800', 'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium']">
    {{ status }}
  </span>
</template>
