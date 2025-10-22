import { NextRequest } from 'next/server';
import { addSSEConnection, removeSSEConnection } from '@/lib/sse-manager';

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to our set
      addSSEConnection(controller);
      
      // Send initial connection message
      const data = JSON.stringify({ type: 'connected', message: 'Connected to broadcast updates' });
      controller.enqueue(`data: ${data}\n\n`);
      
      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
        } catch (error) {
          clearInterval(heartbeat);
          removeSSEConnection(controller);
        }
      }, 30000); // 30 seconds heartbeat
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        removeSSEConnection(controller);
        try {
          controller.close();
        } catch (error) {
          // Connection already closed
        }
      });
    },
    
    cancel() {
      // Connection closed by client
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}