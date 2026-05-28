<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { sendChatMessage } from '@/api/chat'
import { useNotificationStore } from '@/stores/notifications'
import MarkdownViewer from '@/components/MarkdownViewer.vue'
import type { ChatMessage } from '@/types'

const props = defineProps<{
  fileId: number
}>()

const MAX_MESSAGES = 20
const MAX_MSG_CHARS = 500

const notify = useNotificationStore()

const messages = ref<ChatMessage[]>([])
const input = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

const messageCount = computed(() => messages.value.length)
const inputChars = computed(() => input.value.length)
const isLimitReached = computed(() => messageCount.value >= MAX_MESSAGES)
const isInputOverLimit = computed(() => inputChars.value > MAX_MSG_CHARS)
const canSend = computed(() =>
  input.value.trim().length > 0 &&
  !loading.value &&
  !isLimitReached.value &&
  !isInputOverLimit.value
)

async function sendMessage() {
  if (!canSend.value) return

  const userMessage: ChatMessage = { role: 'user', content: input.value.trim() }
  messages.value.push(userMessage)
  const question = input.value.trim()
  input.value = ''
  loading.value = true

  await nextTick()
  scrollToBottom()

  try {
    const historico = messages.value.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content,
    }))

    const response = await sendChatMessage(props.fileId, question, historico)
    messages.value.push({ role: 'assistant', content: response.resposta })

    await nextTick()
    scrollToBottom()
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Erro ao enviar mensagem'
    notify.error(msg)
    messages.value.pop()
  } finally {
    loading.value = false
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function clearChat() {
  messages.value = []
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-semibold text-gray-800">
          Chat do Projeto
        </h2>
        <span
          class="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
          :class="isLimitReached ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'"
        >
          {{ messageCount }}/{{ MAX_MESSAGES }} msgs
        </span>
      </div>
      <button
        v-if="messages.length > 0"
        class="text-xs text-gray-500 hover:text-gray-700"
        @click="clearChat"
      >
        Limpar
      </button>
    </div>

    <!-- Aviso de limite -->
    <div
      v-if="isLimitReached"
      class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700"
    >
      Limite de {{ MAX_MESSAGES }} mensagens atingido. Limpe o chat para continuar.
    </div>

    <!-- Lista de mensagens -->
    <div
      ref="messagesContainer"
      class="mb-4 max-h-80 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-3"
    >
      <!-- Empty state -->
      <div v-if="messages.length === 0" class="flex flex-col items-center justify-center py-8 text-gray-400">
        <svg class="mb-2 h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p class="text-xs">Faca uma pergunta sobre este projeto</p>
      </div>

      <!-- Mensagens -->
      <div v-else class="space-y-2.5">
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="flex"
          :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[80%] rounded-xl px-3 py-2 text-sm"
            :class="msg.role === 'user'
              ? 'bg-[var(--color-primary)] text-white rounded-br-sm'
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'"
          >
            <template v-if="msg.role === 'assistant'">
              <MarkdownViewer :content="msg.content" />
            </template>
            <template v-else>
              <p class="whitespace-pre-wrap">{{ msg.content }}</p>
              <p class="mt-1 text-right text-[10px] opacity-60">
                {{ msg.content.length }}/{{ MAX_MSG_CHARS }}
              </p>
            </template>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-start">
          <div class="rounded-xl rounded-bl-sm border border-gray-200 bg-white px-3 py-2">
            <div class="flex items-center gap-1">
              <div class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style="animation-delay: 0ms"></div>
              <div class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style="animation-delay: 150ms"></div>
              <div class="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style="animation-delay: 300ms"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="flex items-end gap-2">
      <div class="relative flex-1">
        <textarea
          v-model="input"
          :disabled="loading || isLimitReached"
          :placeholder="isLimitReached ? 'Limite atingido' : 'Digite sua pergunta...'"
          rows="2"
          class="w-full resize-none rounded-lg border px-3 py-2 pr-16 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:bg-gray-100 disabled:text-gray-400"
          :class="isInputOverLimit ? 'border-red-400' : 'border-gray-300'"
          @keydown="handleKeydown"
        ></textarea>
        <span
          class="absolute bottom-2 right-2 text-[10px]"
          :class="isInputOverLimit ? 'text-red-500 font-medium' : 'text-gray-400'"
        >
          {{ inputChars }}/{{ MAX_MSG_CHARS }}
        </span>
      </div>
      <button
        :disabled="!canSend"
        class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed"
        @click="sendMessage"
      >
        <svg v-if="!loading" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
        <div v-else class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
      </button>
    </div>
  </div>
</template>
