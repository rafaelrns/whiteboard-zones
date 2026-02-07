import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
export function createClientDoc() {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);
    return { doc, awareness };
}
export function encodeSyncStep1(doc) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 0);
    syncProtocol.writeSyncStep1(encoder, doc);
    return encoding.toUint8Array(encoder);
}
/** Codifica atualização local do Yjs para enviar ao servidor (tempo real). */
export function encodeDocUpdate(update) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 0); // sync
    syncProtocol.writeUpdate(encoder, update);
    return encoding.toUint8Array(encoder);
}
export function applyMessage(doc, awareness, data) {
    if (!data || data.length === 0)
        return null;
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
    }
    catch {
        return null;
    }
}
export function encodeAwarenessUpdate(awareness, clients) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 1);
    encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, clients));
    return encoding.toUint8Array(encoder);
}
