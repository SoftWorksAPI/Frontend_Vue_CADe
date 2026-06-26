<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAIConfig, updateAIConfig, testAIConnection } from '@/api/aiConfig'
import { useNotificationStore } from '@/stores/notifications'
import type { AIConfig, AITestResult } from '@/api/aiConfig'

const notify = useNotificationStore()

const loading = ref(true)
const saving = ref(false)
const testing = ref(false)

const provider = ref<'openrouter' | 'ollama'>('openrouter')
const model = ref('')
const apiKey = ref('')
const baseUrl = ref('')

const maskedKey = ref('')
const keyModified = ref(false)

const testResult = ref<AITestResult | null>(null)

// Defaults por provider
const defaults: Record<string, { model: string; baseUrl: string }> = {
  openrouter: {
    model: 'openai/gpt-oss-120b:free',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  },
  ollama: {
    model: 'llama3',
    baseUrl: 'http://localhost:11434/v1/chat/completions',
  },
}

async function loadConfig() {
  loading.value = true
  try {
    const config = await getAIConfig()
    provider.value = config.provider
    model.value = config.model
    maskedKey.value = config.apiKey
    apiKey.value = ''
    keyModified.value = false
    baseUrl.value = config.baseUrl
  } catch {
    notify.error('Erro ao carregar configuracao de IA')
  } finally {
    loading.value = false
  }
}

function onProviderChange(p: 'openrouter' | 'ollama') {
  provider.value = p
  if (!keyModified.value) {
    model.value = defaults[p].model
    baseUrl.value = defaults[p].baseUrl
  }
}

function onKeyInput() {
  keyModified.value = true
}

async function handleSave() {
  saving.value = true
  try {
    const payload: Partial<AIConfig> = {
      provider: provider.value,
      model: model.value,
      baseUrl: baseUrl.value,
    }
    if (keyModified.value && apiKey.value) {
      payload.apiKey = apiKey.value
    }
    await updateAIConfig(payload)
    notify.success('Configuracao de IA salva com sucesso')
    keyModified.value = false
    await loadConfig()
  } catch (err: any) {
    notify.error(err.response?.data?.message || 'Erro ao salvar configuracao')
  } finally {
    saving.value = false
  }
}

async function handleTest() {
  testing.value = true
  testResult.value = null
  try {
    testResult.value = await testAIConnection()
    if (testResult.value?.status === 'online') {
      notify.success(`IA online: ${testResult.value.provider} (${testResult.value.modelo})`)
    } else {
      notify.error(`Falha: ${testResult.value?.erro || 'Erro desconhecido'}`)
    }
  } catch (err: any) {
    testResult.value = { status: 'erro_conexao', erro: err.message }
    notify.error('Erro ao testar conexao com a IA')
  } finally {
    testing.value = false
  }
}

onMounted(loadConfig)
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">Configuracao da IA</h1>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent"></div>
    </div>

    <template v-else>
      <!-- Provider -->
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <h2 class="mb-4 text-lg font-semibold text-gray-800">Provider</h2>
        <div class="flex gap-3">
          <button
            class="flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors"
            :class="provider === 'openrouter'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'"
            @click="onProviderChange('openrouter')"
          >
            OpenRouter
            <span class="block text-xs font-normal opacity-70">API na nuvem</span>
          </button>
          <button
            class="flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors"
            :class="provider === 'ollama'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'"
            @click="onProviderChange('ollama')"
          >
            Ollama
            <span class="block text-xs font-normal opacity-70">IA local</span>
          </button>
        </div>
      </div>

      <!-- Config -->
      <div class="rounded-xl border border-gray-200 bg-white p-6">
        <h2 class="mb-4 text-lg font-semibold text-gray-800">Parametros</h2>
        <div class="space-y-4">
          <!-- API Key (apenas OpenRouter) -->
          <div v-if="provider === 'openrouter'">
            <label class="mb-1 block text-sm font-medium text-gray-700">API Key</label>
            <div class="relative">
              <input
                v-model="apiKey"
                type="password"
                :placeholder="maskedKey || 'sk-...'"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                @input="onKeyInput"
              />
              <p class="mt-1 text-xs text-gray-400">
                {{ keyModified ? 'Nova chave sera salva' : 'Deixe vazio para manter a atual' }}
              </p>
            </div>
          </div>

          <!-- Modelo -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Modelo</label>
            <input
              v-model="model"
              type="text"
              :placeholder="defaults[provider].model"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          <!-- Base URL -->
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">Base URL</label>
            <input
              v-model="baseUrl"
              type="text"
              :placeholder="defaults[provider].baseUrl"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
      </div>

      <!-- Acoes -->
      <div class="flex items-center gap-3">
        <button
          :disabled="saving"
          class="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-light)] disabled:opacity-50"
          @click="handleSave"
        >
          <svg v-if="saving" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Salvar
        </button>

        <button
          :disabled="testing"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          @click="handleTest"
        >
          <svg v-if="testing" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Testar Conexao
        </button>
      </div>

      <!-- Resultado do teste -->
      <div v-if="testResult" class="rounded-lg border p-4"
        :class="testResult.status === 'online'
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-red-200 bg-red-50 text-red-800'">
        <p class="text-sm font-medium">
          Status: {{ testResult.status }}
          <span v-if="testResult.provider"> | Provider: {{ testResult.provider }}</span>
          <span v-if="testResult.modelo"> | Modelo: {{ testResult.modelo }}</span>
        </p>
        <p v-if="testResult.erro" class="mt-1 text-sm text-red-600">{{ testResult.erro }}</p>
      </div>
    </template>
  </div>
</template>
