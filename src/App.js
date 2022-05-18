import React, { useEffect, useRef, useState } from 'react';
import './App.css'
import IconButton from './components/IconButton'

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
    const [connectStatus, setConnectStatus] = useState(null);


    const onHost = async () => {
        await loadContent();
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => { window.cheers.host() }
        });
        setConnectStatus("hosted");
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
        setConnectStatus("join")
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

    const renderStatusComponent = () => {
        switch (connectStatus) {
            case "hosted":
                return (<>
                    <h1>You are in the room</h1>
                    <h2>Copy and paste the peerId</h2>
                </>)
            case "join":
                return (
                    <>
                        paste peer id here<input type={"text"}></input>
                    </>
                )
            case "connected":
                return (
                    <>
                        <h1>You are connected</h1>
                    </>
                )
            default:
                return (<>
                    <div className="content">
                        <div>
                            <IconButton id="host" onClick={onHost} startIcon={"home"}>Host</IconButton>
                        </div>
                        <div className="content-divider">
                            <span>or</span>
                        </div>
                        <div>
                            <IconButton id="join" onClick={onJoin} startIcon={"rocket_launch"}>Join</IconButton>
                        </div>
                    </div>
                </>)
        }
    }
    return (
        <>
            <header>
                <img className="logo" src="cheers-64x64.png" />
                <h1>Cheers!</h1>
                <h2>Watch videos with friends.</h2>
            </header>
            {renderStatusComponent()}
            <footer>
                <a target="_blank" href="https://github.com/predatorray">About</a>

                <a target="_blank" href="https://github.com/predatorray">Report</a>

                <a target="_blank" href="https://github.com/predatorray">Author</a>
            </footer>
        </>

    );
}

