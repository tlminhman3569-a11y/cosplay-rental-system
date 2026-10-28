import { reactive } from 'vue'
const state = reactive({ toasts: [] })
let nextId = 0
export function useUiStore() { return { state, toast(message, ms = 3500) { const id = ++nextId; state.toasts.push({ id, message }); setTimeout(() => { state.toasts = state.toasts.filter(t => t.id !== id) }, ms) } } }
