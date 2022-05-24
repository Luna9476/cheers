import React, { useEffect, useRef, useState } from 'react';
import './App.css'
import IconButton from './components/IconButton'
import Hosted from "./components/Hosted";

const CONTENT_MAIN_JS = 'static/js/content.js'

export default function App() {
    const [connectStatus, setConnectStatus] = useState(null);
    const [peerId, setPeerId] = useState(null);


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

    useEffect(() => {
        chrome.storage.local.get('cheers', function (data) {
            setPeerId(data.cheers.peerId);
            setConnectStatus(data.cheers.status);
        });
    });

    chrome.runtime.onMessage.addListener((message) => {
        switch (message.event) {
            case 'hosted':
                const { peerId } = message;
                console.log(`Host peerId = ${peerId}`)
                setPeerId(peerId);
                chrome.storage.local.set({
                    cheers: {
                        status: 'hosted',
                        peerId: peerId
                    }
                });
                break;
            default:
                break;
        }
    });


    const renderStatusComponent = () => {
        switch (connectStatus) {
            case "hosted":
                return (
                    <Hosted peerId={peerId} setStatus={setConnectStatus} setPeerId={setPeerId}/>
                );
            case "join":
                return (
                    <>
                        paste peer id here<input type={"text"}></input>
                    </>
                );
            case "connected":
                return (
                    <>
                        <h1>You are connected</h1>
                    </>
                );
            default:
                return (<>
                    <div className="content">
                        <div>
                            <IconButton id="host" onClick={onHost} startIcon={"home"}>Host</IconButton>
                        </div>
                        <div>
                            <IconButton id="join" onClick={onJoin} startIcon={"rocket_launch"}>Join</IconButton>
                        </div>
                    </div>
                </>);
        }
    }
    return (
        <>
            <header>
                <img className="logo" src="cheers-64x64.png"  alt={"logo"}/>
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

