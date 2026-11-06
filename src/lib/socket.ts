import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socketInstance: Socket | null = null;

export const getRacingSocket = (): Socket => {
  if (!socketInstance) {
    const token = getAuthToken();
    socketInstance = io(`${SOCKET_URL}/racing`, {
      autoConnect: false,
      auth: { token },
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      transports: ['websocket', 'polling'],
    });
  }
  return socketInstance;
};

export const reconnectRacingSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
  return getRacingSocket();
};
