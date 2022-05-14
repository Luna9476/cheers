import { getLogger } from './SimpleLogger';

const log = getLogger('PingPong');

export default class PingPong {
  _intervalId = null;

  _corelationId = 0;

  _lastPingTimestamp;

  _delaySum = 0;

  _delayCount = 0;

  constructor(timeoutDelay, ping) {
    const self = this;
    this._timeoutId = setInterval(() => {
      self._lastPingTimestamp = new Date().getTime();
      log.debug('ping');
      ping(++self._corelationId);
    }, timeoutDelay);
  }

  pong(corelationId) {
    if (corelationId !== this._corelationId) {
      log.debug('pong (failed due to corelation ids are mismatched)');
      return;
    }
    this._delaySum += (new Date().getTime() - this._lastPingTimestamp);
    ++this._delayCount;
    log.debug(`pong (delay = ${this.getDelaySec()} sec)`);
  }

  getDelaySec() {
    if (this._delayCount <= 0) {
      return 0;
    }
    return this._delaySum / this._delayCount / 1000;
  }

  close() {
    clearInterval(this._intervalId);
  }
}
