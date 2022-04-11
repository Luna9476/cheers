import React, { useEffect, useRef, useState } from 'react';
import './App.css'
import './js/popup.js'

export default function App() {
    const onHost = async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: host,
        });
    }

    const onJoin = async () => {
        var peerId = peerId.value;
        if (peerId) {
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: join,
                args: [peerId]
            });
        }
    }

    const peerId = useRef(null)

    return (
        <div className="App">
            <body>
                <header>
                    <img class="logo" src="cheers-64x64.png" />
                    <h1>Cheers!</h1>
                    <h2>Watch videos with friends.</h2>
                </header>

                <div class="content">
                    <div class="content-row">
                        <button id="host" onClick={onHost}>Host</button>
                    </div>
                    <div class="content-divider">
                        <span>or</span>
                    </div>
                    <div class="content-row">
                        <input id="peerId" type="text" placeholder="Host ID" ref={peerId}/>
                        <button id="join" onClick={onJoin}>Join</button>
                    </div>
                </div>
                <footer>
                    <a target="_blank" href="https://github.com/predatorray">About</a>
                    &middot;
                    <a target="_blank" href="https://github.com/predatorray">Report</a>
                    &middot;
                    <a target="_blank" href="https://github.com/predatorray">Author</a>
                </footer>
            </body>
        </div>
    );
}

