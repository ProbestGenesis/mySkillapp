import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import type { IncomingMessage } from 'http'
import { URL } from 'url'

type StoreWsMessage = {
  type: 'message_created' | 'presence_changed' | 'message_read'
  conversationId: string
}

type ClientMeta = {
  userId: string
  conversationIds: Set<string>
}

const clients = new Map<WebSocket, ClientMeta>()

function safeSend(socket: WebSocket, payload: StoreWsMessage) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload))
  }
}

export function setupStoreWsServer(server: Server) {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', 'http://192.168.201.16')
    if (url.pathname !== '/ws/store') return
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request)
    })
  })

  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    const url = new URL(request.url || '', 'http://192.168.201.16')
    const userId = url.searchParams.get('userId')
    const conversations = url.searchParams.get('conversations')
    const conversationIds = new Set(
      (conversations || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    )

    if (!userId) {
      ws.close()
      return
    }

    clients.set(ws, { userId, conversationIds })
    for (const conversationId of conversationIds) {
      notifyStoreConversationPresence(conversationId, userId)
    }

    ws.on('message', (raw) => {
      try {
        const parsed = JSON.parse(raw.toString()) as {
          type?: 'subscribe'
          conversationId?: string
        }
        if (parsed.type === 'subscribe' && parsed.conversationId) {
          const current = clients.get(ws)
          if (!current) return
          current.conversationIds.add(parsed.conversationId)
          clients.set(ws, current)
        }
      } catch {
        // Ignore malformed payloads
      }
    })

    ws.on('close', () => {
      const meta = clients.get(ws)
      clients.delete(ws)
      if (meta) {
        for (const conversationId of meta.conversationIds) {
          notifyStoreConversationPresence(conversationId, meta.userId)
        }
      }
    })
  })
}

export function notifyStoreConversationMessage(conversationId: string, participantIds: string[]) {
  for (const [socket, meta] of clients.entries()) {
    const canReceive =
      participantIds.includes(meta.userId) && meta.conversationIds.has(conversationId)
    if (canReceive) {
      safeSend(socket, {
        type: 'message_created',
        conversationId,
      })
    }
  }
}

export function notifyStoreConversationRead(conversationId: string, participantIds: string[]) {
  for (const [socket, meta] of clients.entries()) {
    const canReceive =
      participantIds.includes(meta.userId) && meta.conversationIds.has(conversationId)
    if (canReceive) {
      safeSend(socket, {
        type: 'message_read',
        conversationId,
      })
    }
  }
}

export function notifyStoreConversationPresence(conversationId: string, changedUserId: string) {
  for (const [socket, meta] of clients.entries()) {
    if (meta.conversationIds.has(conversationId) && meta.userId !== changedUserId) {
      safeSend(socket, {
        type: 'presence_changed',
        conversationId,
      })
    }
  }
}

export function isStoreUserOnline(userId: string) {
  for (const meta of clients.values()) {
    if (meta.userId === userId) return true
  }
  return false
}
