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
    const [leaderboardMetricId, setLeaderboardMetricId] = useState('');
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
                const activeMetrics = metricsData.filter(m => m.isActive);
                setMetrics(activeMetrics);
                setSchedule(scheduleData);
                
                // İlk mevcut metric'i seç
                if (activeMetrics.length > 0 && !leaderboardMetricId) {
                    const firstMetric = activeMetrics.find(m => m.inputType === MetricInputType.Manual && m.id !== 'metric-1');
                    if (firstMetric) {
                        setLeaderboardMetricId(firstMetric.id);
                    }
                }
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

    const selectedMetric = metrics.find(m => m.id === leaderboardMetricId);
    
    const leaderboardData = useMemo(() => {
        console.log('🔍 Leaderboard Debug:', {
            leaderboardMetricId,
            selectedMetric: selectedMetric?.name,
            selectedMetricFound: !!selectedMetric,
            allMetrics: metrics.map(m => ({ id: m.id, name: m.name })),
            metricIdExists: metrics.some(m => m.id === leaderboardMetricId),
            players: players.map(p => ({
                name: p.name,
                totalMeasurements: p.measurements.length,
                relevantMeasurements: p.measurements.filter(m => m.metricId === leaderboardMetricId).length,
                allMetricIds: [...new Set(p.measurements.map(m => m.metricId))],
                measurements: p.measurements.map(m => ({ metricId: m.metricId, value: m.value, date: m.date }))
            })),
            // Metric ID eşleştirme kontrolü
            metricIdMatch: {
                selected: leaderboardMetricId,
                available: [...new Set(players.flatMap(p => p.measurements.map(m => m.metricId)))],
                match: players.some(p => p.measurements.some(m => m.metricId === leaderboardMetricId))
            },
            // Detaylı metric ID analizi
            metricIdAnalysis: {
                selectedMetricId: leaderboardMetricId,
                allMetricIds: [...new Set(players.flatMap(p => p.measurements.map(m => m.metricId)))],
                metricIdInMeasurements: players.some(p => p.measurements.some(m => m.metricId === leaderboardMetricId)),
                metricIdInMetrics: metrics.some(m => m.id === leaderboardMetricId)
            },
            // Oyuncu veri durumu
            playerDataStatus: {
                totalPlayers: players.length,
                playersWithMeasurements: players.filter(p => p.measurements.length > 0).length,
                playersWithoutMeasurements: players.filter(p => p.measurements.length === 0).length,
                allMeasurementsCount: players.reduce((sum, p) => sum + p.measurements.length, 0)
            },
            // Veri kaynağı kontrolü
            dataSourceCheck: {
                playersLoaded: players.length > 0,
                metricsLoaded: metrics.length > 0,
                selectedMetricId: leaderboardMetricId,
                selectedMetricName: selectedMetric?.name,
                playersHaveData: players.some(p => p.measurements.length > 0)
            }
        });
        
        // Eğer seçilen metric ID ölçümlerde yoksa, doğru metric ID'yi bul
        let actualMetricId = leaderboardMetricId;
        const hasMeasurements = players.some(p => p.measurements.some(m => m.metricId === leaderboardMetricId));
        
        if (!hasMeasurements) {
            console.log('⚠️ Selected metric ID not found in measurements, trying to find correct one');
            const availableMetricIds = [...new Set(players.flatMap(p => p.measurements.map(m => m.metricId)))];
            console.log('Available metric IDs in measurements:', availableMetricIds);
            
            // Eğer seçilen metric'in adına göre doğru ID'yi bul
            if (selectedMetric) {
                const correctMetric = metrics.find(m => m.name === selectedMetric.name && availableMetricIds.includes(m.id));
                if (correctMetric) {
                    actualMetricId = correctMetric.id;
                    console.log(`✅ Found correct metric ID: ${actualMetricId} for metric: ${selectedMetric.name}`);
                }
            }
        }
        
        const data = players.map(player => {
            const relevantMeasurements = player.measurements
                .filter(m => m.metricId === actualMetricId)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            console.log(`🔍 ${player.name} measurements:`, {
                metricId: leaderboardMetricId,
                total: player.measurements.length,
                relevant: relevantMeasurements.length,
                measurements: relevantMeasurements.map(m => ({ value: m.value, date: m.date })),
                allMeasurements: player.measurements.map(m => ({ metricId: m.metricId, value: m.value, date: m.date })),
                // Metric ID eşleştirme kontrolü
                metricIdMatch: {
                    selected: leaderboardMetricId,
                    available: [...new Set(player.measurements.map(m => m.metricId))],
                    match: player.measurements.some(m => m.metricId === leaderboardMetricId)
                },
                // Oyuncu veri durumu
                playerData: {
                    id: player.id,
                    name: player.name,
                    hasMeasurements: player.measurements.length > 0,
                    measurementCount: player.measurements.length,
                    allMetricIds: [...new Set(player.measurements.map(m => m.metricId))]
                }
            });

            if (relevantMeasurements.length === 0) {
                console.log(`⚠️ ${player.name} has no measurements for metric ${leaderboardMetricId}`);
                return { ...player, improvementPercent: 0, improvementUnit: 0, latestValue: undefined };
            }

            const latestValue = relevantMeasurements[relevantMeasurements.length - 1].value;
            console.log(`✅ ${player.name} latest value: ${latestValue}`);
            
            // Eğer sadece 1 ölçüm varsa, gelişim hesaplama
            if (relevantMeasurements.length < 2) {
                return { 
                    ...player, 
                    improvementPercent: 0, 
                    improvementUnit: 0, 
                    latestValue: latestValue 
                };
            }

            const firstValue = relevantMeasurements[0].value;
            const lastValue = latestValue;
            
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
        
        // Eğer "Son Değer" seçilmişse, son değerlere göre sırala
        if (leaderboardChangeType === 'latest') {
            console.log('🔍 Latest Value Debug:', {
                leaderboardMetricId,
                data: data.map(p => ({ 
                    name: p.name, 
                    latestValue: p.latestValue, 
                    measurements: p.measurements?.filter(m => m.metricId === leaderboardMetricId)?.length || 0
                }))
            });
            
            const filteredData = data.filter(p => p.latestValue !== undefined);
            console.log('🔍 Filtered Data:', {
                total: data.length,
                withLatestValue: filteredData.length,
                players: data.map(p => ({
                    name: p.name,
                    hasLatestValue: p.latestValue !== undefined,
                    latestValue: p.latestValue
                }))
            });
            
            // Eğer hiç veri yoksa, oyuncuları veri olmadan göster
            if (filteredData.length === 0) {
                console.log('⚠️ No data found for selected metric');
                console.log('🔍 All players data:', data.map(p => ({
                    name: p.name,
                    latestValue: p.latestValue,
                    hasMeasurements: p.measurements.length > 0
                })));
                
                // Veri olmayan oyuncuları göster
                const playersWithoutData = players.slice(0, 5).map(p => ({
                    ...p,
                    latestValue: undefined,
                    improvementPercent: 0,
                    improvementUnit: 0
                }));
                
                console.log('📊 Showing players without data:', playersWithoutData.map(p => ({
                    name: p.name,
                    hasMeasurements: p.measurements.length > 0
                })));
                
                console.log('💡 Solution: Players need measurements. Visit player profiles to add data.');
                
                return playersWithoutData;
            }
            
            return filteredData
                .sort((a, b) => {
                    const valA = a.latestValue || 0;
                    const valB = b.latestValue || 0;
                    return leaderboardSortOrder === 'desc' ? valB - valA : valA - valB;
                })
                .slice(0, 5);
        }
        
        // Gelişim verisi için sıralama
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
                                onChange={e => setLeaderboardChangeType(e.target.value as 'percent' | 'unit' | 'latest')}
                                className="bg-secondary border border-gray-700 rounded-md p-2 text-sm"
                            >
                                <option value="percent">Yüzde (%)</option>
                                <option value="unit">Birim ({selectedMetric?.unit})</option>
                                <option value="latest">Son Değer</option>
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
                                const isLatest = leaderboardChangeType === 'latest';
                                const isPercent = leaderboardChangeType === 'percent';
                                
                                let displayValue, displayClass;
                                
                                if (isLatest) {
                                    if (player.latestValue !== undefined && player.latestValue !== null) {
                                        displayValue = `${player.latestValue.toFixed(2)} ${selectedMetric?.unit || ''}`;
                                        displayClass = 'text-primary';
                                    } else {
                                        displayValue = 'Veri Yok';
                                        displayClass = 'text-gray-400';
                                    }
                                } else {
                                    const value = isPercent ? player.improvementPercent : player.improvementUnit;
                                    const isPositive = value > 0;
                                    displayValue = `${isPositive ? '+' : ''}${value.toFixed(2)}${isPercent ? '%' : ` ${selectedMetric?.unit}`}`;
                                    displayClass = isPositive ? 'text-green-400' : 'text-red-400';
                                }
                                
                                return (
                                   <li key={player.id} className="flex items-center justify-between p-2 bg-background rounded-md">
                                       <Link to={`/player/${player.id}`} className="flex items-center space-x-3">
                                           <span className="font-bold text-lg w-6">{index + 1}.</span>
                                           <img src={player.avatarUrl} alt={player.name} className="w-10 h-10 rounded-full" />
                                           <span>{player.name}</span>
                                       </Link>
                                       <div className="text-right">
                                            <span className={`font-bold text-lg ${displayClass}`}>
                                               {displayValue}
                                            </span>
                                            {!isLatest && player.latestValue !== undefined && (
                                                <p className="text-xs text-text-dark">Son: {player.latestValue?.toFixed(2)} {selectedMetric?.unit}</p>
                                            )}
                                            {isLatest && player.latestValue === undefined && (
                                                <p className="text-xs text-gray-400">Ölçüm eklemek için tıklayın</p>
                                            )}
                                       </div>
                                   </li>
                               )
                           })}
                        </ul>
                    ) : (
                         <div className="text-center p-4">
                            <p className="text-text-dark mb-2">
                                {leaderboardChangeType === 'latest' 
                                    ? 'Bu metrik için ölçüm verisi bulunamadı.' 
                                    : 'Gelişim verisi hesaplamak için yeterli ölçüm yok.'
                                }
                            </p>
                            <p className="text-xs text-gray-500">
                                Seçilen metrik: {selectedMetric?.name || 'Bilinmiyor'} ({leaderboardMetricId})
                            </p>
                            <p className="text-xs text-gray-500">
                                Toplam oyuncu: {players.length}, Toplam metrik: {metrics.length}
                            </p>
                            <p className="text-xs text-red-500 mt-2">
                                💡 Bu oyuncular için henüz ölçüm verisi girilmemiş. Ölçüm eklemek için oyuncu profilini ziyaret edin.
                            </p>
                            <div className="mt-4 space-y-2">
                                {players.slice(0, 3).map(player => (
                                    <div key={player.id} className="flex items-center justify-center space-x-2 text-sm">
                                        <img src={player.avatarUrl} alt={player.name} className="w-6 h-6 rounded-full" />
                                        <span className="text-text-dark">{player.name}</span>
                                        <span className="text-gray-400">- Veri Yok</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    <strong>Çözüm:</strong> Oyuncu profillerini ziyaret edip ölçüm verisi ekleyin. 
                                    Liderlik tablosu otomatik olarak güncellenecektir.
                                </p>
                            </div>
                         </div>
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