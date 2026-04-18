import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import type { IncomingMessage } from 'http'
import { URL } from 'url'

type StoreWsMessage = {
  type: 'message_created'
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
    const url = new URL(request.url || '', 'http://localhost')
    if (url.pathname !== '/ws/store') return
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request)
    })
  })

  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    const url = new URL(request.url || '', 'http://localhost')
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
      clients.delete(ws)
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
