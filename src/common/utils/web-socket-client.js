import kefir from 'kefir';

export default function createSocketClient({ url, impl }) {

  const WebSocketClient = impl || WebSocket;

  const sockets = kefir
    .repeat(() => kefir
      .stream(emitter => {
        setTimeout(() => {
          const socket = new WebSocketClient(url);
          socket.onopen = () => emitter.emit(socket);
          socket.onerror = err => emitter.error(err);
          socket.onclose = () => emitter.end();
          return () => socket.close();
        }, 1000);
      })
      .endOnError()
    );

  const inboundMessages = sockets
    .flatMapLatest(s => kefir.stream(emitter => s.onmessage = emitter.emit))
    .map(e => JSON.parse(e.data));

  const drift = inboundMessages
    .map(msg => msg.timestamp - Date.now())
    .slidingWindow(5, 1)
    .map(lags => lags.reduce((sum, lag) => sum + lag, 0) / lags.length);

  const outboundMessages = kefir.pool();

  kefir
    .combine([outboundMessages], [sockets])
    .onValue(([msg, socket]) => {
      socket.send(JSON.stringify(msg));
    });

  return {
    timeDrift: drift,
    messages: {
      inbound: inboundMessages,
      outbound: outboundMessages
    }
  };
}
