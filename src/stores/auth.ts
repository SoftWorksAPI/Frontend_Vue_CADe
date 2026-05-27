import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, getMe } from '@/api/auth'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.isAdmin ?? false)

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const data = await apiLogin(email, password)
      token.value = data.token
      localStorage.setItem('token', data.token)
      await fetchUser()
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      user.value = await getMe()
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  if (token.value) {
    fetchUser()
  }

  return { token, user, loading, isAuthenticated, isAdmin, login, logout, fetchUser }
})
