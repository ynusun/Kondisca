
import React from 'react';
import { Link } from 'react-router-dom';
import { Player } from '../types';
import { ICONS } from '../constants';

const PlayerCard: React.FC<{ player: Player }> = ({ player }) => {
    return (
        <Link to={`/player/${player.id}`} className="block bg-card rounded-lg p-4 hover:ring-2 hover:ring-primary transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex items-center space-x-4">
                <img src={player.avatarUrl} alt={player.name} className="w-16 h-16 rounded-full"/>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-text-light">{player.name}</h3>
                    <p className="text-sm text-text-dark">{player.position}</p>
                </div>
                {player.injury && <div title={player.injury.description}>{ICONS.INJURY}</div>}
            </div>
        </Link>
    );
};

export default PlayerCard;