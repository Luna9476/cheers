export function host() {
    console.log('host');

    const state = {
        peer: null,
        peerId: null,
        guests: []
    };

    const videoElement = document.getElementsByTagName('video')[0];
    if (!videoElement) {
        console.log('Cannot find the video element.');
        return;
    }

    var playStatus = 'play';
    var epoch = 0;

    const playEventListener = function () {
        playStatus = 'play';
        for (const guest of state.guests) {
            guest.send({
                event: 'play',
                epoch: epoch++,
                currentTime: videoElement.currentTime
            });
        }
    };

    const pauseEventListener = function () {
        playStatus = 'pause';
        for (const guest of state.guests) {
            guest.send({
                event: 'pause',
                epoch: epoch++,
                currentTime: videoElement.currentTime
            });
        }
    };

    const waitingEventListener = function () {
        console.log('waiting...');
    };

    const timeUpdateInterval = 10000;
    var lastTimeUpdateAt = null;

    const timeUpdateEventListener = function () {
        var currentTimestamp = new Date().getTime();
        if (lastTimeUpdateAt && currentTimestamp - lastTimeUpdateAt < timeUpdateInterval) {
            return;
        }
        lastTimeUpdateAt = currentTimestamp;
        for (const guest of state.guests) {
            guest.send({
                event: playStatus,
                epoch: epoch++,
                currentTime: videoElement.currentTime
            });
        }
    };

    const peer = new Peer({ host: "peerjs.92k.de", secure: true });
    peer.on('open', function (peerId) {
        console.log('Connected to the peer server (Peer ID = ' + peerId + ')');
        state.peer = peer;
        state.peerId = peerId;

        videoElement.addEventListener('play', playEventListener);
        videoElement.addEventListener('pause', pauseEventListener);
        videoElement.addEventListener('timeupdate', timeUpdateEventListener);
        videoElement.addEventListener('waiting', waitingEventListener);

        peer.on('connection', function (guest) {
            console.log('Peer connected.');
            state.guests.push(guest);

            function disconnectAndRemove() {
                guest.disconnect();
                state.guests = state.guests.filter(e => e !== guest);
            }
            guest.on('close', disconnectAndRemove);
            guest.on('disconnect', disconnectAndRemove);

            guest.on('data', function (data) {
                // data from guest
                console.log('Data received: ' + data);
            });
        });
    });

    peer.on('close', function () {
        for (const guest of state.guests) {
            guest.disconnect();
        }
        videoElement.removeEventListener('play', playEventListener);
        videoElement.removeEventListener('pause', pauseEventListener);
        videoElement.removeEventListener('timeupdate', timeUpdateEventListener);
        videoElement.removeEventListener('waiting', waitingEventListener);
        state.peer = null;
        state.peerId = null;
        state.guests = [];
    });
}

export function join(hostPeerId) {
    console.log('join(' + hostPeerId + ')');

    const state = {
        peer: null,
        peerId: null,
        host: null
    };

    const videoElement = document.getElementsByTagName('video')[0];
    if (!videoElement) {
        console.log('Cannot find the video element.');
        return;
    }

    const maxDelay = 5;

    const seekCurrentTime = function (currentTime, force) {
        if (force) {
            videoElement.currentTime = currentTime;
        } else {
            const delay = Math.abs(videoElement.currentTime - currentTime);
            if (delay > maxDelay) {
                videoElement.currentTime = currentTime;
            }
        }
    };

    var epoch = null;

    const peer = new Peer({ host: "peerjs.92k.de", secure: true });
    peer.on('open', function (peerId) {
        console.log('Connected to the peer server (Peer ID = ' + peerId + ')');
        state.peer = peer;
        state.peerId = peerId;

        const conn = peer.connect(hostPeerId);
        conn.on('open', function () {
            console.log('Peer connected.');
            state.conn = conn;
            conn.on('data', function (data) {
                // data from host
                console.log('Data received: ' + JSON.stringify(data));
                const eventType = data.event;
                const currentTime = data.currentTime;
                const inboundEpoch = data.inboundEpoch;
                if (epoch && epoch >= inboundEpoch) {
                    // discard stale events by epoch
                    return;
                }
                epoch = inboundEpoch;
                switch (eventType) {
                    case 'play':
                        seekCurrentTime(currentTime, true);
                        videoElement.play().catch(e => {});
                        break;
                    case 'pause':
                        seekCurrentTime(currentTime, true);
                        break;
                    case 'timeupdate':
                        seekCurrentTime(currentTime, false);
                        break;
                }
            })
        });
    });

    peer.on('close', function () {
        state.peer = null;
        state.peerId = null;
        state.host.disconnect();
        state.host = [];
    });
}
