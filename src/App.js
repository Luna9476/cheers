import React, { useEffect, useState } from 'react';
import './App.css'
// import './js/popup.js'

export default function App() {

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
                        <button id="host">Host</button>
                    </div>
                    <div class="content-divider">
                        <span>or</span>
                    </div>
                    <div class="content-row">
                        <input id="peerId" type="text" placeholder="Host ID" />
                            <button id="join">Join</button>
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

