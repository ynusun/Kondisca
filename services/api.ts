import { User, UserRole, Player, Metric, MetricInputType, Measurement, ScheduleEvent, Note, DailySurvey, Injury, SurveyQuestion } from '../types';
import { supabaseApi } from './supabaseApi';

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

// Mock Data
const MOCK_USERS: User[] = [
    { id: 'user-1', name: 'Coach Davis', email: 'coach@kondisca.com', role: UserRole.Conditioner, avatarUrl: 'https://picsum.photos/seed/coach/100/100' },
    { id: 'user-2', name: 'Alex Johnson', email: 'player@kondisca.com', role: UserRole.Player, avatarUrl: 'https://picsum.photos/seed/player1/100/100' },
];

let MOCK_METRICS: Metric[] = [
    { id: 'metric-1', name: 'Boy', unit: 'cm', inputType: MetricInputType.Manual, isActive: true, showInRadar: false },
    { id: 'metric-2', name: 'Kilo', unit: 'kg', inputType: MetricInputType.Manual, isActive: true, showInRadar: true },
    { id: 'metric-3', name: 'Yağ Oranı', unit: '%', inputType: MetricInputType.Manual, isActive: true, showInRadar: true },
    { id: 'metric-4', name: 'Dikey Sıçrama', unit: 'cm', inputType: MetricInputType.Manual, isActive: true, showInRadar: true },
    { id: 'metric-5', name: 'Squat 1RM', unit: 'kg', inputType: MetricInputType.Manual, isActive: true, showInRadar: true },
    { id: 'metric-6', name: 'Vücut Kitle İndeksi', unit: 'Hesaplama Sonucu', inputType: MetricInputType.Calculated, formula: '[Kilo] / (([Boy]/100) * ([Boy]/100))', isActive: true, showInRadar: true },
];

let MOCK_SURVEY_QUESTIONS: SurveyQuestion[] = [
    { id: 'sq-1', label: 'Dün gece kaç saat uyudun?', key: 'sleepHours', isActive: true, type: 'number' },
    { id: 'sq-2', label: 'Uyku kaliteni nasıl puanlarsın? (1 - Kötü, 9 - Mükemmel)', key: 'sleepQuality', isActive: true, type: 'range' },
    { id: 'sq-3', label: 'Kas ağrı durumunu nasıl puanlarsın? (1 - Ağrı Yok, 9 - Çok Şiddetli)', key: 'soreness', isActive: true, type: 'range' },
    { id: 'sq-4', label: 'Vücudunda belirli bir ağrı var mı? Varsa nerede?', key: 'painDetails', isActive: true, type: 'textarea' },
];


const generateMeasurements = (metricId: string, trend: 'up' | 'down' | 'stable', baseValue: number) => {
    const measurements: Measurement[] = [];
    for (let i = 0; i < 10; i++) {
        let value = baseValue;
        if (trend === 'up') value += i * (baseValue * 0.02);
        if (trend === 'down') value -= i * (baseValue * 0.02);
        value += (Math.random() - 0.5) * (baseValue * 0.01);
        
        measurements.push({
            id: `m-${metricId}-${i}`,
            metricId,
            value: parseFloat(value.toFixed(2)),
            date: new Date(2023, i, 15).toISOString(),
        });
    }
    return measurements;
}

const generateDailySurveys = (baseSleep: number, baseQuality: number, baseSoreness: number) => {
    const surveys: DailySurvey[] = [];
    for (let i = 0; i < 10; i++) {
        surveys.push({
            date: new Date(2023, i, 15).toISOString(),
            sleepHours: parseFloat((baseSleep + (Math.random() - 0.5)).toFixed(2)),
            sleepQuality: Math.max(1, Math.min(9, Math.round(baseQuality + (Math.random() - 0.5) * 2))),
            soreness: Math.max(1, Math.min(9, Math.round(baseSoreness + (Math.random() - 0.5) * 2))),
        });
    }
    return surveys;
}

let MOCK_PLAYERS: Player[] = [
    { id: 'player-1', name: 'Alex Johnson', avatarUrl: 'https://picsum.photos/seed/player1/200/200', position: 'Point Guard', 
        email: 'alex.j@example.com', phone: '555-0101', birthDate: '1998-05-20T00:00:00.000Z',
        measurements: [
            ...generateMeasurements('metric-1', 'stable', 192),
            ...generateMeasurements('metric-2', 'up', 88),
            ...generateMeasurements('metric-3', 'down', 12),
            ...generateMeasurements('metric-4', 'up', 75),
            ...generateMeasurements('metric-5', 'up', 140),
        ],
        notes: [
            { id: 'note-1', playerId: 'player-1', text: 'Sıçrama tekniği üzerinde çalışıldı. Patlayıcılık artıyor.', date: new Date(2023, 8, 20).toISOString(), isPublic: true, authorId: 'user-1'},
            { id: 'note-2', playerId: 'player-1', text: 'Diyet programına uyum konusunda motive edilmesi gerekiyor.', date: new Date(2023, 7, 5).toISOString(), isPublic: false, authorId: 'user-1'}
        ],
        dailySurveys: generateDailySurveys(8, 7, 3),
        injury: null,
        injuryHistory: [],
    },
    { id: 'player-2', name: 'Ben Carter', avatarUrl: 'https://picsum.photos/seed/player2/200/200', position: 'Shooting Guard', 
        email: 'ben.c@example.com', phone: '555-0102', birthDate: '1999-08-15T00:00:00.000Z',
        measurements: [
            ...generateMeasurements('metric-1', 'stable', 198),
            ...generateMeasurements('metric-2', 'stable', 95),
            ...generateMeasurements('metric-3', 'down', 10),
            ...generateMeasurements('metric-4', 'up', 82),
            ...generateMeasurements('metric-5', 'up', 155),
        ],
        notes: [],
        dailySurveys: generateDailySurveys(7.5, 8, 2),
        injury: { id: 'injury-2', description: 'Sol omuz zorlanması', estimatedRecovery: '2 hafta', date: new Date(2024, 5, 1).toISOString() },
        injuryHistory: [
            { id: 'injury-1', description: 'Sağ ayak bileği burkulması', estimatedRecovery: '1 hafta dinlenme', date: new Date(2023, 5, 10).toISOString(), recoveryDate: new Date(2023, 5, 17).toISOString() },
            { id: 'injury-2', description: 'Sol omuz zorlanması', estimatedRecovery: '2 hafta', date: new Date(2024, 5, 1).toISOString() }
        ]
    },
    { id: 'player-3', name: 'Chris Lee', avatarUrl: 'https://picsum.photos/seed/player3/200/200', position: 'Center', 
        email: 'chris.l@example.com', phone: '555-0103', birthDate: '1997-01-30T00:00:00.000Z',
        measurements: [
            ...generateMeasurements('metric-1', 'stable', 210),
            ...generateMeasurements('metric-2', 'up', 115),
            ...generateMeasurements('metric-3', 'stable', 15),
            ...generateMeasurements('metric-4', 'stable', 65),
            ...generateMeasurements('metric-5', 'up', 180),
        ],
        notes: [],
        dailySurveys: generateDailySurveys(9, 6, 5),
        injury: null,
        injuryHistory: [],
    },
];

const getTodayString = () => new Date().toISOString().split('T')[0];

let MOCK_SCHEDULE_EVENTS: ScheduleEvent[] = [
    { id: 'event-1', date: getTodayString(), time: '10:00', title: 'Takım Ağırlık Antrenmanı', description: 'Tüm vücut kuvvet çalışması.', isTeamEvent: true, playerIds: []},
    { id: 'event-2', date: getTodayString(), time: '14:30', title: 'Şut Antrenmanı', description: 'Ben ve Alex için özel şut drilleri.', isTeamEvent: false, playerIds: ['player-1', 'player-2']},
];


// API Simulation
const simulateDelay = <T,>(data: T): Promise<T> => {
    return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), 500));
}

export const api = {
    login: async (email: string, password: string): Promise<User | null> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.login(email, password);
            } catch (error) {
                console.error('Supabase login error:', error);
                return null;
            }
        }
        
        // Fallback to mock data
        const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        return simulateDelay(user || null);
    },
    getPlayers: async (): Promise<Player[]> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.getPlayers();
            } catch (error) {
                console.error('Supabase getPlayers error:', error);
                return simulateDelay(MOCK_PLAYERS);
            }
        }
        return simulateDelay(MOCK_PLAYERS);
    },
    getPlayerDetails: async (id: string): Promise<Player | undefined> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.getPlayerDetails(id);
            } catch (error) {
                console.error('Supabase getPlayerDetails error:', error);
                const player = MOCK_PLAYERS.find(p => p.id === id);
                return simulateDelay(player);
            }
        }
        const player = MOCK_PLAYERS.find(p => p.id === id);
        return simulateDelay(player);
    },
    getMetrics: async (): Promise<Metric[]> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.getMetrics();
            } catch (error) {
                console.error('Supabase getMetrics error:', error);
                return simulateDelay(MOCK_METRICS);
            }
        }
        return simulateDelay(MOCK_METRICS);
    },
    addMetric: async (metric: Omit<Metric, 'id'>): Promise<Metric> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.addMetric(metric);
            } catch (error) {
                console.error('Supabase addMetric error:', error);
                const newMetric: Metric = { ...metric, id: `metric-${Date.now()}`, showInRadar: metric.showInRadar ?? false };
                MOCK_METRICS = [...MOCK_METRICS, newMetric];
                return simulateDelay(newMetric);
            }
        }
        const newMetric: Metric = { ...metric, id: `metric-${Date.now()}`, showInRadar: metric.showInRadar ?? false };
        MOCK_METRICS = [...MOCK_METRICS, newMetric];
        return simulateDelay(newMetric);
    },
    updateMetric: async (metricId: string, updates: Partial<Metric>): Promise<Metric> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.updateMetric(metricId, updates);
            } catch (error) {
                console.error('Supabase updateMetric error:', error);
                let updatedMetric: Metric | undefined;
                MOCK_METRICS = MOCK_METRICS.map(m => {
                    if (m.id === metricId) {
                        updatedMetric = { ...m, ...updates };
                        return updatedMetric;
                    }
                    return m;
                });
                if (!updatedMetric) throw new Error("Metric not found");
                return simulateDelay(updatedMetric);
            }
        }
        let updatedMetric: Metric | undefined;
        MOCK_METRICS = MOCK_METRICS.map(m => {
            if (m.id === metricId) {
                updatedMetric = { ...m, ...updates };
                return updatedMetric;
            }
            return m;
        });
        if (!updatedMetric) throw new Error("Metric not found");
        return simulateDelay(updatedMetric);
    },
    deleteMetric: async (metricId: string): Promise<{ success: boolean }> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.deleteMetric(metricId);
            } catch (error) {
                console.error('Supabase deleteMetric error:', error);
                MOCK_METRICS = MOCK_METRICS.filter(m => m.id !== metricId);
                return simulateDelay({ success: true });
            }
        }
        MOCK_METRICS = MOCK_METRICS.filter(m => m.id !== metricId);
        return simulateDelay({ success: true });
    },
    addMultipleMeasurements: async (playerId: string, measurements: Omit<Measurement, 'id'>[]): Promise<Player> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.addMultipleMeasurements(playerId, measurements);
            } catch (error) {
                console.error('Supabase addMultipleMeasurements error:', error);
                let updatedPlayer: Player | undefined;
                MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
                    if (p.id === playerId) {
                        const newMeasurements = measurements.map((m, i) => ({ ...m, id: `m-${Date.now()}-${i}` }));
                        const updatedMeasurements = [...p.measurements, ...newMeasurements]
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                        updatedPlayer = { ...p, measurements: updatedMeasurements };
                        return updatedPlayer;
                    }
                    return p;
                });
                if (!updatedPlayer) throw new Error("Player not found");
                return simulateDelay(updatedPlayer);
            }
        }
        let updatedPlayer: Player | undefined;
        MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
            if (p.id === playerId) {
                const newMeasurements = measurements.map((m, i) => ({ ...m, id: `m-${Date.now()}-${i}` }));
                const updatedMeasurements = [...p.measurements, ...newMeasurements]
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                updatedPlayer = { ...p, measurements: updatedMeasurements };
                return updatedPlayer;
            }
            return p;
        });
        if (!updatedPlayer) throw new Error("Player not found");
        return simulateDelay(updatedPlayer);
    },
    updateMeasurement: async (playerId: string, measurementId: string, updates: Partial<Measurement>): Promise<Measurement> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.updateMeasurement(playerId, measurementId, updates);
            } catch (error) {
                console.error('Supabase updateMeasurement error:', error);
                let updatedMeasurement: Measurement | undefined;
                MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
                    if (p.id === playerId) {
                        const newMeasurements = p.measurements.map(m => {
                            if (m.id === measurementId) {
                                updatedMeasurement = { ...m, ...updates };
                                return updatedMeasurement;
                            }
                            return m;
                        });
                        return { ...p, measurements: newMeasurements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) };
                    }
                    return p;
                });
                if (!updatedMeasurement) throw new Error("Measurement not found");
                return simulateDelay(updatedMeasurement);
            }
        }
        let updatedMeasurement: Measurement | undefined;
        MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
            if (p.id === playerId) {
                const newMeasurements = p.measurements.map(m => {
                    if (m.id === measurementId) {
                        updatedMeasurement = { ...m, ...updates };
                        return updatedMeasurement;
                    }
                    return m;
                });
                return { ...p, measurements: newMeasurements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) };
            }
            return p;
        });
        if (!updatedMeasurement) throw new Error("Measurement not found");
        return simulateDelay(updatedMeasurement);
    },
    deleteMeasurement: async (playerId: string, measurementId: string): Promise<{ success: true }> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.deleteMeasurement(playerId, measurementId);
            } catch (error) {
                console.error('Supabase deleteMeasurement error:', error);
                MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
                    if (p.id === playerId) {
                        return { ...p, measurements: p.measurements.filter(m => m.id !== measurementId) };
                    }
                    return p;
                });
                return simulateDelay({ success: true });
            }
        }
        MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
            if (p.id === playerId) {
                return { ...p, measurements: p.measurements.filter(m => m.id !== measurementId) };
            }
            return p;
        });
        return simulateDelay({ success: true });
    },
    submitDailySurvey: async (playerId: string, surveyData: { [key: string]: any }) => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.submitDailySurvey(playerId, surveyData);
            } catch (error) {
                console.error('Supabase submitDailySurvey error:', error);
                // Fallback to mock
                const targetPlayerId = MOCK_PLAYERS.find(p => p.name === MOCK_USERS.find(u => u.id === playerId)?.name)?.id || playerId;
                const newSurvey: DailySurvey = { ...surveyData, date: new Date().toISOString() };
                MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
                    if (p.id === targetPlayerId) {
                        const otherSurveys = p.dailySurveys.filter(s => new Date(s.date).toDateString() !== new Date().toDateString());
                        return { ...p, dailySurveys: [...otherSurveys, newSurvey] };
                    }
                    return p;
                });
                return simulateDelay({ success: true });
            }
        }
        // Mock implementation
        const targetPlayerId = MOCK_PLAYERS.find(p => p.name === MOCK_USERS.find(u => u.id === playerId)?.name)?.id || playerId;
        const newSurvey: DailySurvey = { ...surveyData, date: new Date().toISOString() };
        MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
            if (p.id === targetPlayerId) {
                const otherSurveys = p.dailySurveys.filter(s => new Date(s.date).toDateString() !== new Date().toDateString());
                return { ...p, dailySurveys: [...otherSurveys, newSurvey] };
            }
            return p;
        });
        return simulateDelay({ success: true });
    },
    getScheduleEvents: async (): Promise<ScheduleEvent[]> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.getScheduleEvents();
            } catch (error) {
                console.error('Supabase getScheduleEvents error:', error);
                return simulateDelay(MOCK_SCHEDULE_EVENTS);
            }
        }
        return simulateDelay(MOCK_SCHEDULE_EVENTS);
    },
    addScheduleEvent: async (event: Omit<ScheduleEvent, 'id'>): Promise<ScheduleEvent> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.addScheduleEvent(event);
            } catch (error) {
                console.error('Supabase addScheduleEvent error:', error);
                const newEvent = { ...event, id: `event-${Date.now()}` };
                MOCK_SCHEDULE_EVENTS.push(newEvent);
                return simulateDelay(newEvent);
            }
        }
        const newEvent = { ...event, id: `event-${Date.now()}` };
        MOCK_SCHEDULE_EVENTS.push(newEvent);
        return simulateDelay(newEvent);
    },
    updateScheduleEvent: async (eventId: string, updates: Partial<ScheduleEvent>): Promise<ScheduleEvent> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.updateScheduleEvent(eventId, updates);
            } catch (error) {
                console.error('Supabase updateScheduleEvent error:', error);
                let updatedEvent: ScheduleEvent | undefined;
                MOCK_SCHEDULE_EVENTS = MOCK_SCHEDULE_EVENTS.map(e => {
                    if (e.id === eventId) {
                        updatedEvent = { ...e, ...updates };
                        return updatedEvent;
                    }
                    return e;
                });
                if (!updatedEvent) throw new Error("Event not found");
                return simulateDelay(updatedEvent);
            }
        }
        let updatedEvent: ScheduleEvent | undefined;
        MOCK_SCHEDULE_EVENTS = MOCK_SCHEDULE_EVENTS.map(e => {
            if (e.id === eventId) {
                updatedEvent = { ...e, ...updates };
                return updatedEvent;
            }
            return e;
        });
        if (!updatedEvent) throw new Error("Event not found");
        return simulateDelay(updatedEvent);
    },
    deleteScheduleEvent: async (eventId: string): Promise<{ success: boolean }> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.deleteScheduleEvent(eventId);
            } catch (error) {
                console.error('Supabase deleteScheduleEvent error:', error);
                MOCK_SCHEDULE_EVENTS = MOCK_SCHEDULE_EVENTS.filter(e => e.id !== eventId);
                return simulateDelay({ success: true });
            }
        }
        MOCK_SCHEDULE_EVENTS = MOCK_SCHEDULE_EVENTS.filter(e => e.id !== eventId);
        return simulateDelay({ success: true });
    },
     updateInjuryStatus: async (playerId: string, newInjuryData: Omit<Injury, 'id' | 'recoveryDate'> | null): Promise<Player> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.updateInjuryStatus(playerId, newInjuryData);
            } catch (error) {
                console.error('Supabase updateInjuryStatus error:', error);
                // Fallback to mock
                let updatedPlayer: Player | undefined;
                MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
                    if (p.id === playerId) {
                        const playerToUpdate = { ...p };
                        const currentActiveInjury = playerToUpdate.injury;

                        if (currentActiveInjury) {
                            const closedInjury = { ...currentActiveInjury, recoveryDate: new Date().toISOString() };
                            const newHistory = playerToUpdate.injuryHistory.map(h => h.id === currentActiveInjury.id ? closedInjury : h);
                            playerToUpdate.injuryHistory = newHistory;
                        }

                        if (newInjuryData) {
                            const newActiveInjury: Injury = {
                                ...newInjuryData,
                                id: `injury-${Date.now()}`
                            };
                            playerToUpdate.injury = newActiveInjury;
                            const existingInHistory = playerToUpdate.injuryHistory.find(h => h.id === newActiveInjury.id);
                            if (!existingInHistory) {
                                playerToUpdate.injuryHistory.push(newActiveInjury);
                            }
                        } else {
                            playerToUpdate.injury = null;
                        }

                        updatedPlayer = playerToUpdate;
                        return updatedPlayer;
                    }
                    return p;
                });
                if (!updatedPlayer) throw new Error("Player not found");
                return simulateDelay(updatedPlayer);
            }
        }
        // Mock implementation
        let updatedPlayer: Player | undefined;
        MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
            if (p.id === playerId) {
                const playerToUpdate = { ...p };
                const currentActiveInjury = playerToUpdate.injury;

                if (currentActiveInjury) {
                    const closedInjury = { ...currentActiveInjury, recoveryDate: new Date().toISOString() };
                    const newHistory = playerToUpdate.injuryHistory.map(h => h.id === currentActiveInjury.id ? closedInjury : h);
                    playerToUpdate.injuryHistory = newHistory;
                }

                if (newInjuryData) {
                    const newActiveInjury: Injury = {
                        ...newInjuryData,
                        id: `injury-${Date.now()}`
                    };
                    playerToUpdate.injury = newActiveInjury;
                    const existingInHistory = playerToUpdate.injuryHistory.find(h => h.id === newActiveInjury.id);
                    if (!existingInHistory) {
                        playerToUpdate.injuryHistory.push(newActiveInjury);
                    }
                } else {
                    playerToUpdate.injury = null;
                }

                updatedPlayer = playerToUpdate;
                return updatedPlayer;
            }
            return p;
        });
        if (!updatedPlayer) throw new Error("Player not found");
        return simulateDelay(updatedPlayer);
    },
    updateInjuryHistory: async (playerId: string, injuryId: string, updates: Partial<Injury>): Promise<Player> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.updateInjuryHistory(playerId, injuryId, updates);
            } catch (error) {
                console.error('Supabase updateInjuryHistory error:', error);
                let updatedPlayer: Player | undefined;
                MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
                    if (p.id === playerId) {
                        const newHistory = p.injuryHistory.map(i => i.id === injuryId ? { ...i, ...updates } : i);
                        updatedPlayer = { ...p, injuryHistory: newHistory };
                        return updatedPlayer;
                    }
                    return p;
                });
                if (!updatedPlayer) throw new Error("Player not found");
                return simulateDelay(updatedPlayer);
            }
        }
        let updatedPlayer: Player | undefined;
        MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
            if (p.id === playerId) {
                const newHistory = p.injuryHistory.map(i => i.id === injuryId ? { ...i, ...updates } : i);
                updatedPlayer = { ...p, injuryHistory: newHistory };
                return updatedPlayer;
            }
            return p;
        });
        if (!updatedPlayer) throw new Error("Player not found");
        return simulateDelay(updatedPlayer);
    },
    deleteInjuryHistory: async (playerId: string, injuryId: string): Promise<Player> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.deleteInjuryHistory(playerId, injuryId);
            } catch (error) {
                console.error('Supabase deleteInjuryHistory error:', error);
                let updatedPlayer: Player | undefined;
                MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
                    if (p.id === playerId) {
                        const newHistory = p.injuryHistory.filter(i => i.id !== injuryId);
                        updatedPlayer = { ...p, injuryHistory: newHistory };
                        return updatedPlayer;
                    }
                    return p;
                });
                if (!updatedPlayer) throw new Error("Player not found");
                return simulateDelay(updatedPlayer);
            }
        }
        let updatedPlayer: Player | undefined;
        MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
            if (p.id === playerId) {
                const newHistory = p.injuryHistory.filter(i => i.id !== injuryId);
                updatedPlayer = { ...p, injuryHistory: newHistory };
                return updatedPlayer;
            }
            return p;
        });
        if (!updatedPlayer) throw new Error("Player not found");
        return simulateDelay(updatedPlayer);
    },
    addPlayerNote: async (playerId: string, noteData: Omit<Note, 'id' | 'playerId'>): Promise<Note> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.addPlayerNote(playerId, noteData);
            } catch (error) {
                console.error('Supabase addPlayerNote error:', error);
                const newNote: Note = { ...noteData, id: `note-${Date.now()}`, playerId };
                MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
                    if (p.id === playerId) {
                        return { ...p, notes: [...p.notes, newNote] };
                    }
                    return p;
                });
                return simulateDelay(newNote);
            }
        }
        const newNote: Note = { ...noteData, id: `note-${Date.now()}`, playerId };
        MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
            if (p.id === playerId) {
                return { ...p, notes: [...p.notes, newNote] };
            }
            return p;
        });
        return simulateDelay(newNote);
    },
    updatePlayerNote: async (noteId: string, updates: Partial<Note>): Promise<Note> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.updatePlayerNote(noteId, updates);
            } catch (error) {
                console.error('Supabase updatePlayerNote error:', error);
                let updatedNote: Note | undefined;
                MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
                    const noteIndex = p.notes.findIndex(n => n.id === noteId);
                    if (noteIndex > -1) {
                        updatedNote = { ...p.notes[noteIndex], ...updates };
                        const newNotes = [...p.notes];
                        newNotes[noteIndex] = updatedNote;
                        return { ...p, notes: newNotes };
                    }
                    return p;
                });
                if (!updatedNote) throw new Error("Note not found");
                return simulateDelay(updatedNote);
            }
        }
        let updatedNote: Note | undefined;
        MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
            const noteIndex = p.notes.findIndex(n => n.id === noteId);
            if (noteIndex > -1) {
                updatedNote = { ...p.notes[noteIndex], ...updates };
                const newNotes = [...p.notes];
                newNotes[noteIndex] = updatedNote;
                return { ...p, notes: newNotes };
            }
            return p;
        });
        if (!updatedNote) throw new Error("Note not found");
        return simulateDelay(updatedNote);
    },
    deletePlayerNote: async (noteId: string): Promise<{ success: boolean }> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.deletePlayerNote(noteId);
            } catch (error) {
                console.error('Supabase deletePlayerNote error:', error);
                MOCK_PLAYERS = MOCK_PLAYERS.map(p => ({
                    ...p,
                    notes: p.notes.filter(n => n.id !== noteId),
                }));
                return simulateDelay({ success: true });
            }
        }
        MOCK_PLAYERS = MOCK_PLAYERS.map(p => ({
            ...p,
            notes: p.notes.filter(n => n.id !== noteId),
        }));
        return simulateDelay({ success: true });
    },
    updatePlayerInfo: async (playerId: string, updates: Partial<Player>): Promise<Player> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.updatePlayerInfo(playerId, updates);
            } catch (error) {
                console.error('Supabase updatePlayerInfo error:', error);
                let updatedPlayer: Player | undefined;
                MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
                    if (p.id === playerId) {
                        updatedPlayer = { ...p, ...updates };
                        return updatedPlayer;
                    }
                    return p;
                });
                if (!updatedPlayer) throw new Error("Player not found");
                return simulateDelay(updatedPlayer);
            }
        }
        let updatedPlayer: Player | undefined;
        MOCK_PLAYERS = MOCK_PLAYERS.map(p => {
            if (p.id === playerId) {
                updatedPlayer = { ...p, ...updates };
                return updatedPlayer;
            }
            return p;
        });
        if (!updatedPlayer) throw new Error("Player not found");
        return simulateDelay(updatedPlayer);
    },
    addPlayer: async (playerData: Omit<Player, 'id' | 'avatarUrl' | 'measurements' | 'notes' | 'dailySurveys' | 'injury' | 'injuryHistory'>): Promise<Player> => {
        if (isSupabaseConfigured()) {
            try {
                console.log('🔧 Supabase configured, attempting to add player...');
                const result = await supabaseApi.addPlayer(playerData);
                console.log('✅ Player added successfully:', result);
                
                // Şifre bilgisini console'a yazdır (geliştirme için)
                if ('tempPassword' in result) {
                    console.log('🔑 Yeni Oyuncu Giriş Bilgileri:');
                    console.log('Email:', result.email);
                    console.log('Password:', result.tempPassword);
                    console.log('Bu bilgileri oyuncuya verin!');
                }
                return result;
            } catch (error) {
                console.error('❌ Supabase addPlayer error:', error);
                console.error('Error details:', error);
                
                // Fallback to mock data
                const newPlayer: Player = {
                    ...playerData,
                    id: `player-${Date.now()}`,
                    avatarUrl: `https://picsum.photos/seed/new${Date.now()}/200/200`,
                    measurements: [],
                    notes: [],
                    dailySurveys: [],
                    injury: null,
                    injuryHistory: [],
                };
                MOCK_PLAYERS.push(newPlayer);
                return simulateDelay(newPlayer);
            }
        }
        const newPlayer: Player = {
            ...playerData,
            id: `player-${Date.now()}`,
            avatarUrl: `https://picsum.photos/seed/new${Date.now()}/200/200`,
            measurements: [],
            notes: [],
            dailySurveys: [],
            injury: null,
            injuryHistory: [],
        };
        MOCK_PLAYERS.push(newPlayer);
        return simulateDelay(newPlayer);
    },
    deletePlayer: async (playerId: string): Promise<{ success: boolean }> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.deletePlayer(playerId);
            } catch (error) {
                console.error('Supabase deletePlayer error:', error);
                MOCK_PLAYERS = MOCK_PLAYERS.filter(p => p.id !== playerId);
                return simulateDelay({ success: true });
            }
        }
        MOCK_PLAYERS = MOCK_PLAYERS.filter(p => p.id !== playerId);
        return simulateDelay({ success: true });
    },
    getSurveyQuestions: async (): Promise<SurveyQuestion[]> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.getSurveyQuestions();
            } catch (error) {
                console.error('Supabase getSurveyQuestions error:', error);
                return simulateDelay(MOCK_SURVEY_QUESTIONS);
            }
        }
        return simulateDelay(MOCK_SURVEY_QUESTIONS);
    },
    addSurveyQuestion: async (questionData: Omit<SurveyQuestion, 'id'>): Promise<SurveyQuestion> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.addSurveyQuestion(questionData);
            } catch (error) {
                console.error('Supabase addSurveyQuestion error:', error);
                const newQuestion: SurveyQuestion = {
                    ...questionData,
                    id: `sq-${Date.now()}`,
                    key: questionData.key || `custom_${Date.now()}`,
                };
                MOCK_SURVEY_QUESTIONS.push(newQuestion);
                return simulateDelay(newQuestion);
            }
        }
        const newQuestion: SurveyQuestion = {
            ...questionData,
            id: `sq-${Date.now()}`,
            key: questionData.key || `custom_${Date.now()}`,
        };
        MOCK_SURVEY_QUESTIONS.push(newQuestion);
        return simulateDelay(newQuestion);
    },
    updateSurveyQuestion: async (questionId: string, updates: Partial<SurveyQuestion>): Promise<SurveyQuestion> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.updateSurveyQuestion(questionId, updates);
            } catch (error) {
                console.error('Supabase updateSurveyQuestion error:', error);
                let updatedQuestion: SurveyQuestion | undefined;
                MOCK_SURVEY_QUESTIONS = MOCK_SURVEY_QUESTIONS.map(q => {
                    if (q.id === questionId) {
                        updatedQuestion = { ...q, ...updates };
                        return updatedQuestion;
                    }
                    return q;
                });
                if (!updatedQuestion) throw new Error("Survey question not found");
                return simulateDelay(updatedQuestion);
            }
        }
        let updatedQuestion: SurveyQuestion | undefined;
        MOCK_SURVEY_QUESTIONS = MOCK_SURVEY_QUESTIONS.map(q => {
            if (q.id === questionId) {
                updatedQuestion = { ...q, ...updates };
                return updatedQuestion;
            }
            return q;
        });
        if (!updatedQuestion) throw new Error("Survey question not found");
        return simulateDelay(updatedQuestion);
    },
    deleteSurveyQuestion: async (questionId: string): Promise<{ success: boolean }> => {
        if (isSupabaseConfigured()) {
            try {
                return await supabaseApi.deleteSurveyQuestion(questionId);
            } catch (error) {
                console.error('Supabase deleteSurveyQuestion error:', error);
                MOCK_SURVEY_QUESTIONS = MOCK_SURVEY_QUESTIONS.filter(q => q.id !== questionId);
                return simulateDelay({ success: true });
            }
        }
        MOCK_SURVEY_QUESTIONS = MOCK_SURVEY_QUESTIONS.filter(q => q.id !== questionId);
        return simulateDelay({ success: true });
    },
};