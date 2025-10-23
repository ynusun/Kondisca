
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SurveyQuestion, DailySurvey } from '../types';

const RangeSlider: React.FC<{ value: number, setValue: (value: number) => void, label: string }> = ({ value, setValue, label }) => {
    return (
        <div>
            <label className="block text-lg font-medium mb-2">{label}</label>
            <div className="flex items-center space-x-4">
                <input
                    type="range"
                    min="1"
                    max="9"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg"
                />
                <span className="text-xl font-bold text-primary w-8 text-center">{value}</span>
            </div>
        </div>
    );
};

const DailySurvey: React.FC = () => {
    const { user } = useAuth();
    const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
    const [answers, setAnswers] = useState<Partial<Omit<DailySurvey, 'date'>>>({
        sleepHours: 8,
        sleepQuality: 5,
        soreness: 4,
        painDetails: ''
    });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const allQuestions = await api.getSurveyQuestions();
                setQuestions(allQuestions.filter(q => q.isActive));
            } catch (error) {
                console.error("Failed to fetch survey questions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    const handleAnswerChange = (key: keyof Omit<DailySurvey, 'date'>, value: string | number) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert('Anketi göndermek için giriş yapmış olmalısınız.');
            return;
        }
        setIsSubmitting(true);
        try {
            await api.submitDailySurvey(user.id, {
                sleepHours: answers.sleepHours ?? 0,
                sleepQuality: answers.sleepQuality ?? 1,
                soreness: answers.soreness ?? 1,
                painDetails: answers.painDetails ?? ''
            });
            alert('Anket başarıyla gönderildi!');
            navigate('/');
        } catch (error) {
            console.error("Failed to submit survey", error);
            alert('Anket gönderilirken bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) {
        return <div className="text-center p-10">Anket yükleniyor...</div>;
    }

    const renderQuestion = (q: SurveyQuestion) => {
        switch (q.type) {
            case 'number':
                return (
                    <div key={q.id}>
                        <label className="block text-lg font-medium mb-2">{q.label}</label>
                        <input
                            type="number"
                            value={answers[q.key] as number || ''}
                            onChange={(e) => handleAnswerChange(q.key, Number(e.target.value))}
                            min="0" max="24" step="0.5"
                            className="w-full px-4 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                );
            case 'range':
                return (
                    <RangeSlider
                        key={q.id}
                        value={answers[q.key] as number || 5}
                        setValue={(v) => handleAnswerChange(q.key, v)}
                        label={q.label}
                    />
                );
            case 'textarea':
                return (
                    <div key={q.id}>
                        <label htmlFor={q.key} className="block text-lg font-medium mb-2">{q.label}</label>
                        <textarea
                            id={q.key}
                            value={answers[q.key] as string || ''}
                            onChange={(e) => handleAnswerChange(q.key, e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 bg-background border border-gray-700 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            placeholder="Örn: Sağ dizimde hafif bir sızı var."
                        />
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <div className="max-w-2xl mx-auto bg-card p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-primary">Günlük Sağlık Anketi</h2>
            <p className="text-center text-text-dark mb-8">Performans takibin için bu anketi her gün doldurman önemlidir.</p>
            
            <form onSubmit={handleSubmit} className="space-y-8">
                {questions.map(renderQuestion)}
                <div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary-dark font-semibold text-lg transition duration-300 disabled:bg-gray-600"
                    >
                        {isSubmitting ? 'Gönderiliyor...' : 'Anketi Gönder'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DailySurvey;