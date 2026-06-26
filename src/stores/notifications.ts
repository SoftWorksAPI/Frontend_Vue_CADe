import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Notification {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timeout?: number
}

let nextId = 0

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])

  function add(type: Notification['type'], message: string, timeout = 4000) {
    const id = nextId++
    notifications.value.push({ id, type, message, timeout })
    if (timeout > 0) {
      setTimeout(() => remove(id), timeout)
    }
  }

  function remove(id: number) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  function success(message: string) { add('success', message) }
  function error(message: string) { add('error', message, 6000) }
  function warning(message: string) { add('warning', message) }
  function info(message: string) { add('info', message) }

  return { notifications, add, remove, success, error, warning, info }
})
