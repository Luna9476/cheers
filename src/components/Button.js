import React from 'react';
import './style.css';

export default function IconButton(props) {
    return (
        <>

            <button>
                <span className='material-icons button-icon'>{props.startIcon}</span>
                {props.children}
            </button>
        </>

    );
}