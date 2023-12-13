import './App.css';
import React from 'react';
import Client from './Client.js';
import PlayerList from "./Components /playerComponent";
import AnwserList from "./Components /anwserComponent";

/**
 * App is the main entrypoint of the react app. It contains a Solace Client
 * that can be connected and disconnected, and used to send and receive messages
 */
const numberOfPlayers = 5;
const prompts = ["The worst time to start a conga line.",
    "Unlikely advice from a fortune cookie.",
    "A terrible superpower: the ability to turn into ___.",
    "The worst advice for a first date.",
    "Terrible name for a band.",
    "Worst prize you can win.",
    "An usual unusual talent to put in your resume.",
    "If like were a video game, what would be the final boss.",
    "Strange location for a first date.",
    "The most unlikely celebrity endorsement.",
    "An inappropriate time to burst into laughter."
]
const randomIndex = Math.floor(Math.random()*prompts.length);
const prompt = prompts[randomIndex];
class Game extends React.Component {
    render() {
        return (
            <div className="Frame1">
                <div className="Background" />
                <div className="prompt-display">
                    <h2 className="Prompt">{prompt}</h2>
                </div>
                <AnwserList numOfPlayers={numberOfPlayers}/>
                <PlayerList numOfPlayers={numberOfPlayers}/>
            </div>
        );
    }

}

export default Game;