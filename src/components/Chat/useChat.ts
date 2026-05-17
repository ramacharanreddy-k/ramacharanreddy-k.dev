import { createContext, useContext } from 'react'

export type ChatContextValue = {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
}

export const ChatContext = createContext<ChatContextValue | null>(null)

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
