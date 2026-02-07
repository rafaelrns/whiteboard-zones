import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

export type YRoom = {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  lastUsedAt: number;
};

export function createRoom(): YRoom {
  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);
  return { doc, awareness, lastUsedAt: Date.now() };
}

export function encodeSyncStep1(doc: Y.Doc) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, 0); // messageType 0 = sync
  syncProtocol.writeSyncStep1(encoder, doc);
  return encoding.toUint8Array(encoder);
}

/** Codifica SyncStep2 com estado completo do doc (para cliente novo que entra no quadro). */
export function encodeSyncStep2(doc: Y.Doc) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, 0); // messageType 0 = sync
  // state vector vazio = cliente tem nada; envia todo o documento
  const emptyStateVector = Y.encodeStateVector(new Y.Doc());
  syncProtocol.writeSyncStep2(encoder, doc, emptyStateVector);
  return encoding.toUint8Array(encoder);
}

export function handleMessage(room: YRoom, data: Uint8Array): Uint8Array | null {
  if (!data || data.length === 0) return null;
  try {
    const decoder = decoding.createDecoder(data);
    const encoder = encoding.createEncoder();
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case 0: // sync
        encoding.writeVarUint(encoder, 0);
        syncProtocol.readSyncMessage(decoder, encoder, room.doc, null);
        return encoding.toUint8Array(encoder);
      case 1: // awareness
        encoding.writeVarUint(encoder, 1);
        awarenessProtocol.applyAwarenessUpdate(room.awareness, decoding.readVarUint8Array(decoder), null);
        return null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}
