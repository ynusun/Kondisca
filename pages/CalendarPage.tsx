import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ScheduleEvent, Player } from '../types';
import { ICONS } from '../constants';

const ConfirmationModal: React.FC<{ title: string, message: string, onConfirm: () => void, onCancel: () => void, confirmText?: string }> = ({ title, message, onConfirm, onCancel, confirmText = 'Onayla' }) => (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4 overflow-y-auto"
        onClick={(e) => {
            if (e.target === e.currentTarget) {
                onCancel();
            }
        }}
    >
        <div className="bg-card rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto my-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">{title}</h3>
            <p className="text-text-dark mb-6">{message}</p>
            <div className="flex justify-end space-x-4">
                <button 
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onCancel();
                    }} 
                    className="bg-secondary hover:bg-background text-white font-bold py-2 px-4 rounded"
                >
                    İptal
                </button>
                <button 
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onConfirm();
                    }} 
                    className={`text-white font-bold py-2 px-4 rounded ${confirmText === 'Sil' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'}`}
                >
                    {confirmText}
                </button>
            </div>
        </div>
    </div>
);

const EventModal: React.FC<{
    event: Omit<ScheduleEvent, 'id'> | ScheduleEvent;
    players: Player[];
    onClose: () => void;
    onSave: (event: Omit<ScheduleEvent, 'id'> | ScheduleEvent) => Promise<void>;
}> = ({ event, players, onClose, onSave }) => {
    const [title, setTitle] = useState(event?.title || '');
    const [description, setDescription] = useState(event?.description || '');
    const [time, setTime] = useState(event?.time || '');
    const [isTeamEvent, setIsTeamEvent] = useState(event?.isTeamEvent ?? true);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(event?.playerIds || []);
    const isEditing = event && 'id' in event;

    const handlePlayerSelection = (playerId: string) => {
        setSelectedPlayerIds(prev =>
            prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) {
            alert('Lütfen başlık girin.');
            return;
        }
        if (!isTeamEvent && selectedPlayerIds.length === 0) {
            alert('Lütfen en az bir oyuncu seçin.');
            return;
        }

        const eventData = {
            ...event,
            title,
            description,
            time,
            isTeamEvent,
            playerIds: isTeamEvent ? [] : selectedPlayerIds,
        };
        onSave(eventData as ScheduleEvent);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[80] p-4 overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-card rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto my-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{isEditing ? "Programı Düzenle" : "Yeni Program Ekle"}</h3>
                    <button onClick={onClose} className="text-text-dark hover:text-text-light text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Program Başlığı" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 bg-background border border-gray-700 rounded"/>
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2 bg-background border border-gray-700 rounded"/>
                    <textarea placeholder="Açıklama (opsiyonel)" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full p-2 bg-background border border-gray-700 rounded"></textarea>
                    <div className="flex space-x-4">
                        <label className="flex items-center space-x-2"><input type="radio" name="event-type" className="form-radio text-primary" checked={isTeamEvent} onChange={() => setIsTeamEvent(true)} /> <span>Takım</span></label>
                        <label className="flex items-center space-x-2"><input type="radio" name="event-type" className="form-radio text-primary" checked={!isTeamEvent} onChange={() => setIsTeamEvent(false)} /> <span>Oyuncu</span></label>
                    </div>
                     {!isTeamEvent && (
                         <div className="max-h-32 overflow-y-auto p-2 border border-gray-700 rounded space-y-2 bg-background">
                            {players.map(player => (
                                <label key={player.id} className="flex items-center space-x-2">
                                    <input type="checkbox" className="form-checkbox text-primary" checked={selectedPlayerIds.includes(player.id)} onChange={() => handlePlayerSelection(player.id)} />
                                    <span>{player.name}</span>
                                </label>
                            ))}
                         </div>
                     )}
                     <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark font-semibold">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const CalendarPage: React.FC = () => {
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [loading, setLoading] = useState(true);
    const [editingEvent, setEditingEvent] = useState<ScheduleEvent | Omit<ScheduleEvent, 'id'> | null>(null);
    const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Onayla' });

    const fetchEvents = async () => {
        try {
            const eventsData = await api.getScheduleEvents();
            setEvents(eventsData);
        } catch (error) {
            console.error("Failed to fetch calendar events:", error);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [eventsData, playersData] = await Promise.all([
                    api.getScheduleEvents(),
                    api.getPlayers()
                ]);
                setEvents(eventsData);
                setPlayers(playersData);
            } catch (error) {
                console.error("Failed to fetch calendar data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay() === 0 ? 6 : startOfMonth.getDay() - 1; // Monday start
    const daysInMonth = endOfMonth.getDate();

    const selectedDateEvents = events
        .filter(e => e.date === selectedDate?.toISOString().split('T')[0])
        .sort((a,b) => (a.time || '').localeCompare(b.time || ''));

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const handleSaveEvent = async (eventData: Omit<ScheduleEvent, 'id'> | ScheduleEvent) => {
        const isEditing = 'id' in eventData;
        setConfirmation({
            isOpen: true,
            title: isEditing ? 'Programı Güncelle' : 'Program Ekle',
            message: isEditing ? 'Bu programı güncellemek istediğinizden emin misiniz?' : 'Yeni programı eklemek istediğinizden emin misiniz?',
            confirmText: 'Kaydet',
            onConfirm: async () => {
                 if (isEditing) {
                    await api.updateScheduleEvent(eventData.id, eventData);
                } else {
                    await api.addScheduleEvent(eventData);
                }
                setEditingEvent(null);
                setConfirmation({ ...confirmation, isOpen: false });
                fetchEvents();
            }
        });
    };

    const handleDeleteEvent = (eventId: string) => {
        setConfirmation({
            isOpen: true,
            title: 'Programı Sil',
            message: 'Bu programı kalıcı olarak silmek istediğinizden emin misiniz?',
            confirmText: 'Sil',
            onConfirm: async () => {
                await api.deleteScheduleEvent(eventId);
                setConfirmation({ ...confirmation, isOpen: false });
                fetchEvents();
            }
        });
    };
    
    const handleAddEventClick = () => {
        if (!selectedDate) return;
        setEditingEvent({
            date: selectedDate.toISOString().split('T')[0],
            title: '',
            isTeamEvent: true,
            playerIds: [],
        });
    }

    const renderCalendar = () => {
        const days = [];
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2 border border-gray-800"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateString = date.toISOString().split('T')[0];
            const isSelected = selectedDate?.toISOString().split('T')[0] === dateString;
            const hasEvent = events.some(e => e.date === dateString);

            days.push(
                <div
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`p-2 border border-gray-700 cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary text-white' : 'hover:bg-card'
                    }`}
                >
                    <div className="font-bold">{day}</div>
                    {hasEvent && <div className="mt-1 flex justify-end"><span className="w-2 h-2 bg-primary rounded-full"></span></div>}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {confirmation.isOpen && <ConfirmationModal {...confirmation} onCancel={() => setConfirmation({ ...confirmation, isOpen: false })} />}
            {editingEvent && (
                <EventModal 
                    event={editingEvent}
                    players={players}
                    onClose={() => setEditingEvent(null)}
                    onSave={handleSaveEvent}
                />
            )}
            <div className="lg:col-span-2 bg-card p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="px-3 py-1 bg-secondary rounded">&lt;</button>
                    <h2 className="text-xl font-bold">
                        {currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={handleNextMonth} className="px-3 py-1 bg-secondary rounded">&gt;</button>
                </div>
                <div className="grid grid-cols-7 text-center font-semibold text-text-dark">
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => <div key={day} className="p-2">{day}</div>)}
                </div>
                <div className="grid grid-cols-7 h-[60vh] overflow-auto">
                    {renderCalendar()}
                </div>
            </div>

            <div className="bg-card p-6 rounded-lg flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">
                        {selectedDate ? selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : 'Bir tarih seçin'} Programı
                    </h3>
                    <button onClick={handleAddEventClick} className="bg-primary text-white py-1 px-3 text-sm rounded-md hover:bg-primary-dark font-semibold">Ekle</button>
                </div>
                <div className="flex-grow overflow-auto mb-4 space-y-3">
                    {selectedDateEvents.length > 0 ? (
                        selectedDateEvents.map(event => (
                             <div key={event.id} className="p-3 bg-background rounded-md">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{event.time && <span className="text-primary mr-2">{event.time}</span>}{event.title}</p>
                                        <p className="text-sm text-text-dark">{event.description}</p>
                                        <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${event.isTeamEvent ? 'bg-blue-500' : 'bg-green-500'}`}>
                                            {event.isTeamEvent ? 'Takım' : `Oyuncular: ${event.playerIds.map(id => players.find(p => p.id === id)?.name).join(', ')}`}
                                        </span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => setEditingEvent(event)} className="text-text-dark hover:text-white">{ICONS.EDIT}</button>
                                        <button onClick={() => handleDeleteEvent(event.id)} className="text-text-dark hover:text-red-500">{ICONS.DELETE}</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : <p className="text-text-dark text-center pt-10">Seçili gün için program yok.</p>}
                </div>

            </div>
        </div>
    );
};

export default CalendarPage;