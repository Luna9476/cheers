import { setLevel, Levels } from './SimpleLogger';
import { Host } from './Cheers';
import { MockPeer, MockPeerConnection } from './Peer.mock';

setLevel(Levels.DEBUG);

let peer;
let host;

beforeEach(() => {
  peer = new MockPeer();
  host = new Host(peer);
});

afterEach(() => {
  host && host.close();
});

test("Host's close listener was called", (done) => {
  host.on('close', () => {
    done();
  });
  host.close();
  host = null;
});

test('A guest joins the host', () => {
  const guestConn = new MockPeerConnection();
  peer.fire('connection', null, guestConn);
  expect(host._guests.length).toBe(1);
});

test('Host receives message from guest', (done) => {
  const expected = 'hello';
  host.on('message', (message) => {
    if (expected === message) {
      done();
    } else {
      done(new Error(`Expected ${JSON.stringify(expected)} but was ${JSON.stringify(message)}`));
    }
  });

  const guestConn = new MockPeerConnection();
  peer.fire('connection', null, guestConn);
  guestConn.receive(expected);
});

test('Broadcast a message', (done) => {
  const expected = 'hello';

  const guestConn = new MockPeerConnection();
  guestConn.outbound = (sent) => {
    if (expected === sent) {
      done();
    } else {
      done(new Error(`Expected ${JSON.stringify(expected)} but was ${JSON.stringify(sent)}`));
    }
  };
  host.on('join', (joined) => {
    if (joined !== guestConn) {
      throw new Error(new Error('An unexpected guest joined'));
    }

    host.broadcast(expected);
  });

  peer.fire('connection', null, guestConn);
  guestConn.receive(expected);
});

test('A guest is kicked by the host', (done) => {
  host.on('join', (joined) => {
    host.kick(joined);
  });
  const guestConn = new MockPeerConnection();
  guestConn.on('close', () => {
    done();
  });
  peer.fire('connection', null, guestConn);
  expect(host._guests.length).toBe(0);
});
