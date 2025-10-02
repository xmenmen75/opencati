// Global SSE connection management
const connections = new Set<ReadableStreamDefaultController>();
const enc = new TextEncoder();

export function addSSEConnection(controller: ReadableStreamDefaultController) {
  connections.add(controller);
  console.log(`➕ Added connection. Total: ${connections.size}`);
}

export function removeSSEConnection(controller: ReadableStreamDefaultController) {
  connections.delete(controller);
  console.log(`➖ Removed connection. Total: ${connections.size}`);
}

function formatSSE(event: string, data: any, id?: string) {
  let msg = "";
  if (id) msg += `id: ${id}\n`;
  msg += `event: ${event}\n`;
  msg += `data: ${JSON.stringify(data)}\n\n`;
  return msg;
}

export function broadcastToAll(event: string, data: any, id?: string) {
  const msg = formatSSE(event, data, id);
  const dead = new Set<ReadableStreamDefaultController>();

  connections.forEach((controller) => {
    try {
      controller.enqueue(enc.encode(msg));
    } catch (err) {
      console.log("❌ Removing dead connection", err);
      dead.add(controller);
    }
  });

  dead.forEach((c) => connections.delete(c));

  console.log(`📡 Broadcasted to ${connections.size} active connections`);
}

export function getConnectionCount() {
  return connections.size;
}
