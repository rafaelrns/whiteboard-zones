import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

export type YMessage = Uint8Array;

export function createClientDoc() {
  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);
  return { doc, awareness };
}

export function encodeSyncStep1(doc: Y.Doc) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, 0);
  syncProtocol.writeSyncStep1(encoder, doc);
  return encoding.toUint8Array(encoder);
}

/** Codifica atualização local do Yjs para enviar ao servidor (tempo real). */
export function encodeDocUpdate(update: Uint8Array): Uint8Array {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, 0); // sync
  syncProtocol.writeUpdate(encoder, update);
  return encoding.toUint8Array(encoder);
}

export function applyMessage(
  doc: Y.Doc,
  awareness: awarenessProtocol.Awareness,
  data: Uint8Array,
): Uint8Array | null {
  if (!data || data.length === 0) return null;
  try {
    const decoder = decoding.createDecoder(data);
    const encoder = encoding.createEncoder();
    const messageType = decoding.readVarUint(decoder);
    switch (messageType) {
      case 0: // sync
        encoding.writeVarUint(encoder, 0);
        syncProtocol.readSyncMessage(decoder, encoder, doc, 'remote');
        return encoding.toUint8Array(encoder);
      case 1: // awareness
        awarenessProtocol.applyAwarenessUpdate(awareness, decoding.readVarUint8Array(decoder), null);
        return null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function encodeAwarenessUpdate(awareness: awarenessProtocol.Awareness, clients: number[]) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, 1);
  encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, clients));
  return encoding.toUint8Array(encoder);
}
