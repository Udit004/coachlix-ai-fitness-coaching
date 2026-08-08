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
// Surface the resolved endpoint so a misconfigured backend URL is obvious in
// the browser console (e.g. if it builds to ws://localhost the WS will fail
// and SSE fallback engages).
if (typeof window !== "undefined") {
  console.log("[ChatSocket] resolved WS endpoint:", WS_ENDPOINT);
}
const AUTO_RECONNECT_DELAY_MS = 1500;
// If the handshake doesn't open within this window we treat WebSockets as
// unavailable (e.g. Render free tier does not support WS) and reject so the
// caller can fall back to SSE instead of hanging forever.
const CONNECT_TIMEOUT_MS = 6000;

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

    let connectTimer = null;
    let settled = false;

    const cleanupTimer = () => {
      if (connectTimer) {
        clearTimeout(connectTimer);
        connectTimer = null;
      }
    };

    let connectError = null;

    const settleReady = (err) => {
      cleanupTimer();
      if (settled) return;
      settled = true;
      if (err) {
        this.connectionPromise = null;
        this.rejectConnection?.(err);
      } else {
        this.connected = true;
        this.resolveConnection?.();
      }
    };

    const ready = new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;

      socket.onopen = () => {
        // Do NOT resolve here. The server authenticates the ?token AFTER the
        // upgrade (async verifyUserToken). We wait for the explicit
        // `connected` frame below so sendMessage is only attempted once the
        // backend has set userId — otherwise the server drops the first
        // chat.message frame and the client hangs/falls back to SSE.
      };

      socket.onerror = (err) => {
        connectError = err;
        settleReady(err);
      };

      // Connection timeout: if the handshake never opens (e.g. proxy does not
      // upgrade) reject so the caller can fall back to SSE instead of hanging.
      connectTimer = setTimeout(() => {
        settleReady(
          connectError || new Error("WebSocket connection timed out")
        );
        try {
          socket.close();
        } catch (_) {
          // ignore
        }
      }, CONNECT_TIMEOUT_MS);
    });

    socket.onmessage = (event) => {
      let frame;
      try {
        frame = JSON.parse(String(event.data));
      } catch (_) {
        return;
      }

      // The server's first frame post-auth is `{ type:'connected' }`. Only
      // then is the socket usable; resolve the pending connect promise.
      // If an `error` frame arrives first (e.g. auth failed), reject so the
      // caller falls back to SSE immediately instead of waiting for close.
      if (!settled) {
        if (frame?.type === "connected") {
          settleReady();
        } else if (frame?.type === "error") {
          settleReady(
            connectError ||
              new Error(frame?.error?.message || frame?.message || "Chat socket error during handshake")
          );
        }
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
      cleanupTimer();
      // If auth failed the server sends a 4001 close before any 'connected'
      // frame. Reject the pending connect so the caller falls back to SSE
      // (which uses a freshly forced token via getIdToken(true)).
      if (!settled) {
        settleReady(
          connectError ||
            new Error(
              event.code === 4001
                ? "Chat socket auth rejected (4001)"
                : `WebSocket closed before ready (code ${event.code})`
            )
        );
      }
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

