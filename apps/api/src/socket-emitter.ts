import type { Server } from 'socket.io';

let ioInstance: Server | null = null;

export function setSocketIO(io: Server) {
  ioInstance = io;
}

export function emitToUser(userId: string, event: string, data: unknown) {
  ioInstance?.to(`user:${userId}`).emit(event, data);
}

export function emitToBoard(boardId: string, event: string, data: unknown) {
  ioInstance?.to(`board:${boardId}`).emit(event, data);
}
