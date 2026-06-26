<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  accept?: string
  label?: string
  description?: string
}>()

const emit = defineEmits<{
  fileSelected: [file: File]
}>()

const dragOver = ref(false)
const selectedFile = ref<File | null>(null)

function handleDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) selectFile(file)
}

function handleInput(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) selectFile(file)
}

function selectFile(file: File) {
  selectedFile.value = file
  emit('fileSelected', file)
}
</script>

<template>
  <div
    @dragover.prevent="dragOver = true"
    @dragleave="dragOver = false"
    @drop.prevent="handleDrop"
    :class="[
      'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
      dragOver ? 'border-[var(--color-primary)] bg-blue-50' : 'border-gray-300 hover:border-gray-400'
    ]"
  >
    <input
      type="file"
      :accept="props.accept"
      class="absolute inset-0 cursor-pointer opacity-0"
      @change="handleInput"
    />
    <div class="flex flex-col items-center gap-2">
      <svg class="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <p class="text-sm font-medium text-gray-600">{{ props.label || 'Arraste um arquivo ou clique para selecionar' }}</p>
      <p v-if="props.description" class="text-xs text-gray-400">{{ props.description }}</p>
      <p v-if="selectedFile" class="mt-2 text-sm font-medium text-[var(--color-primary)]">
        {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
      </p>
    </div>
  </div>
</template>
