import { useCallback, useEffect, useRef, useState } from "react";

export interface SSEBroadcast {
  id: string;
  userCardId: string;
  content: string;
  tipCati: number;
  onlyCelebrate: boolean;
  createdAt: string;
  userCard: {
    user: {
      userNickname: string;
      profilePictureUrl?: string;
      walletAddress: string;
    };
    card: { name: string; rank: string; rarityColor: string };
  };
}

type Status = "connecting" | "connected" | "disconnected";

export function useBroadcastSSE(token?: string) {
  const [status, setStatus] = useState<Status>("disconnected");
  const [newBroadcast, setNewBroadcast] = useState<SSEBroadcast | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const MAX_ATTEMPTS = 5;

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setStatus("disconnected");
    attemptsRef.current = 0;
  }, []);

  const connect = useCallback(() => {
    // Close any existing connection first
    if (esRef.current) esRef.current.close();

    setStatus("connecting");
    const url = token ? `/api/broadcasts/events?token=${encodeURIComponent(token)}` : "/api/broadcasts/events";
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.onopen = () => {
      setStatus("connected");
      attemptsRef.current = 0;
      // console.debug("SSE opened");
    };

    // Default messages (if server sends bare `data:` without `event:`)
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        // Fallback: if the server occasionally sends plain messages
        if (payload?.type === "new_broadcast") setNewBroadcast(payload.broadcast);
      } catch {
        // ignore
      }
    };

    // Named events
    es.addEventListener("connected", (ev) => {
      // optional: show toast
      // console.debug("connected:", (ev as MessageEvent).data);
    });

    es.addEventListener("heartbeat", () => {
      // optionally track last ping
    });

    es.addEventListener("new_broadcast", (ev) => {
      try {
        const payload = JSON.parse((ev as MessageEvent).data) as SSEBroadcast;
        setNewBroadcast(payload);
      } catch (e) {
        console.error("Bad new_broadcast payload", e, (ev as MessageEvent).data);
      }
    });

    es.onerror = () => {
      // console.warn("SSE error");
      setStatus("disconnected");
      es.close();

      if (attemptsRef.current < MAX_ATTEMPTS) {
        const delay = Math.pow(2, attemptsRef.current) * 1000; // 1s,2s,4s,8s,16s
        attemptsRef.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };
  }, [token]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    connectionStatus: status,
    newBroadcast,
    clearNewBroadcast: () => setNewBroadcast(null),
    reconnect: connect,
    disconnect,
  };
}
