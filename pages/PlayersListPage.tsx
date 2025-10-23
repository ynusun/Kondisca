import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { api } from '../services/api';
import PlayerCard from '../components/PlayerCard';

const AddPlayerModal: React.FC<{ onClose: () => void; onSave: () => void; }> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [position, setPosition] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [birthDate, setBirthDate] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !position) {
            alert('Ad ve pozisyon alanları zorunludur.');
            return;
        }
        await api.addPlayer({ name, position, phone, email, birthDate: birthDate ? new Date(birthDate).toISOString() : undefined });
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Yeni Oyuncu Ekle</h3>
                    <button onClick={onClose} className="text-text-dark hover:text-text-light text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-dark">Ad Soyad</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-dark">Pozisyon</label>
                        <input type="text" value={position} onChange={e => setPosition(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-dark">Doğum Tarihi</label>
                        <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-dark">Telefon Numarası</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-dark">E-posta Adresi</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark font-semibold">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const PlayersListPage: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchPlayers = async () => {
        setLoading(true);
        try {
            const playerData = await api.getPlayers();
            setPlayers(playerData);
        } catch (error) {
            console.error("Failed to fetch players:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlayers();
    }, []);

    const filteredPlayers = players.filter(player => 
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="text-center p-10">Oyuncular yükleniyor...</div>;
    }

    return (
        <div className="space-y-6">
            {showAddModal && <AddPlayerModal onClose={() => setShowAddModal(false)} onSave={() => { fetchPlayers(); }} />}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold">Tüm Oyuncular ({players.length})</h2>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <input 
                        type="text"
                        placeholder="Oyuncu ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 bg-card border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-auto"
                    />
                    <button onClick={() => setShowAddModal(true)} className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark font-semibold whitespace-nowrap">
                        Yeni Oyuncu Ekle
                    </button>
                </div>
            </div>
            {filteredPlayers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPlayers.map(player => (
                        <PlayerCard key={player.id} player={player} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-card rounded-lg">
                    <p className="text-text-dark">Aramanızla eşleşen oyuncu bulunamadı.</p>
                </div>
            )}
        </div>
    );
};

export default PlayersListPage;