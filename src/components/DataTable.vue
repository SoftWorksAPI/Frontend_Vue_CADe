<script setup lang="ts">
import type { Column } from '@/types'

defineProps<{
  columns: Column[]
  data: Record<string, any>[]
  loading?: boolean
}>()

defineEmits<{
  rowClick: [row: Record<string, any>]
}>()
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent"></div>
    </div>
    <table v-else class="w-full text-left text-sm">
      <thead class="bg-gray-50 text-xs uppercase text-gray-600">
        <tr>
          <th v-for="col in columns" :key="col.key" class="px-4 py-3 font-semibold">{{ col.label }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr
          v-for="(row, i) in data"
          :key="i"
          class="cursor-pointer transition-colors hover:bg-gray-50"
          @click="$emit('rowClick', row)"
        >
          <td v-for="col in columns" :key="col.key" class="px-4 py-3 text-gray-700">
            {{ col.format ? col.format(row[col.key], row) : row[col.key] }}
          </td>
        </tr>
        <tr v-if="data.length === 0">
          <td :colspan="columns.length" class="px-4 py-8 text-center text-gray-400">
            Nenhum registro encontrado
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
