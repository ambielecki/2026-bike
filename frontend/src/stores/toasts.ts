import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ToastVariant = 'success' | 'warning' | 'error'

export interface ToastMessage {
  id: number
  message: string
  title: string
  variant: ToastVariant
}

const TOAST_DURATION_MS = 10_000

export const useToastStore = defineStore('toasts', () => {
  const toasts = ref<ToastMessage[]>([])
  const timers = new Map<number, ReturnType<typeof setTimeout>>()
  let nextId = 1

  function addToast(variant: ToastVariant, message: string, title?: string) {
    const id = nextId++

    toasts.value.unshift({
      id,
      message,
      title: title ?? defaultTitle(variant),
      variant,
    })

    const timer = window.setTimeout(() => {
      removeToast(id)
    }, TOAST_DURATION_MS)

    timers.set(id, timer)

    return id
  }

  function removeToast(id: number) {
    const timer = timers.get(id)

    if (timer) {
      window.clearTimeout(timer)
      timers.delete(id)
    }

    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function success(message: string, title?: string) {
    return addToast('success', message, title)
  }

  function warning(message: string, title?: string) {
    return addToast('warning', message, title)
  }

  function error(message: string, title?: string) {
    return addToast('error', message, title)
  }

  function $reset() {
    timers.forEach((timer) => {
      window.clearTimeout(timer)
    })

    timers.clear()
    toasts.value = []
    nextId = 1
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    warning,
    error,
    $reset,
  }
})

function defaultTitle(variant: ToastVariant) {
  if (variant === 'success') {
    return 'Success'
  }

  if (variant === 'warning') {
    return 'Warning'
  }

  return 'Error'
}
