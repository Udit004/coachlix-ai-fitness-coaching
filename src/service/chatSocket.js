import { API_BASE_URL } from "@/service/apiBase";
import { getAuthHeaders } from "@/service/chatApiBase";

// Build a WebSocket URL from the same backend origin as the REST chat API.
// API_BASE_URL is like `https://backend.example.com/api/v1`.
const buildWsEndpoint = () => {
  const base = String(API_BASE_URL || "").replace(/\/api\/v1$/i, "");
  const isLocalHttp =
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base || "");
  const scheme = isLocalHttp ? "ws" : "wss";
  return `${scheme}://${base.replace(/^https?:\/\//i, "")}/ws/chat`;
};

const WS_ENDPOINT = buildWsEndpoint();
const AUTO_RECONNECT_DELAY_MS = 1500;

/**
 * Minimal persistent chat WebSocket client:
 *  - Connects once with a Bearer-ish `?token=` (auth handled at handshake)
 *  - Auto-reconnects on close/error (Render proxies and idle timeouts)
 *  - Sends `chat.message` frames and dispatches parsed JSON frames
 *
 * The backend emits frames with the SAME envelope as the SSE stream:
 * `{ type:'word' }`, `{ type:'thought_chunk' }`, `{ type:'ai_event' }`,
 * `{ type:'complete' }`, `{ type:'error' }`.
 */
class ChatSocket {
  constructor() {
    this.ws = null;
    this.token = null;
    this.handlers = new Set();
    this.connected = false;
    this.intentionalClose = false;
    this.reconnectTimer = null;
    this.connectionPromise = null;
    this.resolveConnection = null;
    this.rejectConnection = null;
  }

  /** Register a frame handler. Returns an unsubscribe fn. */
  on(handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async connect({ force = false } = {}) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return this.connectionPromise || Promise.resolve();
    }

    if (force || !this.token) {
      const headers = await getAuthHeaders();
      const authHeader = headers.Authorization || headers.authorization || "";
      this.token = authHeader.replace(/^Bearer\s+/i, "").trim();
    }

    if (!this.token) {
      return Promise.reject(new Error("No auth token available for chat socket"));
    }

    const socket = new WebSocket(`${WS_ENDPOINT}?token=${encodeURIComponent(this.token)}`);

    this.intentionalClose = false;

    const ready = new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;

      socket.onopen = () => {
        this.connected = true;
        this.resolveConnection?.();
      };

      socket.onerror = (err) => {
        this.rejectConnection?.(err);
      };
    });

    socket.onmessage = (event) => {
      let frame;
      try {
        frame = JSON.parse(String(event.data));
      } catch (_) {
        return;
      }
      for (const handler of this.handlers) {
        try {
          handler(frame);
        } catch (err) {
          console.error("Chat socket handler error:", err);
        }
      }
    };

    socket.onclose = (event) => {
      this.connected = false;
      this.ws = null;
      this.resolveConnection = null;
      this.rejectConnection = null;

      if (!this.intentionalClose && event.code !== 4001) {
        this.scheduleReconnect();
      }
    };

    this.ws = socket;
    this.connectionPromise = ready;
    return ready;
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect({ force: true }).catch(() => {
        this.scheduleReconnect();
      });
    }, AUTO_RECONNECT_DELAY_MS);
  }

  get isOpen() {
    return Boolean(this.ws && this.ws.readyState === WebSocket.OPEN);
  }

  /** Send a `chat.message` frame over the live socket. */
  sendMessage(payload) {
    if (!this.isOpen) {
      return Promise.reject(new Error("Chat socket not connected"));
    }
    this.ws.send(
      JSON.stringify({
        type: "chat.message",
        message: payload.message,
        plan: payload.plan,
        chatId: payload.chatId,
        files: payload.files,
      })
    );
    return Promise.resolve();
  }

  close() {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {
        // ignore
      }
      this.ws = null;
    }
    this.connected = false;
  }
}

// Singleton shared across the chat UI session.
const chatSocket = new ChatSocket();
export default chatSocket;

