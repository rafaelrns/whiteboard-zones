type CounterKey =
  | 'http_requests_total'
  | 'socket_connections_total'
  | 'socket_messages_total'
  | 'yjs_messages_total'
  | 'locks_try_total';

const counters = new Map<CounterKey, number>([
  ['http_requests_total', 0],
  ['socket_connections_total', 0],
  ['socket_messages_total', 0],
  ['yjs_messages_total', 0],
  ['locks_try_total', 0],
]);

export function inc(key: CounterKey, by = 1) {
  counters.set(key, (counters.get(key) ?? 0) + by);
}

export function snapshot() {
  return Object.fromEntries(counters.entries());
}
