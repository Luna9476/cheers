import React from "react";

export default function Hosted({peerId, setPeerId, setStatus}) {
    const onCopy = () => {
        navigator.clipboard.writeText(peerId).then(r => alert("copied"));
    }

    const onExit = () => {
      setStatus(null);
      setPeerId(null);
      chrome.storage.local.clear();
    }

    return (
        <div className="host-body">
            <p>Your peer id is: </p>
            <a className={"link float-right"} onClick={onCopy}>
                <i className="material-icons-outlined">content_copy</i></a>
            <div className="id-content">
                {peerId}
            </div>
            <a className={"link float-right"} onClick={onExit}>
                <i className="material-icons-outlined">exit_to_app</i>
            </a>
        </div>
    )
}