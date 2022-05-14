import React, { useEffect, useRef, useState } from 'react';
import './App.css'

const CONTENT_MAIN_JS = 'static/js/content.js'

export default function App() {
    const loadContent = async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        let [execution] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => { return window.cheers != null; }
        });
        if (!execution.result) {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: [CONTENT_MAIN_JS],
            });
        }
    }

    const onHost = async () => {
        await loadContent();
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => { window.cheers.host() }
        });
    }

    const onJoin = async () => {
        await loadContent();
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const peerId = document.getElementById('peerId').value;
        if (peerId) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: (peerId) => { window.cheers.join(peerId) },
                args: [peerId]
            });
        }
    }

    chrome.runtime.onMessage.addListener((message) => {
        switch (message.event) {
            case 'hosted':
                const { peerId } = message;
                console.log(`Host peerId = ${peerId}`)
                break
            default:
                break;
        }
    });

    const peerId = useRef(null)

    return (
        <>
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
                    <input id="peerId" type="text" placeholder="Host ID" ref={peerId} />
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

        </>

    );
}

