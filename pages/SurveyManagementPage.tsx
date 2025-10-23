import React, { useState, useEffect } from 'react';
import { SurveyQuestion } from '../types';
import { api } from '../services/api';
import { ICONS } from '../constants';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
);

const ConfirmationModal: React.FC<{ title: string, message: string, onConfirm: () => void, onCancel: () => void }> = ({ title, message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{title}</h3>
            <p className="text-text-dark mb-6">{message}</p>
            <div className="flex justify-end space-x-4">
                <button onClick={onCancel} className="bg-secondary hover:bg-background text-white font-bold py-2 px-4 rounded">İptal</button>
                <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Onayla</button>
            </div>
        </div>
    </div>
);


const SurveyQuestionModal: React.FC<{ question: SurveyQuestion | null; onClose: () => void; onSave: () => void; }> = ({ question, onClose, onSave }) => {
    const [label, setLabel] = useState(question?.label || '');
    const [type, setType] = useState<SurveyQuestion['type']>(question?.type || 'range');
    const isEditing = !!question;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const questionData: Partial<SurveyQuestion> = { label, type };
        
        try {
            if (isEditing) {
                await api.updateSurveyQuestion(question.id, questionData);
            } else {
                const key = label.toLowerCase().replace(/[^a-z0-9]/g, '_') + `_${Date.now()}`;
                await api.addSurveyQuestion({ ...questionData, key, isActive: true } as Omit<SurveyQuestion, 'id'>);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to save survey question", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{isEditing ? "Soruyu Düzenle" : "Yeni Soru Ekle"}</h3>
                    <button onClick={onClose} className="text-text-dark hover:text-text-light text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-dark">Soru Metni</label>
                        <input type="text" value={label} onChange={e => setLabel(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-dark">Cevap Tipi</label>
                        <select value={type} onChange={e => setType(e.target.value as SurveyQuestion['type'])} className="mt-1 block w-full px-3 py-2 bg-background border border-gray-700 rounded-md">
                            <option value="range">Kaydırma Çubuğu (1-9)</option>
                            <option value="number">Sayı Girişi</option>
                            <option value="textarea">Metin Alanı</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark font-semibold">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const SurveyManagementPage: React.FC = () => {
    const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [confirmation, setConfirmation] = useState({ isOpen: false, onConfirm: () => {} });

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const data = await api.getSurveyQuestions();
            setQuestions(data);
        } catch (error) {
            console.error("Failed to fetch survey questions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleToggle = async (question: SurveyQuestion) => {
        try {
            await api.updateSurveyQuestion(question.id, { isActive: !question.isActive });
            fetchQuestions();
        } catch (error) {
            console.error("Failed to update survey question status:", error);
        }
    };
    
    const handleDelete = (questionId: string) => {
        setConfirmation({
            isOpen: true,
            onConfirm: async () => {
                await api.deleteSurveyQuestion(questionId);
                fetchQuestions();
                setConfirmation({ isOpen: false, onConfirm: () => {} });
            }
        });
    };

    const handleEdit = (question: SurveyQuestion) => {
        setEditingQuestion(question);
        setShowModal(true);
    };

    const handleAdd = () => {
        setEditingQuestion(null);
        setShowModal(true);
    };
    
    if (loading) {
        return <div className="text-center p-10">Anket soruları yükleniyor...</div>;
    }

    return (
        <div className="space-y-6">
            {showModal && <SurveyQuestionModal question={editingQuestion} onClose={() => setShowModal(false)} onSave={fetchQuestions} />}
            {confirmation.isOpen && <ConfirmationModal title="Soruyu Sil" message="Bu soruyu kalıcı olarak silmek istediğinizden emin misiniz?" onConfirm={confirmation.onConfirm} onCancel={() => setConfirmation({ isOpen: false, onConfirm: () => {} })} />}
            <div className="bg-card p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold">Anket Yönetimi</h2>
                        <p className="text-text-dark">Oyuncuların dolduracağı anket sorularını buradan yönetin.</p>
                    </div>
                    <button onClick={handleAdd} className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark font-semibold">
                        Yeni Soru Ekle
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="p-3">Aktif</th>
                                <th className="p-3">Soru Metni</th>
                                <th className="p-3">Cevap Tipi</th>
                                <th className="p-3 text-right">Eylemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {questions.map(question => (
                                <tr key={question.id} className="border-b border-gray-800">
                                    <td className="p-3">
                                        <ToggleSwitch checked={question.isActive} onChange={() => handleToggle(question)} />
                                    </td>
                                    <td className="p-3 font-medium">{question.label}</td>
                                    <td className="p-3 text-text-dark">{question.type}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button onClick={() => handleEdit(question)} className="text-text-dark hover:text-white">{ICONS.EDIT}</button>
                                            <button onClick={() => handleDelete(question.id)} className="text-text-dark hover:text-red-500">{ICONS.DELETE}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SurveyManagementPage;