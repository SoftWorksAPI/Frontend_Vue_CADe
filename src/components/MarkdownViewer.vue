<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{ content: string }>()

const rendered = computed(() => {
  if (!props.content) return ''
  try {
    return marked(props.content, { breaks: true })
  } catch {
    return props.content
  }
})
</script>

<template>
  <div class="prose prose-sm max-w-none" v-html="rendered"></div>
</template>
