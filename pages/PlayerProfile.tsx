import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Player, Metric, Note, Injury, CombinedDataPoint, MetricInputType, Measurement, SurveyQuestion } from '../types';
import { api } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar } from 'recharts';
import { ICONS } from '../constants';
import { useAuth } from '../context/AuthContext';


// Helper function for formula evaluation
const evaluateFormula = (formula: string, dataPoint: CombinedDataPoint, allMetrics: Metric[]): number | null => {
    let expression = formula;
    const metricPlaceholders = formula.match(/\[.*?\]/g) || [];

    for (const placeholder of metricPlaceholders) {
        const metricName = placeholder.substring(1, placeholder.length - 1);
        const metricValue = dataPoint[metricName];

        if (metricValue === undefined || metricValue === null) {
            return null; // A required value is missing
        }
        
        expression = expression.split(placeholder).join(String(metricValue));
    }

    if (/\[.*?\]/.test(expression)) {
        return null; // Some placeholders couldn't be replaced
    }

    try {
        // Using Function constructor is slightly safer than direct eval
        const result = new Function(`return ${expression}`)();
        return typeof result === 'number' && isFinite(result) ? parseFloat(result.toFixed(2)) : null;
    } catch (e) {
        return null;
    }
};


// Helper components for Modals
const Modal: React.FC<{ children: React.ReactNode, onClose: () => void, title: string, zIndex?: string }> = ({ children, onClose, title, zIndex = 'z-50' }) => (
    <div 
        className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center ${zIndex} p-4 overflow-y-auto`}
        onClick={(e) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        }}
    >
        <div className="bg-card rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto my-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{title}</h3>
                <button onClick={onClose} className="text-text-dark hover:text-text-light text-2xl">&times;</button>
            </div>
            {children}
        </div>
    </div>
);

const ConfirmationModal: React.FC<{ title: string, message: string, onConfirm: () => void, onCancel: () => void }> = ({ title, message, onConfirm, onCancel }) => (
    <Modal onClose={onCancel} title={title} zIndex="z-[60]">
        <p className="text-text-dark mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
            <button onClick={onCancel} className="bg-secondary hover:bg-background text-white font-bold py-2 px-4 rounded">İptal</button>
            <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Onayla</button>
        </div>
    </Modal>
);

const InjuryModal: React.FC<{ player: Player; onUpdate: (p: Player) => void; onClose: () => void; }> = ({ player, onUpdate, onClose }) => {
    const [description, setDescription] = useState(player.injury?.description || '');
    const [recovery, setRecovery] = useState(player.injury?.estimatedRecovery || '');

    const handleSave = async () => {
        const newInjuryData: Omit<Injury, 'id' | 'recoveryDate'> = { 
            description, 
            estimatedRecovery: recovery, 
            date: new Date().toISOString() 
        };
        const updatedPlayer = await api.updateInjuryStatus(player.id, newInjuryData);
        onUpdate(updatedPlayer);
        onClose();
    };

    const handleRecover = async () => {
        const updatedPlayer = await api.updateInjuryStatus(player.id, null);
        onUpdate(updatedPlayer);
        onClose();
    };

    return (
        <Modal onClose={onClose} title="Sakatlık Durumunu Yönet">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-dark">Sakatlık Açıklaması</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-dark">Tahmini İyileşme Süresi</label>
                    <input type="text" value={recovery} onChange={e => setRecovery(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md" placeholder="örn: 2 hafta" />
                </div>
                <div className="flex justify-between items-center pt-4">
                    <button onClick={handleRecover} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">İyileşti Olarak İşaretle</button>
                    <button onClick={handleSave} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded">Kaydet</button>
                </div>
            </div>
        </Modal>
    );
};

const InjuryHistoryModal: React.FC<{ player: Player; onUpdate: (p: Player) => void; onClose: () => void; }> = ({ player, onUpdate, onClose }) => {
    const [editingInjury, setEditingInjury] = useState<Injury | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!editingInjury) return;
        const updatedPlayer = await api.updateInjuryHistory(player.id, editingInjury.id, {
            description: editingInjury.description,
            estimatedRecovery: editingInjury.estimatedRecovery
        });
        onUpdate(updatedPlayer);
        setEditingInjury(null);
    }
    
    const handleDelete = async (injuryId: string) => {
        if(window.confirm('Bu sakatlık kaydını silmek istediğinize emin misiniz?')){
            const updatedPlayer = await api.deleteInjuryHistory(player.id, injuryId);
            onUpdate(updatedPlayer);
        }
    }

    return (
        <Modal onClose={onClose} title="Sakatlık Geçmişi">
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {player.injuryHistory.length > 0 ? player.injuryHistory.slice().reverse().map(injury => (
                    <div key={injury.id} className="p-3 bg-background rounded-md">
                        {editingInjury?.id === injury.id ? (
                            <form onSubmit={handleSave} className="space-y-2">
                                <input type="text" value={editingInjury.description} onChange={e => setEditingInjury({...editingInjury, description: e.target.value})} className="w-full bg-secondary p-1 rounded" />
                                <input type="text" value={editingInjury.estimatedRecovery} onChange={e => setEditingInjury({...editingInjury, estimatedRecovery: e.target.value})} className="w-full bg-secondary p-1 rounded" />
                                <div className="flex space-x-2 justify-end">
                                    <button type="button" onClick={() => setEditingInjury(null)} className="text-xs text-text-dark">İptal</button>
                                    <button type="submit" className="text-xs text-primary font-semibold">Kaydet</button>
                                </div>
                            </form>
                        ) : (
                             <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{injury.description}</p>
                                    <p className="text-sm text-text-dark">Tahmin: {injury.estimatedRecovery}</p>
                                    <p className="text-xs text-gray-500">Tarih: {new Date(injury.date).toLocaleDateString('tr-TR')}</p>
                                    {injury.recoveryDate && <p className="text-xs text-green-400">İyileşme Tarihi: {new Date(injury.recoveryDate).toLocaleDateString('tr-TR')}</p>}
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => setEditingInjury(injury)} className="text-text-dark hover:text-white">{ICONS.EDIT}</button>
                                    <button onClick={() => handleDelete(injury.id)} className="text-text-dark hover:text-red-500">{ICONS.DELETE}</button>
                                </div>
                            </div>
                        )}
                    </div>
                )) : (
                    <p className="text-text-dark text-center">Kayıtlı sakatlık geçmişi bulunmuyor.</p>
                )}
            </div>
        </Modal>
    );
};


const NoteModal: React.FC<{ note: Note | null; player: Player; onUpdate: (p: Player) => void; onClose: () => void; onConfirm: () => void; }> = ({ note, player, onUpdate, onClose, onConfirm }) => {
    const { user } = useAuth();
    const [text, setText] = useState(note?.text || '');
    const [isPublic, setIsPublic] = useState(note?.isPublic || false);
    const isEditing = !!note;

    const handleSave = async () => {
        if (!text || !user) return;
        if (isEditing) {
            await api.updatePlayerNote(note.id, { text, isPublic });
        } else {
            await api.addPlayerNote(player.id, { text, isPublic, authorId: user.id, date: new Date().toISOString() });
        }
        const updatedPlayer = await api.getPlayerDetails(player.id);
        if (updatedPlayer) onUpdate(updatedPlayer);
        onConfirm(); // This will close the note modal
    };

    return (
        <Modal onClose={onClose} title={isEditing ? "Notu Düzenle" : "Yeni Not Ekle"}>
            <div className="space-y-4">
                <textarea value={text} onChange={e => setText(e.target.value)} rows={5} className="w-full p-2 bg-background rounded border border-gray-700 focus:ring-primary focus:border-primary" placeholder="Notunuzu buraya yazın..."></textarea>
                <label className="flex items-center text-sm">
                    <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="form-checkbox h-4 w-4 text-primary bg-gray-800 border-gray-600 rounded focus:ring-primary" />
                    <span className="ml-2">Oyuncu ile paylaş</span>
                </label>
                <div className="flex justify-end">
                    <button onClick={handleSave} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded">Kaydet</button>
                </div>
            </div>
        </Modal>
    );
};

const AddMeasurementModal: React.FC<{
    player: Player;
    metrics: Metric[];
    onClose: () => void;
    onSave: (p: Player) => void;
}> = ({ player, metrics, onClose, onSave }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    
    // En son değerleri bul ve default olarak ayarla
    const getLastValue = (metricId: string) => {
        const measurements = player.measurements
            .filter(m => m.metricId === metricId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return measurements[0]?.value?.toString() || '';
    };
    
    const manualMetrics = metrics.filter(m => m.inputType === MetricInputType.Manual && m.isActive);
    
    // Default değerleri ayarla
    const [values, setValues] = useState<Record<string, string>>(() => {
        const initialValues: Record<string, string> = {};
        manualMetrics.forEach(metric => {
            initialValues[metric.id] = getLastValue(metric.id);
        });
        return initialValues;
    });

    const handleValueChange = (metricId: string, value: string) => {
        setValues(prev => ({ ...prev, [metricId]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const measurementsToAdd = Object.entries(values)
            .filter(([, value]) => value.trim() !== '')
            .map(([metricId, value]) => ({
                metricId,
                value: parseFloat(value),
                date: new Date(date).toISOString(),
            }));

        if (measurementsToAdd.length > 0) {
            const updatedPlayer = await api.addMultipleMeasurements(player.id, measurementsToAdd);
            onSave(updatedPlayer);
            onClose();
        } else {
            onClose();
        }
    };

    return (
        <Modal onClose={onClose} title="Yeni Ölçüm Ekle">
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                 <div>
                    <label className="block text-sm font-medium text-text-dark">Tarih</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {manualMetrics.map(metric => (
                        <div key={metric.id}>
                            <label className="block text-sm font-medium text-text-dark">{metric.name} ({metric.unit})</label>
                            <input 
                                type="number" 
                                step="any" 
                                value={values[metric.id] || ''} 
                                onChange={e => handleValueChange(metric.id, e.target.value)} 
                                className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md" 
                            />
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark font-semibold">Kaydet</button>
                </div>
            </form>
        </Modal>
    );
};

const EditMeasurementModal: React.FC<{
    player: Player;
    measurement: Measurement;
    metrics: Metric[];
    onClose: () => void;
    onSave: () => void;
}> = ({ player, measurement, metrics, onClose, onSave }) => {
    const [value, setValue] = useState(measurement.value.toString());
    const [date, setDate] = useState(new Date(measurement.date).toISOString().split('T')[0]);
    const metric = metrics.find(m => m.id === measurement.metricId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.updateMeasurement(player.id, measurement.id, {
            value: parseFloat(value),
            date: new Date(date).toISOString(),
        });
        onSave();
        onClose();
    };

    if (!metric) return null;

    return (
        <Modal onClose={onClose} title={`"${metric.name}" Ölçümünü Düzenle`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-dark">Değer ({metric.unit})</label>
                    <input type="number" step="any" value={value} onChange={e => setValue(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-dark">Tarih</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md" />
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark font-semibold">Kaydet</button>
                </div>
            </form>
        </Modal>
    );
};

const EditPlayerInfoModal: React.FC<{ player: Player; onClose: () => void; onSave: (p: Player) => void; onDelete: () => void; }> = ({ player, onClose, onSave, onDelete }) => {
    const [name, setName] = useState(player.name);
    const [position, setPosition] = useState(player.position);
    const [phone, setPhone] = useState(player.phone || '');
    const [email, setEmail] = useState(player.email || '');
    const [birthDate, setBirthDate] = useState(player.birthDate ? new Date(player.birthDate).toISOString().split('T')[0] : '');
    const [credentials, setCredentials] = useState<{ email: string; canResetPassword: boolean; password?: string } | null>(null);
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [newPassword, setNewPassword] = useState<string | null>(null);
    const [loadingCredentials, setLoadingCredentials] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showCredentialsAccordion, setShowCredentialsAccordion] = useState(false);
    
    // Giriş bilgilerini yükle
    useEffect(() => {
        const loadCredentials = async () => {
            setLoadingCredentials(true);
            try {
                const creds = await api.getPlayerCredentials(player.id);
                setCredentials(creds);
            } catch (error) {
                console.error('Failed to load credentials:', error);
            } finally {
                setLoadingCredentials(false);
            }
        };
        loadCredentials();
    }, [player.id]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const updatedPlayer = await api.updatePlayerInfo(player.id, { name, position, phone, email, birthDate: birthDate ? new Date(birthDate).toISOString() : undefined });
        onSave(updatedPlayer);
        onClose();
    };

    const handlePasswordReset = async () => {
        try {
            const result = await api.resetPlayerPassword(player.id);
            setNewPassword(result.newPassword);
            setShowPasswordReset(true);
        } catch (error) {
            console.error('Password reset failed:', error);
            alert('Şifre sıfırlama başarısız oldu.');
        }
    };

    // Şifre sıfırlama modal'ı
    if (showPasswordReset && newPassword) {
        return (
            <Modal onClose={() => { setShowPasswordReset(false); setNewPassword(null); }} title="🔑 Yeni Şifre Oluşturuldu" zIndex="z-[70]">
                <div className="space-y-4">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <p className="font-semibold">Oyuncu için yeni şifre oluşturuldu:</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded">
                        <div className="mb-2">
                            <label className="block text-sm font-medium text-gray-700">Email:</label>
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="text" 
                                    value={credentials?.email || email} 
                                    readOnly 
                                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md font-mono text-sm"
                                />
                                <button 
                                    onClick={() => navigator.clipboard.writeText(credentials?.email || email)}
                                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Kopyala
                                </button>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Yeni Şifre:</label>
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="text" 
                                    value={newPassword} 
                                    readOnly 
                                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md font-mono text-sm"
                                />
                                <button 
                                    onClick={() => navigator.clipboard.writeText(newPassword)}
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
                            onClick={() => { setShowPasswordReset(false); setNewPassword(null); }}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Tamam
                        </button>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal onClose={onClose} title="Oyuncu Bilgilerini Düzenle">
            <div className="space-y-6">
                {/* Giriş Bilgileri Accordion */}
                <div className="bg-background border border-gray-700 rounded-lg">
                    <button
                        onClick={() => setShowCredentialsAccordion(!showCredentialsAccordion)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800 transition-colors rounded-lg"
                    >
                        <h4 className="text-lg font-semibold text-text-light">🔐 Giriş Bilgileri</h4>
                        <span className={`transform transition-transform duration-200 ${showCredentialsAccordion ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </button>
                    
                    {showCredentialsAccordion && (
                        <div className="px-4 pb-4 border-t border-gray-700">
                            {loadingCredentials ? (
                                <p className="text-text-dark py-2">Giriş bilgileri yükleniyor...</p>
                            ) : credentials ? (
                                <div className="space-y-3 pt-3">
                                    <div>
                                        <label className="block text-sm font-medium text-text-dark mb-1">Email:</label>
                                        <div className="flex items-center space-x-2">
                                            <input 
                                                type="text" 
                                                value={credentials.email} 
                                                readOnly 
                                                className="flex-1 px-3 py-2 bg-background border border-gray-700 rounded-md font-mono text-sm text-text-light"
                                            />
                                            <button 
                                                onClick={() => navigator.clipboard.writeText(credentials.email)}
                                                className="px-3 py-2 bg-primary text-white rounded hover:bg-primary-dark text-sm"
                                            >
                                                Kopyala
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-text-dark mb-1">Şifre:</label>
                                        <div className="flex items-center space-x-2">
                                            <input 
                                                type={showPassword ? "text" : "password"} 
                                                value={credentials.password || "••••••••"} 
                                                readOnly 
                                                className="flex-1 px-3 py-2 bg-background border border-gray-700 rounded-md font-mono text-sm text-text-light"
                                            />
                                            <button 
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="px-3 py-2 bg-secondary text-text-light rounded hover:bg-background text-sm"
                                            >
                                                {showPassword ? "Gizle" : "Göster"}
                                            </button>
                                            <button 
                                                onClick={() => navigator.clipboard.writeText(credentials.password || "")}
                                                className="px-3 py-2 bg-primary text-white rounded hover:bg-primary-dark text-sm"
                                            >
                                                Kopyala
                                            </button>
                                        </div>
                                        <p className="text-xs text-text-dark mt-1">
                                            Not: Şifre güvenlik nedeniyle gizlenmiştir. Görüntülemek için "Göster" butonuna tıklayın.
                                        </p>
                                    </div>

                                    {credentials.canResetPassword && (
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                                            <span className="text-sm text-text-dark">Şifre sıfırlama:</span>
                                            <button 
                                                type="button"
                                                onClick={handlePasswordReset}
                                                className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm font-semibold"
                                            >
                                                Yeni Şifre Oluştur
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-text-dark py-2">Giriş bilgileri yüklenemedi.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Oyuncu Bilgileri Formu */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800">👤 Oyuncu Bilgileri</h4>
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
                    <div className="flex justify-between items-center pt-4">
                         <button type="button" onClick={onDelete} className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 font-semibold">Oyuncuyu Sil</button>
                        <button type="submit" className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark font-semibold">Kaydet</button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};


const StatDisplay: React.FC<{ label: string; value: string | number | undefined; unit: string; decimalPlaces?: number }> = ({ label, value, unit, decimalPlaces = 2 }) => {
    const formattedValue = typeof value === 'number' ? value.toFixed(decimalPlaces) : value;
    return (
        <div className="text-center">
            <span className="text-xs text-text-dark">{label}</span>
            <p className="text-lg font-bold">{value !== undefined ? `${formattedValue} ${unit}` : 'N/A'}</p>
        </div>
    );
};

const PlayerProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [player, setPlayer] = useState<Player | null>(null);
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['metric-2', 'metric-4']); // Default selection
    const [modal, setModal] = useState<'injury' | 'injuryHistory' | 'note' | 'addMeasurement' | 'editInfo' | 'editMeasurement' | null>(null);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [measurementTab, setMeasurementTab] = useState<'history' | 'table' | 'survey'>('history');
    const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const fetchData = useCallback(async () => {
        if (!id) return;
        try {
            const [playerData, metricsData, surveyQuestionsData] = await Promise.all([
                api.getPlayerDetails(id),
                api.getMetrics(),
                api.getSurveyQuestions()
            ]);
            if (!playerData) {
                navigate('/players');
                return;
            }
            setPlayer(playerData);
            setMetrics(metricsData);
            setSurveyQuestions(surveyQuestionsData);
        } catch (error) {
            console.error("Failed to fetch player details:", error);
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    const handlePlayerUpdate = (updatedPlayer: Player) => setPlayer(updatedPlayer);
    
    const handleDeleteNote = (noteId: string) => {
        setConfirmation({
            isOpen: true,
            title: 'Notu Sil',
            message: 'Bu notu kalıcı olarak silmek istediğinizden emin misiniz?',
            onConfirm: async () => {
                await api.deletePlayerNote(noteId);
                fetchData();
                setConfirmation({ ...confirmation, isOpen: false });
            },
        });
    };
    
    const handleEditNote = (note: Note) => {
        setEditingNote(note); 
        setModal('note');
    };
    
    const handleDeleteMeasurement = async (measurementId: string) => {
        if (window.confirm('Bu ölçüm kaydını silmek istediğinizden emin misiniz?')) {
            if(!player) return;
            await api.deleteMeasurement(player.id, measurementId);
            fetchData();
        }
    };
    
    const handleDeletePlayer = () => {
        if (!player) return;
        setConfirmation({
            isOpen: true,
            title: 'Oyuncuyu Sil',
            message: `${player.name} adlı oyuncuyu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
            onConfirm: async () => {
                await api.deletePlayer(player.id);
                setConfirmation({ ...confirmation, isOpen: false });
                setModal(null);
                navigate('/players');
            }
        });
    };

    const handleMetricSelection = (metricId: string) => {
        setSelectedMetrics(prev => 
            prev.includes(metricId) 
                ? prev.filter(id => id !== metricId)
                : [...prev, metricId]
        );
    };

    const latestStats = useMemo(() => {
        if (!player || !metrics.length) return {};
        
        // Metric'leri isimlerine göre bul
        const heightMetric = metrics.find(m => m.name.toLowerCase().includes('boy') || m.name.toLowerCase().includes('height'));
        const weightMetric = metrics.find(m => m.name.toLowerCase().includes('kilo') || m.name.toLowerCase().includes('weight'));
        // Önce tam eşleşme ara
        let fatMetric = metrics.find(m => {
            const name = m.name.toLowerCase();
            return name === 'yağ oranı' || 
                   name === 'fat percentage' || 
                   name === 'body fat percentage' ||
                   name === 'yağ' ||
                   name === 'fat';
        });
        
        // Tam eşleşme bulunamazsa kısmi eşleşme ara
        if (!fatMetric) {
            fatMetric = metrics.find(m => {
                const name = m.name.toLowerCase();
                return name.includes('yağ') || 
                       name.includes('fat') || 
                       name.includes('body fat') ||
                       name.includes('bf') ||
                       name.includes('oran') ||
                       name.includes('bodyfat') ||
                       name.includes('yağ oranı') ||
                       name.includes('fat percentage') ||
                       name.includes('body fat percentage');
            });
        }
        
        // Debug: Bulunan metric'leri console'a yazdır
        console.log('🔍 Metric Debug:', {
            allMetrics: metrics.map(m => ({ id: m.id, name: m.name })),
            heightMetric: heightMetric ? { id: heightMetric.id, name: heightMetric.name } : null,
            weightMetric: weightMetric ? { id: weightMetric.id, name: weightMetric.name } : null,
            fatMetric: fatMetric ? { id: fatMetric.id, name: fatMetric.name } : null,
            playerMeasurements: player.measurements.map(m => ({ 
                metricId: m.metricId, 
                value: m.value, 
                date: m.date 
            })),
            fatMeasurements: player.measurements.filter(m => 
                fatMetric && m.metricId === fatMetric.id
            ).map(m => ({ value: m.value, date: m.date }))
        });
        
        const findLast = (metricId: string) => {
            const measurements = player.measurements.filter(m => m.metricId === metricId);
            const sorted = measurements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const latest = sorted[0];
            console.log(`🔍 ${metricId} measurements:`, {
                total: measurements.length,
                all: measurements.map(m => ({ value: m.value, date: m.date })),
                latest: latest ? { value: latest.value, date: latest.date } : null
            });
            return latest?.value;
        };
        
        let age;
        if (player.birthDate) {
            const birthDate = new Date(player.birthDate);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
        }

        const result = {
            height: heightMetric ? findLast(heightMetric.id) : undefined,
            weight: weightMetric ? findLast(weightMetric.id) : undefined,
            fat: fatMetric ? findLast(fatMetric.id) : undefined,
            age: age,
        };
        
        console.log('📊 Latest Stats Result:', {
            height: { 
                metric: heightMetric?.name, 
                metricId: heightMetric?.id,
                value: result.height,
                found: !!heightMetric
            },
            weight: { 
                metric: weightMetric?.name, 
                metricId: weightMetric?.id,
                value: result.weight,
                found: !!weightMetric
            },
            fat: { 
                metric: fatMetric?.name, 
                metricId: fatMetric?.id,
                value: result.fat,
                found: !!fatMetric
            },
            age: result.age
        });
        return result;
    }, [player, metrics]);
    
    const chartData = useMemo(() => {
        if (!player || !metrics.length) return [];

        const dataMap = new Map<string, CombinedDataPoint>();
        const activeMetrics = metrics.filter(m => m.isActive);
        const manualMetrics = activeMetrics.filter(m => m.inputType === MetricInputType.Manual);
        const surveyLinkedMetrics = activeMetrics.filter(m => m.inputType === MetricInputType.Survey);
        const calculatedMetrics = activeMetrics.filter(m => m.inputType === MetricInputType.Calculated);

        // 1. Populate with manual measurements from physical tests
        player.measurements.forEach(m => {
            const metric = manualMetrics.find(met => met.id === m.metricId);
            if (metric) {
                const dateStr = new Date(m.date).toLocaleDateString('tr-TR');
                if (!dataMap.has(dateStr)) dataMap.set(dateStr, { date: dateStr });
                dataMap.get(dateStr)![metric.name] = m.value;
            }
        });

        // 2. Populate with data from metrics linked to survey questions
        player.dailySurveys.forEach(s => {
            const dateStr = new Date(s.date).toLocaleDateString('tr-TR');
            if (!dataMap.has(dateStr)) dataMap.set(dateStr, { date: dateStr });
            const point = dataMap.get(dateStr)!;
            
            surveyLinkedMetrics.forEach(metric => {
                if (metric.surveyQuestionKey && s[metric.surveyQuestionKey] !== undefined) {
                    point[metric.name] = s[metric.surveyQuestionKey];
                }
            });
        });

        // 3. Calculate formula-based metrics for each data point
        for (const dataPoint of dataMap.values()) {
            for (const calcMetric of calculatedMetrics) {
                if (calcMetric.formula) {
                    const result = evaluateFormula(calcMetric.formula, dataPoint, metrics);
                    if (result !== null) {
                        dataPoint[calcMetric.name] = result;
                    }
                }
            }
        }

        // 4. Sort and return
        return Array.from(dataMap.values()).sort((a,b) => {
             const dateA = new Date(a.date.split('.').reverse().join('-')).getTime();
             const dateB = new Date(b.date.split('.').reverse().join('-')).getTime();
             return dateA - dateB;
        });
    }, [player, metrics]);
    
    const formattedChartData = useMemo(() => chartData.map(d => ({...d, date: new Date(d.date.split('.').reverse().join('-')).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric'}) })), [chartData]);

    const radarChartData = useMemo(() => {
        if (!player || !metrics.length) return [];

        const radarMetrics = metrics.filter(m => m.showInRadar && m.isActive);
        const latestDataPoint: CombinedDataPoint = { date: new Date().toISOString() };

        // Get latest value for all manual metrics to build a base for calculations
        metrics.filter(m => m.inputType === MetricInputType.Manual).forEach(metric => {
            const lastMeasurement = player.measurements
                .filter(m => m.metricId === metric.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            if (lastMeasurement) {
                latestDataPoint[metric.name] = lastMeasurement.value;
            }
        });

        return radarMetrics.map(metric => {
            let latestValue: number | null = null;
            
            if (metric.inputType === MetricInputType.Manual) {
                latestValue = latestDataPoint[metric.name] ?? null;
            } else if (metric.inputType === MetricInputType.Calculated && metric.formula) {
                latestValue = evaluateFormula(metric.formula, latestDataPoint, metrics);
            }
            
            if (latestValue === null) {
                return { subject: metric.name, value: 0, rawValue: 0, fullMark: 1 };
            }

            const allHistoricalValuesForMetric = chartData
                .map(d => d[metric.name])
                .filter((v): v is number => typeof v === 'number' && isFinite(v));
            
            const maxValue = allHistoricalValuesForMetric.length > 0
                ? Math.max(...allHistoricalValuesForMetric, latestValue)
                : (latestValue > 0 ? latestValue * 1.2 : 1); // Add buffer if only one value

            return {
                subject: metric.name,
                value: latestValue, // Use raw value for plotting
                rawValue: latestValue,
                fullMark: maxValue // Dynamically set the max for each axis
            };
        });
    }, [player, metrics, chartData]);
    
    const chartableMetrics = useMemo(() => {
        return metrics.filter(m => m.isActive && m.id !== 'metric-1');
    }, [metrics]);
    
    const pivotTableMetrics = useMemo(() => metrics.filter(m => m.isActive && m.id !== 'metric-1'), [metrics]);
    
    const lineColors = useMemo(() => ['#FF4500', '#38BDF8', '#4ADE80', '#FACC15', '#A78BFA', '#F472B6', '#FB923C'], []);

    if (loading) return <div className="text-center p-10">Oyuncu profili yükleniyor...</div>;
    if (!player) return <div className="text-center p-10">Oyuncu bulunamadı.</div>;

    const ChartComponent = chartType === 'line' ? LineChart : BarChart;
    const ChartElement = chartType === 'line' ? Line : Bar;

    const CustomRadarTooltip: React.FC<any> = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <div className="bg-background p-2 border border-primary rounded-md shadow-lg">
                    <p className="font-bold">{data.payload.subject}</p>
                    <p className="text-primary">{`Değer: ${Number(data.payload.rawValue).toFixed(2)}`}</p>
                </div>
            );
        }
        return null;
    };


    return (
        <div className="space-y-6">
            {confirmation.isOpen && <ConfirmationModal {...confirmation} onCancel={() => setConfirmation({ ...confirmation, isOpen: false })} />}
            {modal === 'injury' && <InjuryModal player={player} onUpdate={handlePlayerUpdate} onClose={() => setModal(null)} />}
            {modal === 'injuryHistory' && <InjuryHistoryModal player={player} onUpdate={handlePlayerUpdate} onClose={() => setModal(null)} />}
            {modal === 'note' && <NoteModal note={editingNote} player={player} onUpdate={handlePlayerUpdate} onClose={() => setModal(null)} onConfirm={() => {setModal(null); setEditingNote(null); }} />}
            {modal === 'addMeasurement' && <AddMeasurementModal player={player} metrics={metrics} onClose={() => setModal(null)} onSave={handlePlayerUpdate} />}
            {modal === 'editMeasurement' && editingMeasurement && <EditMeasurementModal player={player} measurement={editingMeasurement} metrics={metrics} onClose={() => { setModal(null); setEditingMeasurement(null); }} onSave={fetchData} />}
            {modal === 'editInfo' && <EditPlayerInfoModal player={player} onClose={() => setModal(null)} onSave={handlePlayerUpdate} onDelete={handleDeletePlayer} />}


            <div className="bg-card p-6 rounded-lg flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                <img src={player.avatarUrl} alt={player.name} className="w-24 h-24 rounded-full ring-4 ring-primary"/>
                <div className="flex-grow text-center md:text-left">
                    <h2 className="text-3xl font-bold flex items-center justify-center md:justify-start gap-3">{player.name} {latestStats.age !== undefined && <span className="text-xl text-text-dark">({latestStats.age} yaşında)</span>}</h2>
                    <p className="text-text-dark">{player.position}</p>
                     {player.injury && (
                        <div className="mt-2 flex items-center justify-center md:justify-start space-x-2 bg-red-900/50 text-red-300 px-3 py-1 rounded-full text-sm">
                            {ICONS.INJURY}
                            <span>{player.injury.description} ({player.injury.estimatedRecovery})</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-4 bg-background p-3 rounded-lg">
                       <StatDisplay label="Boy" value={latestStats.height} unit="cm" decimalPlaces={0} />
                       <StatDisplay label="Kilo" value={latestStats.weight} unit="kg" decimalPlaces={2} />
                       <StatDisplay label="Yağ Oranı" value={latestStats.fat} unit="%" decimalPlaces={2} />
                    </div>
                    <button onClick={() => setModal('editInfo')} className="bg-secondary p-3 rounded-lg hover:bg-primary transition-colors" title="Oyuncu Bilgilerini Düzenle">{ICONS.EDIT}</button>
                </div>
            </div>
            
            <div className="flex justify-start space-x-4">
                <button onClick={() => setModal('injury')} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Sakatlık Durumunu Yönet
                </button>
                 <button onClick={() => setModal('injuryHistory')} className="bg-secondary hover:bg-card text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Sakatlık Geçmişi
                </button>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-card p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Genel Bakış</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                            <PolarGrid stroke="#4A5568" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#A0A0B0', fontSize: 12 }} />
                            <PolarRadiusAxis tick={false} axisLine={false} />
                            <Tooltip content={<CustomRadarTooltip />} />
                            <Radar name={player.name} dataKey="value" stroke="#FF4500" fill="#FF4500" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-3 bg-card p-6 rounded-lg">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Performans Değişim Grafiği</h3>
                        <div className="flex space-x-1 bg-secondary p-1 rounded-md">
                            <button onClick={() => setChartType('line')} className={`px-3 py-1 text-sm rounded ${chartType === 'line' ? 'bg-primary text-white' : 'text-text-dark'}`}>Çizgi</button>
                            <button onClick={() => setChartType('bar')} className={`px-3 py-1 text-sm rounded ${chartType === 'bar' ? 'bg-primary text-white' : 'text-text-dark'}`}>Sütun</button>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                         <ChartComponent data={formattedChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" stroke="#FF4500" />
                            <YAxis yAxisId="right" orientation="right" stroke="#38BDF8" />
                            <Tooltip formatter={(value) => typeof value === 'number' ? value.toFixed(2) : value} contentStyle={{ backgroundColor: '#161625', border: '1px solid #FF4500' }}/>
                            <Legend />
                            {selectedMetrics.map((metricId, index) => {
                                const metric = metrics.find(m => m.id === metricId);
                                if (!metric) return null;
                                const yAxisId = index % 2 === 0 ? "left" : "right";
                                const color = lineColors[index % lineColors.length];
                                return <ChartElement key={metric.id} yAxisId={yAxisId} type="monotone" dataKey={metric.name} stroke={chartType === 'line' ? color : undefined} fill={color} activeDot={chartType === 'line' ? { r: 8 } : undefined} name={`${metric.name} (${metric.unit})`} />
                            })}
                        </ChartComponent>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4 text-sm">
                        {chartableMetrics.map(metric => (
                            <label key={metric.id} className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={selectedMetrics.includes(metric.id)}
                                    onChange={() => handleMetricSelection(metric.id)}
                                    className="form-checkbox h-4 w-4 text-primary bg-gray-800 border-gray-600 rounded focus:ring-primary"
                                />
                                <span>{metric.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

             <div className="bg-card p-6 rounded-lg">
                <div className="flex justify-between items-center">
                    <div className="flex space-x-1 border-b-2 border-card">
                         <button onClick={() => setMeasurementTab('history')} className={`px-4 py-2 font-semibold ${measurementTab === 'history' ? 'border-b-2 border-primary text-text-light' : 'text-text-dark'}`}>Ölçüm Geçmişi</button>
                         <button onClick={() => setMeasurementTab('table')} className={`px-4 py-2 font-semibold ${measurementTab === 'table' ? 'border-b-2 border-primary text-text-light' : 'text-text-dark'}`}>Veri Tablosu</button>
                         <button onClick={() => setMeasurementTab('survey')} className={`px-4 py-2 font-semibold ${measurementTab === 'survey' ? 'border-b-2 border-primary text-text-light' : 'text-text-dark'}`}>Anket Geçmişi</button>
                    </div>
                    <button onClick={() => setModal('addMeasurement')} className="bg-primary px-4 py-2 rounded-lg text-white font-semibold hover:bg-primary-dark text-sm">Yeni Ölçüm Ekle</button>
                </div>
                <div className="mt-4">
                    {measurementTab === 'history' && (
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-card">
                                    <tr className="border-b border-gray-700">
                                        <th className="p-3">Tarih</th>
                                        <th className="p-3">Ölçüm</th>
                                        <th className="p-3">Değer</th>
                                        <th className="p-3 text-right">Eylemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {player.measurements.slice().reverse().map(m => {
                                        const metric = metrics.find(met => met.id === m.metricId);
                                        if (!metric) return null;
                                        return (
                                            <tr key={m.id} className="border-b border-gray-800 hover:bg-background">
                                                <td className="p-3 text-text-dark">{new Date(m.date).toLocaleDateString('tr-TR')}</td>
                                                <td className="p-3 font-medium">{metric?.name}</td>
                                                <td className="p-3 text-primary font-semibold">{m.value.toFixed(2)} {metric?.unit}</td>
                                                <td className="p-3 text-right">
                                                    <div className="flex items-center justify-end space-x-3">
                                                        <button onClick={() => { setEditingMeasurement(m); setModal('editMeasurement'); }} className="text-text-dark hover:text-white">{ICONS.EDIT}</button>
                                                        <button onClick={() => handleDeleteMeasurement(m.id)} className="text-text-dark hover:text-red-500">{ICONS.DELETE}</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {measurementTab === 'table' && (
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-left table-fixed">
                                <thead className="sticky top-0 bg-card">
                                    <tr className="border-b border-gray-700">
                                        <th className="p-3 w-32">Tarih</th>
                                        {pivotTableMetrics.map(m => (
                                            <th key={m.id} className="p-3 w-32 text-center">{m.name}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {chartData.map((dataPoint, index) => (
                                        <tr key={index} className="border-b border-gray-800 hover:bg-background">
                                            <td className="p-3 text-text-dark font-semibold">{dataPoint.date}</td>
                                            {pivotTableMetrics.map(m => (
                                                <td key={m.id} className="p-3 text-center">
                                                    {typeof dataPoint[m.name] === 'number' ? dataPoint[m.name].toFixed(2) : (dataPoint[m.name] ?? '-')}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                     {measurementTab === 'survey' && (
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-card">
                                    <tr className="border-b border-gray-700">
                                        <th className="p-3">Tarih</th>
                                        {surveyQuestions.filter(q => q.isActive).map(q => (
                                            <th key={q.id} className="p-3 text-center">{q.label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {player.dailySurveys.slice().reverse().map(survey => (
                                        <tr key={survey.date} className="border-b border-gray-800 hover:bg-background">
                                            <td className="p-3 text-text-dark">{new Date(survey.date).toLocaleDateString('tr-TR')}</td>
                                            {surveyQuestions.filter(q => q.isActive).map(q => (
                                                <td key={q.id} className="p-3 text-center">{survey[q.key] ?? '-'}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-card p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Notlar</h3>
                    <button onClick={() => { setEditingNote(null); setModal('note'); }} className="bg-primary px-4 py-2 rounded-lg text-white font-semibold hover:bg-primary-dark text-sm">Yeni Not Ekle</button>
                </div>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                     {player.notes.length > 0 ? player.notes.slice().reverse().map(note => (
                         <div key={note.id} className="p-3 bg-background rounded flex justify-between items-start">
                             <div>
                                <p className="text-sm">{note.text}</p>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-text-dark">{new Date(note.date).toLocaleDateString('tr-TR')}</span>
                                    {!note.isPublic && <span className="text-xs px-2 py-0.5 bg-secondary rounded-full">Gizli</span>}
                                </div>
                             </div>
                             <div className="flex space-x-2">
                                <button onClick={() => handleEditNote(note)} className="text-text-dark hover:text-white">{ICONS.EDIT}</button>
                                <button onClick={() => handleDeleteNote(note.id)} className="text-text-dark hover:text-red-500">{ICONS.DELETE}</button>
                             </div>
                         </div>
                     )) : <p className="text-text-dark text-center">Bu oyuncu için henüz not eklenmemiş.</p>}
                </div>
            </div>
        </div>
    );
};

export default PlayerProfile;