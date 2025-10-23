import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Player, Metric, Note } from '../types';
import { api } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ICONS } from '../constants';

const PlayerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [playerData, setPlayerData] = useState<Player | null>(null);
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [loading, setLoading] = useState(true);
    const [leaderboardMetricId, setLeaderboardMetricId] = useState('metric-4');

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // Find the player data corresponding to the logged-in user
                 const allPlayersData = await api.getPlayers();
                 const currentPlayer = allPlayersData.find(p => p.id === 'player-1'); // Mock: assuming user-2 corresponds to player-1
                const metricsData = await api.getMetrics();
                setPlayerData(currentPlayer || null);
                setAllPlayers(allPlayersData);
                setMetrics(metricsData.filter(m => m.isActive));
            } catch (error) {
                console.error("Failed to fetch player data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const hasCompletedTodaysSurvey = useMemo(() => {
        if (!playerData) return false;
        const todayString = new Date().toDateString();
        return playerData.dailySurveys.some(survey => new Date(survey.date).toDateString() === todayString);
    }, [playerData]);

    const publicNotes = useMemo(() => {
        if (!playerData) return [];
        return playerData.notes.filter(note => note.isPublic).slice().reverse();
    }, [playerData]);
    
     const leaderboardData = useMemo(() => {
        return allPlayers.map(player => {
            const relevantMeasurements = player.measurements
                .filter(m => m.metricId === leaderboardMetricId)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            if (relevantMeasurements.length < 2) return { ...player, improvement: 0, latestValue: relevantMeasurements[0]?.value };
            
            const firstValue = relevantMeasurements[0].value;
            const lastValue = relevantMeasurements[relevantMeasurements.length - 1].value;
            
            if (firstValue === 0) return { ...player, improvement: lastValue > 0 ? Infinity : 0, latestValue: lastValue };

            const improvement = ((lastValue - firstValue) / firstValue) * 100;
            return { ...player, improvement: parseFloat(improvement.toFixed(1)), latestValue: lastValue };
        })
        .filter(p => p.latestValue !== undefined)
        .sort((a, b) => b.improvement - a.improvement)
        .slice(0, 5);
    }, [allPlayers, leaderboardMetricId]);


    if (loading) return <div className="text-center p-10">Veriler yükleniyor...</div>;
    if (!playerData) return <div className="text-center p-10">Oyuncu verileri bulunamadı.</div>;
    
    const selectedMetric = metrics.find(m => m.id === leaderboardMetricId);

    return (
        <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg">
                <h2 className="text-3xl font-bold">Hoşgeldin, {playerData.name}!</h2>
                <p className="text-text-dark">Günün nasıl geçiyor? İşte senin için genel bir bakış.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-card p-6 rounded-lg space-y-4">
                    <h3 className="text-xl font-bold">Bugünkü Görevlerin</h3>
                    <div className={`p-4 rounded-lg flex justify-between items-center ${hasCompletedTodaysSurvey ? 'bg-green-500/20 text-green-300' : 'bg-primary/20 text-orange-300'}`}>
                        <div>
                            <p className="font-bold">Günlük Sağlık Anketi</p>
                            <p className="text-sm">{hasCompletedTodaysSurvey ? 'Bugün için tamamlandı!' : 'Doldurman gerekiyor.'}</p>
                        </div>
                        {!hasCompletedTodaysSurvey && (
                            <Link to="/survey" className="bg-primary text-white font-bold py-1 px-4 rounded-lg hover:bg-primary-dark transition text-sm">
                                Doldur
                            </Link>
                        )}
                    </div>
                    <h3 className="text-xl font-bold pt-4">Koç Notları</h3>
                     <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                        {publicNotes.length > 0 ? publicNotes.map(note => (
                            <div key={note.id} className="p-3 bg-background rounded-md">
                                <p className="text-sm">{note.text}</p>
                                <span className="text-xs text-text-dark">{new Date(note.date).toLocaleDateString('tr-TR')}</span>
                            </div>
                        )) : (
                            <p className="text-text-dark text-sm">Henüz seninle paylaşılan bir not yok.</p>
                        )}
                    </div>
                </div>

                 <div className="lg:col-span-2 bg-card p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Liderlik Tablosu</h3>
                         <select 
                            value={leaderboardMetricId} 
                            onChange={e => setLeaderboardMetricId(e.target.value)}
                            className="bg-secondary border border-gray-700 rounded-md p-2 text-sm"
                        >
                            {metrics
                                .filter(m => m.inputType === 'manual' && m.id !== 'metric-1')
                                .map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                     <ul className="space-y-2">
                       {leaderboardData.map((player, index) => (
                           <li key={player.id} className={`flex items-center justify-between p-2 rounded-md ${player.id === playerData.id ? 'bg-primary/30' : 'bg-background'}`}>
                               <div className="flex items-center space-x-3">
                                   <span className="font-bold text-lg w-6">{index + 1}.</span>
                                   <img src={player.avatarUrl} alt={player.name} className="w-10 h-10 rounded-full" />
                                   <span>{player.id === playerData.id ? 'Sen' : player.name}</span>
                               </div>
                               <div className="text-right">
                                    <span className={`font-bold text-lg ${player.improvement > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                       {player.improvement >= 0 ? '+' : ''}{player.improvement}%
                                    </span>
                                    <p className="text-xs text-text-dark">Son: {player.latestValue} {selectedMetric?.unit}</p>
                               </div>
                           </li>
                       ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PlayerDashboard;
