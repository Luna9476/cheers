export class MockPeerConnection {
  _listeners = {};

  outbound;

  peerId;

  constructor(peerId) {
    this.peerId = peerId;
  }

  on(event, listener) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(listener);
  }

  send(message) {
    if (this.outbound) {
      this.outbound(message);
    }
  }

  disconnect() {
    this.fire('disconnect');
  }

  close() {
    this.fire('close');
  }

  link(conn) {
    this.outbound = (message) => {
      conn.receive(message);
    };
    const self = this;
    conn.outbound = (message) => {
      self.receive(message);
    };
  }

  fire(event, thisArg, args) {
    if (this._listeners[event]) {
      for (const listener of this._listeners[event]) {
        listener.call(thisArg, args);
      }
    }
  }

  receive(message) {
    this.fire('data', null, message);
  }
}

export class MockPeer {
  _listeners = {};

  on(event, listener) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(listener);
  }

  // eslint-disable-next-line class-methods-use-this
  connect(peerId) {
    return new MockPeerConnection(peerId);
  }

  fire(event, thisArg, args) {
    if (this._listeners[event]) {
      for (const listener of this._listeners[event]) {
        listener.call(thisArg, args);
      }
    }
  }

  destroy() {
    this.fire('close');
  }
}
