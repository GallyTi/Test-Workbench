import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const wsUrl =
      typeof window !== 'undefined'
        ? `http://${window.location.hostname}:4000`
        : (process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000');
    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}
