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
    const [showCredentials, setShowCredentials] = useState(false);
    const [playerCredentials, setPlayerCredentials] = useState<{email: string, password: string} | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !position) {
            alert('Ad ve pozisyon alanları zorunludur.');
            return;
        }
        
        try {
            const result = await api.addPlayer({ name, position, phone, email, birthDate: birthDate ? new Date(birthDate).toISOString() : undefined });
            
            // Eğer Supabase kullanılıyorsa ve geçici şifre varsa
            if ('tempPassword' in result && result.tempPassword) {
                setPlayerCredentials({
                    email: result.email || email,
                    password: result.tempPassword
                });
                setShowCredentials(true);
            } else {
                onSave();
                onClose();
            }
        } catch (error) {
            console.error('Oyuncu ekleme hatası:', error);
            alert('Oyuncu eklenirken hata oluştu.');
        }
    };

    const handleCloseCredentials = () => {
        setShowCredentials(false);
        setPlayerCredentials(null);
        onSave();
        onClose();
    };

    // Giriş bilgilerini gösteren modal
    if (showCredentials && playerCredentials) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="bg-card rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto my-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-green-600">✅ Oyuncu Başarıyla Eklendi!</h3>
                        <button onClick={handleCloseCredentials} className="text-text-dark hover:text-text-light text-2xl">&times;</button>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                            <p className="font-semibold">Oyuncu giriş bilgileri:</p>
                        </div>
                        <div className="bg-gray-100 p-4 rounded">
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700">Email:</label>
                                <div className="flex items-center space-x-2">
                                    <input 
                                        type="text" 
                                        value={playerCredentials.email} 
                                        readOnly 
                                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md font-mono text-sm"
                                    />
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(playerCredentials.email)}
                                        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Kopyala
                                    </button>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Şifre:</label>
                                <div className="flex items-center space-x-2">
                                    <input 
                                        type="text" 
                                        value={playerCredentials.password} 
                                        readOnly 
                                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md font-mono text-sm"
                                    />
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(playerCredentials.password)}
                                        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Kopyala
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                            <p className="text-sm">
                                <strong>Önemli:</strong> Bu bilgileri oyuncuya verin. Oyuncu bu bilgilerle sisteme giriş yapabilir.
                            </p>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={handleCloseCredentials}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Tamam
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-card rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto my-4">
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