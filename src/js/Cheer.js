import Peer from 'peerjs';
import { getLogger } from './SimpleLogger';

class Attendee {
  static _log = getLogger(Attendee);

  peerId;

  _peer;

  _listeners = {
    open: [],
    close: []
  };

  constructor(peerSettings) {
    Attendee._log.debug(`The PeerJS settings: ${JSON.stringify(peerSettings)}`);
    this._peer = new Peer(peerSettings);
    Attendee._log.info(`Using the PeerJS server: ${peerSettings?.host || 'default'})`);

    const attendeeSelf = this;
    this._peer.on('open', (peerId) => {
      Attendee._log.info(`Connected to the PeerJS server. (peerId = ${peerId})`);
      attendeeSelf.peerId = peerId;
      for (const listener of attendeeSelf._listeners.open) {
        listener.call(attendeeSelf, peerId);
      }
    });

    this._peer.on('close', () => {
      for (const listener of attendeeSelf._listeners.close) {
        listener.call(attendeeSelf);
      }
    });
  }

  on(event, fn) {
    if (!event) {
      throw new Error('Event type is required.');
    }
    if (!fn) {
      throw new Error('Listener is required.');
    }
    const eventListeners = this._listeners[event];
    if (!eventListeners) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(fn);
  }

  off(event, fn) {
    if (!event) {
      throw new Error('Event type is required.');
    }
    if (!fn) {
      this._listeners[event] = [];
    } else {
      const eventListeners = this._listeners[event];
      if (!eventListeners) {
        return;
      }
      this._listeners[event] = this._listeners[event].filter((e) => e !== fn);
    }
  }

  close() {
    this._peer.close();
    this._listeners = {};
  }
}

export class Host extends Attendee {
  static _log = getLogger(Host);

  _guests = [];

  constructor(peerSettings) {
    super(peerSettings);

    this._listeners.join = [];
    this._listeners.message = [];
    this._listeners.leave = [];

    const hostSelf = this;
    this._peer.on('connection', (guest) => {
      Host._log.info(`A guest peer connected: ${JSON.stringify(guest)}`);
      const releaseGuestConnection = () => {
        guest.disconnect();
        hostSelf._guests = hostSelf._guests.filter((e) => e !== guest);
        for (const listener of hostSelf._listeners.leave) {
          listener.call(hostSelf, guest);
        }
      };
      guest.on('close', releaseGuestConnection);
      guest.on('disconnect', releaseGuestConnection);
      hostSelf._guests.push(guest);

      hostSelf._guests = hostSelf._guests.filter((e) => e !== guest);
      for (const listener of hostSelf._listeners.join) {
        listener.call(hostSelf, guest);
      }

      guest.on('data', (data) => {
        for (const listener of hostSelf._listeners.message) {
          listener.call(hostSelf, guest, data);
        }
      });
    });
  }

  kick(target) {
    for (const guest of this._guests) {
      if (guest === target) {
        target.close();
        return;
      }
    }
    Host._log.warn('The guest does not exist.');
  }

  broadcast(message) {
    for (const guest of this._guests) {
      guest.send(message);
    }
  }

  close() {
    for (const guest of this._guests) {
      guest.close();
    }
    super.close();
  }
}

export class Guest extends Attendee {
  static _log = getLogger(Guest);

  _hostPeerId;

  _hostConnection;

  constructor(hostPeerId, peerSettings) {
    super(peerSettings);

    if (!hostPeerId) {
      throw new Error('hostPeerId is required');
    }

    this._listeners.join = [];
    this._listeners.message = [];
    this._listeners.leave = [];

    this._hostPeerId = hostPeerId;

    const guestSelf = this;
    this.on('open', () => {
      guestSelf._hostConnection = guestSelf._peer.connect(hostPeerId);
      guestSelf._hostConnection.on('open', () => {
        Guest._log.info(`Connected to the host. (peerId = ${hostPeerId})`);

        for (const listener of guestSelf._listeners.join) {
          listener.call(guestSelf);
        }

        guestSelf._hostConnection.on('data', (data) => {
          Guest._log.debug(`Received data from the host: ${JSON.stringifydata}`);
          for (const listener of guestSelf._listeners.message) {
            listener.call(guestSelf, data);
          }
        });
      });
      guestSelf._hostConnection.on('close', () => {
        for (const listener of guestSelf._listeners.leave) {
          listener.call(guestSelf);
        }
      });
    });
  }

  close() {
    this._hostConnection.close();
    super.close();
  }
}
