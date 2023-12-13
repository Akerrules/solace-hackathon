import React from 'react';


const PlayerList = ({ numOfPlayers }) => {
    const players = Array.from({length: numOfPlayers}, (_, index) => index + 1);

    return (
        <div className="player-list" style={{display:'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
            {players.map(player =>(
                <div key={player} className="player-card" style={{backgroundColor: 'white', width: 400, height: 100, margin: 100, marginTop: 50, display: 'flex', justifyContent: 'center'}}>
                    <h2>Player {player}
                        <p>Score:</p>
                    </h2>
                </div>

            ))}

        </div>
    );
};

export default PlayerList;