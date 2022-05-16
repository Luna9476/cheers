import Peer from 'peerjs';
import { setLevel, getLogger, Levels } from './SimpleLogger';
import { Host, Guest } from './Cheers';
import PingPong from './PingPong';

setLevel(Levels.DEBUG);

const log = getLogger('Cheers');

class VideoHost {
  /**
   * The status of the Host. (one of 'play' or 'pause')
   */
  status = 'play';

  /**
   * An auto-incremental number that indicates the epoch of the sent message
   * (in other words how many events have been sent).
   */
  epoch = 0;

  timeUpdateInterval = 10000;

  lastTimeUpdateAt = null;

  /**
   * Create a VideoHost instance that controls the video on behalf of other joined guests
   * @param {Host} host a Host object
   * @param {DOMElement} videoElement the DOM element of the controlled video
   */
  constructor(host, videoElement) {
    this.host = host;
    this.videoElement = videoElement;

    const self = this;

    this.host.on('open', (peerId) => {
      log.debug(`Sending a message to the popup that the host peerId (${peerId}) was generated.`);
      chrome.runtime.sendMessage({
        event: 'hosted',
        peerId
      });
    });

    this.host.on('join', (guest) => {
      guest.send({
        event: 'hello',
        epoch: self.epoch++,
        src: self.videoElement.src
      });
    });

    this.host.on('message', (data, guest) => {
      switch (data.event) {
        case 'ping':
          guest.send({
            event: 'pong',
            corelationId: data.corelationId
          });
          break;
        default:
          log.debug(`Unknown event ${data.event}`);
          break;
      }
    });

    this._playListener = () => {
      self.status = 'play';
      self.host.broadcast({
        event: 'play',
        epoch: self.epoch++,
        currentTime: videoElement.currentTime
      });
    };
    this.videoElement.addEventListener('play', this._playListener);

    this._pauseListener = () => {
      self.status = 'pause';
      self.host.broadcast({
        event: 'pause',
        epoch: self.epoch++,
        currentTime: videoElement.currentTime
      });
    };
    this.videoElement.addEventListener('pause', this._pauseListener);

    this._timeupdateListener = () => {
      const currentTimestamp = new Date().getTime();
      if (self.lastTimeUpdateAt
        && currentTimestamp - self.lastTimeUpdateAt < self.timeUpdateInterval) {
        return;
      }
      self.lastTimeUpdateAt = currentTimestamp;

      self.host.broadcast({
        event: self.status,
        epoch: self.epoch++,
        currentTime: videoElement.currentTime
      });
    };
    this.videoElement.addEventListener('timeupdate', this._timeupdateListener);
  }

  close() {
    if (this._pingPongTimeoutId) {
      clearTimeout(this._pingPongTimeoutId);
    }

    this.videoElement.removeEventListener('play', this._playListener);
    this.videoElement.removeEventListener('pause', this._pauseListener);
    this.videoElement.removeEventListener('timeupdate', this._timeupdateListener);

    this.host.close();
  }
}

class VideoGuest {
  epoch = 0;

  maxDelay = 5;

  _pingPong;

  /**
   * Create a VideoGuest instance that is controlled by a Host
   * @param {Guest} guest a Guest object
   * @param {DOMElement} videoElement the DOM element of the controlled video
   */
  constructor(guest, videoElement) {
    this.guest = guest;
    this.videoElement = videoElement;

    const self = this;

    const seekCurrentTime = (t, force) => {
      log.debug(`Seeking the currentTime of the element ${videoElement} to ${t} (force = ${force}).`);
      if (force) {
        videoElement.currentTime = t;
      } else {
        const delay = Math.abs(videoElement.currentTime - t);
        if (delay > self.maxDelay) {
          videoElement.currentTime = t;
        }
      }
    };
    this.guest.on('join', (host) => {
      self._pingPong = new PingPong(10000, (corelationId) => {
        host.send({
          event: 'ping',
          corelationId
        });
      });
      this.guest.on('message', (data) => {
        log.debug(`Message received: ${JSON.stringify(data)}`);
        const { currentTime, epoch: inboundEpoch } = data;
        if (self.epoch && self.epoch >= inboundEpoch) {
          // discard stale events by epoch
          log.debug(`The message ${JSON.stringify(data)} is discarded.`);
          return;
        }
        self.epoch = inboundEpoch;
        switch (data.event) {
          case 'hello':
            if (self.videoElement.src !== data.src) {
              // TODO on('srcmismatch')
              self.close();
            }
            break;
          case 'pong':
            self._pingPong.pong(data.corelationId);
            break;
          case 'play':
            log.info(`The delay between host and guest is ${self._pingPong.getDelaySec()} ms.)`);
            if (currentTime) {
              seekCurrentTime(currentTime + self._pingPong.getDelaySec(), true);
            }
            videoElement.play().catch(() => {});
            break;
          case 'pause':
            if (currentTime) {
              seekCurrentTime(currentTime + self._pingPong.getDelaySec(), true);
            }
            videoElement.pause();
            break;
          case 'timeupdate':
            log.info(`The delay between host and guest is ${self._pingPong.getDelaySec()} ms.)`);
            seekCurrentTime(currentTime + self._pingPong.getDelaySec(), false);
            break;
          default:
            log.debug(`Unknown event ${data.event}`);
            break;
        }
      });
    });
  }

  close() {
    if (this._pingPong) {
      this._pingPong.close();
    }
    this.guest.close();
  }
}

class CheersState {
  constructor(global) {
    this.global = global || window;
  }

  host() {
    log.info('Hosting');
    this._closeCurrentAttendeeIfPresent();

    const videoElements = document.getElementsByTagName('video');
    if (videoElements.length === 0) {
      log.error('Cannot find any <video> element on this page.');
      return;
    }

    const videoHost = new VideoHost(
      new Host(
        new Peer({ host: 'peerjs.92k.de', secure: true })
      ),
      videoElements[0]
    );
    this.global.cheers.current = videoHost;
  }

  join(peerId) {
    log.info(`Joining (peerId = ${peerId})`);
    this._closeCurrentAttendeeIfPresent();

    const videoElements = document.getElementsByTagName('video');
    if (videoElements.length === 0) {
      log.error('Cannot find any <video> element on this page.');
      return;
    }

    const videoGuest = new VideoGuest(
      new Guest(
        peerId,
        new Peer({ host: 'peerjs.92k.de', secure: true })
      ),
      videoElements[0]
    );
    this.global.cheers.current = videoGuest;
  }

  _closeCurrentAttendeeIfPresent() {
    if (this.global.cheers && this.global.cheers.current) {
      log.warn(`There already exists an active ${this.global.cheers.current.constructor.name}.`);
      this.global.cheers.current.close();
      this.global.cheers.current = null;
    }
  }
}

const cheers = new CheersState();
window.cheers = cheers;
