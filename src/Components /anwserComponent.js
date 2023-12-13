import React from 'react';


const AnwserList = ({ numOfPlayers }) => {
    const players = Array.from({length: numOfPlayers}, (_, index) => index + 1);

    return (
        <div className="player-list" style={{display:'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
            {players.map(player =>(
                <div key={player} className="player-card" style={{backgroundColor: 'white', width: 300, height: 100, marginTop: 200, display: 'flex', justifyContent: 'center'}}>
                    <p> Anwser to prompt! </p>
                </div>
            ))}
        </div>
    );
};

export default AnwserList;