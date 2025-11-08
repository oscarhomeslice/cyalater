"use client"

import { useEffect, useState } from "react"
import { X, Check, AlertCircle, Info } from "lucide-react"

export type ToastType = "success" | "error" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
}

let toastListeners: ((toast: Toast) => void)[] = []

export function showToast(message: string, type: ToastType = "success") {
  const toast: Toast = {
    id: Math.random().toString(36).substring(2, 9),
    message,
    type,
  }
  toastListeners.forEach((listener) => listener(toast))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 4000)
    }

    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  }, [])

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl shadow-black/50 animate-in slide-in-from-right-full duration-300 min-w-[320px] max-w-md"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div
              className={`shrink-0 w-5 h-5 ${
                toast.type === "success" ? "text-green-400" : toast.type === "error" ? "text-red-400" : "text-blue-400"
              }`}
            >
              {toast.type === "success" && <Check className="w-5 h-5" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5" />}
              {toast.type === "info" && <Info className="w-5 h-5" />}
            </div>
            <p className="flex-1 text-sm text-white">{toast.message}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="shrink-0 w-5 h-5 rounded-full hover:bg-zinc-800 flex items-center justify-center transition-colors"
              aria-label="Close notification"
            >
              <X className="w-3 h-3 text-zinc-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
