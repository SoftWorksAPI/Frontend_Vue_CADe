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
  <div class="md-content" v-html="rendered"></div>
</template>

<style scoped>
.md-content :deep(h1) {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a3c5e;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.md-content :deep(h2) {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a3c5e;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

.md-content :deep(h3) {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.md-content :deep(p) {
  font-size: 0.875rem;
  line-height: 1.7;
  color: #374151;
  margin-bottom: 0.75rem;
}

.md-content :deep(ul),
.md-content :deep(ol) {
  margin-left: 1.25rem;
  margin-bottom: 0.75rem;
}

.md-content :deep(li) {
  font-size: 0.875rem;
  line-height: 1.7;
  color: #374151;
  margin-bottom: 0.25rem;
}

.md-content :deep(strong) {
  font-weight: 600;
  color: #111827;
}

.md-content :deep(em) {
  font-style: italic;
  color: #4b5563;
}

.md-content :deep(blockquote) {
  border-left: 4px solid #1a3c5e;
  background-color: #f0f4f8;
  padding: 0.75rem 1rem;
  margin: 1rem 0;
  border-radius: 0 0.5rem 0.5rem 0;
  font-style: italic;
  color: #4b5563;
}

.md-content :deep(code) {
  background-color: #f3f4f6;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-family: ui-monospace, monospace;
  color: #dc2626;
}

.md-content :deep(pre) {
  background-color: #1f2937;
  color: #e5e7eb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.md-content :deep(pre code) {
  background: none;
  color: inherit;
  padding: 0;
  font-size: 0.8rem;
}

.md-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.875rem;
}

.md-content :deep(th) {
  background-color: #1a3c5e;
  color: white;
  padding: 0.625rem 0.75rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.8rem;
}

.md-content :deep(td) {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}

.md-content :deep(tr:nth-child(even)) {
  background-color: #f9fafb;
}

.md-content :deep(tr:hover) {
  background-color: #f0f4f8;
}

.md-content :deep(hr) {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 1.5rem 0;
}

.md-content :deep(a) {
  color: #1a3c5e;
  text-decoration: underline;
  font-weight: 500;
}

.md-content :deep(a:hover) {
  color: #2d5f8a;
}
</style>
