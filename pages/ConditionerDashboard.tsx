import React, { useState, useEffect, useMemo } from 'react';
import { Player, Metric, ScheduleEvent, MetricInputType } from '../types';
import { api } from '../services/api';
import { ICONS } from '../constants';
import PlayerCard from '../components/PlayerCard';
import { Link } from 'react-router-dom';


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-card p-4 rounded-lg flex items-center space-x-4">
        <div className="bg-secondary p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-text-dark text-sm">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

const AllPlayersModal: React.FC<{ players: Player[]; onClose: () => void }> = ({ players, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Tüm Oyuncular</h3>
                    <button onClick={onClose} className="text-text-dark hover:text-text-light text-2xl">&times;</button>
                </div>
                <ul className="space-y-3 max-h-80 overflow-y-auto">
                    {players.map(player => (
                        <li key={player.id}>
                            <Link to={`/player/${player.id}`} onClick={onClose} className="flex items-center space-x-3 p-2 bg-background rounded-md hover:bg-secondary transition-colors">
                                 <img src={player.avatarUrl} alt={player.name} className="w-10 h-10 rounded-full" />
                                 <div>
                                    <p className="font-semibold">{player.name}</p>
                                    <p className="text-sm text-text-dark">{player.position}</p>
                                 </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}


const InjuredPlayersModal: React.FC<{ players: Player[]; onClose: () => void }> = ({ players, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Sakat Oyuncular</h3>
                    <button onClick={onClose} className="text-text-dark hover:text-text-light text-2xl">&times;</button>
                </div>
                <ul className="space-y-3 max-h-80 overflow-y-auto">
                    {players.map(player => (
                        <li key={player.id}>
                           <Link to={`/player/${player.id}`} onClick={onClose} className="flex items-center space-x-3 p-2 bg-background rounded-md hover:bg-secondary transition-colors w-full">
                               <img src={player.avatarUrl} alt={player.name} className="w-10 h-10 rounded-full" />
                               <div>
                                  <p className="font-semibold">{player.name}</p>
                                  <p className="text-sm text-red-400">{player.injury?.description}</p>
                               </div>
                           </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

const ConditionerDashboard: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [leaderboardMetricId, setLeaderboardMetricId] = useState('metric-4');
    const [leaderboardChangeType, setLeaderboardChangeType] = useState<'percent' | 'unit'>('percent');
    const [leaderboardSortOrder, setLeaderboardSortOrder] = useState<'desc' | 'asc'>('desc');
    const [showInjuredModal, setShowInjuredModal] = useState(false);
    const [showAllPlayersModal, setShowAllPlayersModal] = useState(false);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const [playerData, metricsData, scheduleData] = await Promise.all([
                    api.getPlayers(),
                    api.getMetrics(),
                    api.getScheduleEvents()
                ]);
                setPlayers(playerData);
                setMetrics(metricsData.filter(m => m.isActive));
                setSchedule(scheduleData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const injuredPlayers = useMemo(() => players.filter(p => p.injury), [players]);

    const todaysSchedule = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return schedule.filter(event => event.date === today);
    }, [schedule]);

    const leaderboardData = useMemo(() => {
        const data = players.map(player => {
            const relevantMeasurements = player.measurements
                .filter(m => m.metricId === leaderboardMetricId)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (relevantMeasurements.length < 2) {
                return { ...player, improvementPercent: 0, improvementUnit: 0, latestValue: relevantMeasurements[0]?.value };
            }

            const firstValue = relevantMeasurements[0].value;
            const lastValue = relevantMeasurements[relevantMeasurements.length - 1].value;
            
            const improvementUnit = lastValue - firstValue;
            const improvementPercent = firstValue === 0 
                ? (lastValue > 0 ? Infinity : 0)
                : ((lastValue - firstValue) / firstValue) * 100;

            return { 
                ...player, 
                improvementPercent: parseFloat(improvementPercent.toFixed(2)),
                improvementUnit: parseFloat(improvementUnit.toFixed(2)),
                latestValue: lastValue 
            };
        });
        
        const sortKey = leaderboardChangeType === 'percent' ? 'improvementPercent' : 'improvementUnit';
        
        return data
            .filter(p => p.latestValue !== undefined)
            .sort((a, b) => {
                const valA = a[sortKey];
                const valB = b[sortKey];
                return leaderboardSortOrder === 'desc' ? valB - valA : valA - valB;
            })
            .slice(0, 5);
    }, [players, leaderboardMetricId, leaderboardChangeType, leaderboardSortOrder]);


    if (loading) {
        return <div className="text-center p-10">Gösterge paneli yükleniyor...</div>;
    }

    const selectedMetric = metrics.find(m => m.id === leaderboardMetricId);

    return (
        <div className="space-y-6">
            {showInjuredModal && <InjuredPlayersModal players={injuredPlayers} onClose={() => setShowInjuredModal(false)} />}
            {showAllPlayersModal && <AllPlayersModal players={players} onClose={() => setShowAllPlayersModal(false)} />}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <button onClick={() => setShowAllPlayersModal(true)} className="text-left">
                    <StatCard title="Toplam Oyuncu" value={players.length} icon={ICONS.PLAYERS} />
                </button>
                <button onClick={() => injuredPlayers.length > 0 && setShowInjuredModal(true)} className={`text-left ${injuredPlayers.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}>
                    <StatCard title="Sakat Oyuncular" value={injuredPlayers.length} icon={ICONS.INJURY} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-card p-6 rounded-lg space-y-4">
                    <h3 className="text-xl font-bold">Günün Programı</h3>
                    {todaysSchedule.length > 0 ? (
                        <ul className="space-y-3">
                            {todaysSchedule.map(event => (
                                <li key={event.id} className="p-3 bg-background rounded-md">
                                    <p className="font-semibold">{event.time && <span className="text-primary mr-2">{event.time}</span>}{event.title}</p>
                                    <p className="text-sm text-text-dark">{event.description}</p>
                                    <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${event.isTeamEvent ? 'bg-blue-500' : 'bg-green-500'}`}>
                                        {event.isTeamEvent ? 'Takım' : 'Bireysel'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-text-dark">Bugün için planlanmış bir program yok.</p>
                    )}
                </div>
                 <div className="lg:col-span-2 bg-card p-6 rounded-lg">
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Liderlik Tablosu: Gelişim</h3>
                        <div className="flex items-center gap-2">
                             <select 
                                value={leaderboardMetricId} 
                                onChange={e => setLeaderboardMetricId(e.target.value)}
                                className="bg-secondary border border-gray-700 rounded-md p-2 text-sm"
                            >
                                {metrics
                                    .filter(m => m.inputType === MetricInputType.Manual && m.id !== 'metric-1')
                                    .map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                             <select 
                                value={leaderboardChangeType} 
                                onChange={e => setLeaderboardChangeType(e.target.value as 'percent' | 'unit')}
                                className="bg-secondary border border-gray-700 rounded-md p-2 text-sm"
                            >
                                <option value="percent">Yüzde (%)</option>
                                <option value="unit">Birim ({selectedMetric?.unit})</option>
                             </select>
                             <select 
                                value={leaderboardSortOrder} 
                                onChange={e => setLeaderboardSortOrder(e.target.value as 'desc' | 'asc')}
                                className="bg-secondary border border-gray-700 rounded-md p-2 text-sm"
                            >
                                <option value="desc">Artan</option>
                                <option value="asc">Azalan</option>
                             </select>
                        </div>
                    </div>
                    {leaderboardData.length > 0 ? (
                        <ul className="space-y-2">
                           {leaderboardData.map((player, index) => {
                                const isPercent = leaderboardChangeType === 'percent';
                                const value = isPercent ? player.improvementPercent : player.improvementUnit;
                                const isPositive = value > 0;
                                const displayValue = `${isPositive ? '+' : ''}${value.toFixed(2)}${isPercent ? '%' : ` ${selectedMetric?.unit}`}`;
                                return (
                                   <li key={player.id} className="flex items-center justify-between p-2 bg-background rounded-md">
                                       <Link to={`/player/${player.id}`} className="flex items-center space-x-3">
                                           <span className="font-bold text-lg w-6">{index + 1}.</span>
                                           <img src={player.avatarUrl} alt={player.name} className="w-10 h-10 rounded-full" />
                                           <span>{player.name}</span>
                                       </Link>
                                       <div className="text-right">
                                            <span className={`font-bold text-lg ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                               {displayValue}
                                            </span>
                                            <p className="text-xs text-text-dark">Son: {player.latestValue?.toFixed(2)} {selectedMetric?.unit}</p>
                                       </div>
                                   </li>
                               )
                           })}
                        </ul>
                    ) : (
                         <p className="text-text-dark">Gelişim verisi hesaplamak için yeterli ölçüm yok.</p>
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold mb-4">Oyuncular</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {players.map(player => (
                        <PlayerCard key={player.id} player={player} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ConditionerDashboard;